import React from 'react'
import { Card } from '../../../components/ui'
import QRView from '../../../components/qr/QRView'

const PassCard = ({ token, name }) => (
  <Card data-reveal className="flex flex-col items-center text-center lg:col-span-5">
    <p className="kicker">Vaikuntha pass</p>
    <h2 className="mt-1 font-display text-[22px] font-semibold text-ink">Your ID</h2>
    <div className="my-5 flex w-full justify-center overflow-hidden rounded-2xl border border-marigold/30 bg-paper p-4">
      {token ? <QRView value={token} name={name} size={150} /> : <p className="py-10 text-[14px] text-ink-muted">Your pass is being prepared.</p>}
    </div>
    <p className="max-w-[16rem] text-[13px] text-ink-muted">Permanent code for attendance &amp; prasadam distribution</p>
  </Card>
)

export default PassCard
