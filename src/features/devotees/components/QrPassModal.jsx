import React, { useState } from 'react'
import { QrCode } from 'lucide-react'
import { Button, Modal } from '../../../components/ui'
import QRView from '../../../components/qr/QRView'

const QrPassModal = ({ devotee, onClose, onGenerate }) => {
  const [busy, setBusy] = useState(false)
  const generate = async () => {
    setBusy(true)
    await onGenerate(devotee)
    setBusy(false)
  }

  return (
    <Modal open={!!devotee} onClose={onClose} title="Vaikuntha ID card" description="Permanent pass" size="sm">
      {devotee && (
        <div className="text-center">
          {devotee.qrToken ? (
            <QRView value={devotee.qrToken} name={devotee.name} />
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-paper/60 px-6 py-10">
              <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-saffron-50 text-saffron-dark"><QrCode size={24} aria-hidden="true" /></span>
              <p className="mb-4 text-[14px] text-ink-muted">No token yet</p>
              <Button loading={busy} onClick={generate}>Generate QR token</Button>
            </div>
          )}
          <p className="mt-6 text-[12px] font-semibold uppercase tracking-label text-ink-muted">
            Scan for attendance &amp; prasadam
            <span className="mt-1 block text-marigold-dark">FOLK Vizag Devotee Management</span>
          </p>
        </div>
      )}
    </Modal>
  )
}

export default QrPassModal
