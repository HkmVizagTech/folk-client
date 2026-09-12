import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '../components/ui/Card'
import { Calendar as CalendarIcon, Moon, Star, Flame, ChevronDown, Sunrise } from 'lucide-react'

const OBSERVANCES = [
  { name: 'Ekadashi Fasting', desc: 'Fast from grains & beans; the best day to intensify chanting. Occurs twice each month (bright & dark fortnight).', icon: <Moon size={22} />, color: 'text-indigo-500 bg-indigo-50' },
  { name: 'Janmastami', desc: 'Appearance day of Lord Krishna. Midnight darshan, grand arati, and the famous Jhulanotsava swing festival.', icon: <Star size={22} />, color: 'text-saffron bg-saffron/10' },
  { name: 'Ratha Yatra', desc: 'The Festival of the Chariots. Celebrate by pulling the deities\' chariots in a joyful street procession.', icon: <Sunrise size={22} />, color: 'text-amber-500 bg-amber-50' },
  { name: 'Gaura Purnima', desc: 'Appearance day of Sri Chaitanya Mahaprabhu, who taught the world to chant the holy name in great happiness.', icon: <Flame size={22} />, color: 'text-rose-500 bg-rose-50' },
  { name: 'Kartik Month', desc: 'The festival month — vrata, deepadan, and japa intensify. The most merciful time of the year.', icon: <CalendarIcon size={22} />, color: 'text-emerald-600 bg-emerald-50' },
  { name: 'Gita Jayanti', desc: 'The day the Bhagavad-gita was spoken 5,000 years ago at Kurukshetra. Marked with Gita recitation & classes.', icon: <Star size={22} />, color: 'text-violet-500 bg-violet-50' },
]

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const HIGHLIGHTS = {
  1: 'Gita Jayanti / Utpanna Ekadashi',
  2: 'Gaura Purnima',
  6: 'Ratha Yatra (Chariot Festival)',
  8: 'Krishna Janmastami',
  9: 'Radhastami · Darbhangi',
  11: 'Kartik-Maas begins · Deepadan',
}

const Calendar = () => {
  const [expanded, setExpanded] = useState(null)
  const [month, setMonth] = useState(new Date().getMonth())

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron/10 text-saffron-dark text-[11px] font-black uppercase tracking-widest">
            <CalendarIcon size={14} /> Vaishnava Calendar
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-[0.95]">
            Festivals & <span className="bg-gradient-to-r from-saffron to-gold bg-clip-text text-transparent">fasting days</span>
          </h1>
          <p className="text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto">
            The Vedic lunar calendar marks Ekadashis, appearance days and the most auspicious months of
            the year. Plan your spiritual life around them.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{MONTHS[month]} {new Date().getFullYear()}</h3>
                  <p className="text-xs text-gray-400 font-bold mt-1">Lunar highlights this month</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMonth(m => (m + 11) % 12)} aria-label="Previous month" className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-saffron/10 text-gray-500 hover:text-saffron font-black transition-all">‹</button>
                  <button onClick={() => setMonth(m => (m + 1) % 12)} aria-label="Next month" className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-saffron/10 text-gray-500 hover:text-saffron font-black transition-all">›</button>
                </div>
              </div>
              <div className="w-12 h-1.5 rounded-full bg-gradient-to-r from-saffron to-gold mb-4" />
              <div className={`p-6 rounded-3xl bg-gradient-to-br from-saffron/10 to-gold/10 border border-saffron/15 min-h-[120px] flex flex-col justify-center`}>
                <p className="text-lg sm:text-xl font-black text-saffron-dark uppercase italic leading-snug">
                  {HIGHLIGHTS[month] || 'Nitya (daily) japa & class'}
                </p>
                <p className="text-xs text-gray-500 font-medium mt-2">Daily program continues: Mangala-arati 4:30 am · Japa class · Evening kirtan.</p>
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-saffron/10 text-saffron flex items-center justify-center">
                  <Moon size={22} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 uppercase tracking-tight">Ekadashi calendar</h3>
                  <p className="text-xs text-gray-400 font-bold">Twice each month, per the Vedic lunar day</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Ekadashi falls on the 11th day of both the waxing and waning moon. Fasting from grains,
                beans and spices is kept until the following sunrise. The most merciful of all fasting days —
                one can be fully satisfied by simply chanting and hearing hari-katha.
              </p>
              <a
                href="https://wa.me/919154881444"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-[11px] font-black text-saffron uppercase tracking-widest hover:gap-3 transition-all"
              >
                Get the monthly Ekadashi reminders <span className="text-saffron">→</span>
              </a>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Sacred occasions</h3>
            </div>
            {OBSERVANCES.map((obs, i) => (
              <motion.div key={obs.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-5 sm:p-6 hover:bg-white cursor-pointer" >
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 text-left"
                    aria-expanded={expanded === i}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${obs.color}`}>{obs.icon}</div>
                      <div>
                        <h4 className="font-black text-gray-900 uppercase tracking-tight text-sm">{obs.name}</h4>
                        <p className={`text-xs font-bold transition-colors ${expanded === i ? 'text-saffron' : 'text-gray-400'}`}>
                          {expanded === i ? 'Details' : 'Tap to view details'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown size={18} className={`text-gray-300 transition-transform shrink-0 ${expanded === i ? 'rotate-180 text-saffron' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {expanded === i && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden text-sm text-gray-500 font-medium leading-relaxed pr-10"
                      >
                        {obs.desc}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar