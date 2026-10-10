import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export const READER_ID = 'reader'

const teardown = async (qr) => {
  if (qr.isScanning) await qr.stop()
  await qr.clear()
}

/** Camera QR scanner for the check-in desk; owns the html5-qrcode instance. */
export const useQrScanner = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [cameras, setCameras] = useState([])
  const [cameraId, setCameraId] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  // A ref, not state: the unmount cleanup has to see the live instance, and a
  // second "Start" has to be able to tear the first one down.
  const scannerRef = useRef(null)

  // Leaving the page while the camera runs would leave the phone's camera on.
  useEffect(() => () => {
    const qr = scannerRef.current
    scannerRef.current = null
    if (qr) teardown(qr).catch(() => {})
  }, [])

  const stop = async () => {
    const qr = scannerRef.current
    if (!qr) return
    try {
      await teardown(qr)
    } catch (err) {
      console.error('Stop scanning error', err)
    } finally {
      scannerRef.current = null
      setScanning(false)
    }
  }

  const start = async () => {
    if (scanning) return
    try {
      // The previous instance (and its <video>) stays attached to the reader
      // element; a second scan would stack on top of it. Tear it down first.
      if (scannerRef.current) {
        const old = scannerRef.current
        scannerRef.current = null
        try { await teardown(old) } catch (cleanupError) { console.warn('Could not clean up the previous scanner:', cleanupError) }
      }
      const qr = new Html5Qrcode(READER_ID)
      scannerRef.current = qr
      await qr.start(
        cameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          setResult(text)
          qr.stop().then(() => setScanning(false)).catch(() => setScanning(false))
        },
        () => {},
      )
      setScanning(true)
      setError('')
    } catch (err) {
      console.error('Start scanning error', err)
      setScanning(false)
      setError(err?.message || 'Could not start the camera. Check camera permissions and try again.')
    }
  }

  const toggle = async () => {
    if (isOpen) {
      await stop()
      setIsOpen(false)
      return
    }
    setIsOpen(true)
    setResult(null)
    setError('')
    try {
      const devices = await Html5Qrcode.getCameras()
      if (devices?.length) {
        setCameras(devices)
        setCameraId(devices[0].id)
      }
    } catch (err) {
      // Say what actually went wrong: denied permission, insecure origin...
      console.error('Error getting cameras', err)
      setCameras([])
      setError(err?.message || 'Could not reach any camera. Allow camera access for this site and try again.')
    }
  }

  return { isOpen, cameras, cameraId, setCameraId, scanning, result, error, start, stop, toggle }
}
