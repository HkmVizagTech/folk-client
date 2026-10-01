import { callApi } from './api';

/**
 * Image uploads for trip covers, galleries and location photos.
 *
 * The browser compresses the picture, asks the server for a short-lived
 * presigned R2 URL, then PUTs the bytes STRAIGHT TO R2. The image never
 * passes through our API, which is what keeps the JSON body limit out of the
 * picture entirely - the old approach stuffed base64 into the document and
 * blew past it.
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

  if (onProgress) onProgress('requesting');
  const { uploadUrl, publicUrl } = await callApi('getUploadUrl', {
    contentType: 'image/jpeg',
    contentLength: blob.size,
    folder,
  });

  if (!uploadUrl || !publicUrl) {
    throw new Error('The server did not return an upload URL.');
  }

  if (onProgress) onProgress('uploading');
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    // Must match what was signed, or R2 rejects the PUT.
    headers: { 'Content-Type': 'image/jpeg' },
    body: blob,
  });

  if (!response.ok) {
    throw new Error(
      `Upload failed (${response.status}). If this keeps happening, check the bucket's CORS rules allow PUT from this site.`
    );
  }

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
