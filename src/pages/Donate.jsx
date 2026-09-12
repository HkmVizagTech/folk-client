import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Card from '../components/ui/Card'
import { HeartHandshake, Gift, UtensilsCrossed, BookOpen, PartyPopper, Loader2, Check } from 'lucide-react'
import { handlePayment } from '../lib/razorpay'
import { useAuth } from '../hooks/useAuth'

const CAUSES = [
  { id: 'general', icon: <HeartHandshake size={24} />, title: 'General Donation', desc: 'Support the ongoing programs and maintenance of the temple and community.', gradient: 'from-saffron to-gold', preset: 1101 },
  { id: 'sundaylovefeast', icon: <UtensilsCrossed size={24} />, title: 'Sunday Love Feast', desc: 'Sponsor the free Sunday feast that feeds every visitor prasadam.', gradient: 'from-rose-500 to-pink-600', preset: 501 },
  { id: 'gitadaan', icon: <BookOpen size={24} />, title: 'Gita Daan', desc: 'Gift an authentic Bhagavad-gita to a devotee, student or family.', gradient: 'from-blue-500 to-indigo-600', preset: 301 },
  { id: 'festival', icon: <PartyPopper size={24} />, title: 'Festival Donation', desc: 'Help fund Janmastami, Ratha Yatra and the other great festivals.', gradient: 'from-emerald-500 to-teal-600', preset: 1101 },
]

const Donate = () => {
  const { user } = useAuth()
  const [selected, setSelected] = useState('general')
  const [amount, setAmount] = useState('1101')
  const [paying, setPaying] = useState(false)

  const cause = CAUSES.find(c => c.id === selected)

  const presets = selected === 'gitadaan' ? [301, 501, 1101, 5101] : [501, 1101, 2101, 5101]

  const handleDonate = async () => {
    setPaying(true)
    await handlePayment(user, amount, `${cause.title} donation`)
    setPaying(false)
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron/10 text-saffron-dark text-[11px] font-black uppercase tracking-widest">
            <Gift size={14} /> Donations
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-[0.95]">
            Give with <span className="bg-gradient-to-r from-saffron to-gold bg-clip-text text-transparent">devotion</span>
          </h1>
          <p className="text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto">
            Every contribution keeps the temple programs, prasadam distribution and Gita education
            flourishing. Choose a cause and give securely via UPI or card.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CAUSES.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => { setSelected(c.id); setAmount(String(c.preset)) }}
              className="group text-left"
            >
              <Card className={`h-full p-5 sm:p-6 transition-all ring-2 ${selected === c.id ? 'ring-saffron bg-white' : 'ring-transparent hover:ring-saffron/20'}`}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                  {c.icon}
                </div>
                <h3 className="font-black text-gray-900 uppercase italic tracking-tight text-sm">{c.title}</h3>
                <p className="text-xs text-gray-400 font-medium mt-2 leading-relaxed">{c.desc}</p>
                {selected === c.id && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-saffron uppercase tracking-widest">
                    <Check size={12} /> Selected
                  </motion.span>
                )}
              </Card>
            </motion.button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="max-w-xl mx-auto p-6 sm:p-8">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cause.gradient} flex items-center justify-center text-white mb-5 shadow-lg`}>
              {cause.icon}
            </div>
            <h3 className="font-black text-gray-900 uppercase italic tracking-tight">{cause.title}</h3>
            <p className="text-sm text-gray-400 font-medium mt-1 mb-6">{cause.desc}</p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {presets.map(p => (
                <button
                  key={p}
                  onClick={() => setAmount(String(p))}
                  className={`py-3 rounded-2xl font-black text-sm transition-all ${
                    amount === String(p)
                      ? 'bg-saffron text-white shadow-lg shadow-saffron/25 scale-[1.03]'
                      : 'bg-gray-50 text-gray-500 hover:bg-saffron/10 hover:text-saffron-dark border border-gray-100'
                  }`}
                >
                  ₹{p.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">₹</span>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter custom amount"
                className="w-full pl-9 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:border-saffron focus:outline-none text-sm font-bold text-gray-700 placeholder-gray-300"
              />
            </div>

            <button
              onClick={handleDonate}
              disabled={paying || !amount || Number(amount) <= 0}
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-saffron to-gold text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-saffron/25 hover:scale-[1.02] hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {paying ? <><Loader2 size={16} className="animate-spin" /> Opening payment...</> : <><Gift size={16} /> Donate ₹{Number(amount || 0).toLocaleString('en-IN')}</>}
            </button>

            <p className="text-[10px] text-gray-300 font-medium text-center mt-4">
              Secure payments powered by Razorpay · UPI, cards & net-banking · 80G receipts available
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default Donate