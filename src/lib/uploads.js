import { callApi } from './api';
import { auth } from './firebase';
import { CONFIG } from '../config';

/**
 * Image uploads for trip covers, galleries and location photos.
 *
 * The browser compresses the picture and POSTs the raw bytes to our own
 * server, which forwards them to Cloudflare R2. Routing through the server
 * (rather than letting the browser PUT straight to R2 with a presigned URL)
 * is deliberate: CORS is a browser rule, so once the request to R2 is made
 * server-side there is no Origin, no preflight, and the bucket needs no CORS
 * policy at all.
 *
 * What gets stored on the trip is just the public URL string, so a trip row
 * stays small and the /trips list loads fast no matter how many photos a
 * yatra has.
 */

const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_QUALITY = 0.82;

/**
 * Draw the file to a canvas at a sane size and hand back a JPEG Blob.
 * Returns a Blob (not a data URI) so we upload raw bytes - base64 would add
 * a third again to every transfer for no reason.
 */
export const compressImage = (file, maxWidth = DEFAULT_MAX_WIDTH, quality = DEFAULT_QUALITY) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        // A white base matters for PNGs with transparency, which would
        // otherwise turn black once flattened into a JPEG.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Could not process that image.'));
          },
          'image/jpeg',
          quality
        );
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

/**
 * Compress → presign → PUT to R2. Resolves with the public URL to store.
 *
 * @param {File}   file
 * @param {object} opts  { folder, maxWidth, quality, onProgress }
 *                       folder groups objects in the bucket ('covers',
 *                       'gallery', 'locations'); the server sanitises it.
 */
export const uploadImage = async (file, opts = {}) => {
  const {
    folder = 'misc',
    maxWidth = DEFAULT_MAX_WIDTH,
    quality = DEFAULT_QUALITY,
    onProgress,
  } = opts;

  if (onProgress) onProgress('compressing');
  const blob = await compressImage(file, maxWidth, quality);

  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Please sign in again before uploading.');

  const base = (CONFIG.BACKEND_URL || '').replace(/\/+$/, '');
  if (!base) throw new Error('Backend URL is not configured, so uploads cannot run.');

  if (onProgress) onProgress('uploading');
  const response = await fetch(`${base}/uploadImage?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: {
      // Raw bytes, not multipart: the server reads this with express.raw().
      'Content-Type': 'image/jpeg',
      Authorization: `Bearer ${token}`,
    },
    body: blob,
  });

  if (!response.ok) {
    let message = `Upload failed (${response.status}).`;
    try {
      const body = await response.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      if (response.status === 413) message = 'That image is too large. Try a smaller one.';
    }
    throw new Error(message);
  }

  const { publicUrl } = await response.json();
  if (!publicUrl) throw new Error('The server did not return an image URL.');

  if (onProgress) onProgress('done');
  return publicUrl;
};

/** Best-effort cleanup when staff remove an image. Never throws. */
export const deleteUploadedImage = async (urlOrKey) => {
  if (!urlOrKey || typeof urlOrKey !== 'string') return false;
  // Legacy inline base64 images aren't in the bucket; nothing to delete.
  if (urlOrKey.startsWith('data:')) return false;
  try {
    await callApi('deleteUpload', { url: urlOrKey });
    return true;
  } catch (error) {
    console.warn('Could not delete uploaded image:', error?.message);
    return false;
  }
};

/** Whether the server has R2 configured, so the UI can say so up front. */
export const getUploadConfig = async () => {
  try {
    return await callApi('uploadConfig');
  } catch (error) {
    return { configured: false, error: error?.message };
  }
};

/**
 * Trips created before the move to R2 hold a `data:` URI; newer ones hold an
 * https URL. Both are valid <img src> values, so this is just a readable way
 * to ask which one we're looking at.
 */
export const isUploadedUrl = (value) =>
  typeof value === 'string' && /^https?:\/\//i.test(value);
