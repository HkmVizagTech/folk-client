import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '../components/ui/Card'
import { MapPin, Calendar, Bus, UtensilsCrossed, Ticket, ChevronRight, Users, Clock } from 'lucide-react'

const TRIPS = [
  {
    title: 'Vrindavan Pilgrimage',
    location: 'Vrindavan, Uttar Pradesh',
    duration: '6 Days / 5 Nights',
    season: 'Kartik (Oct – Nov)',
    tag: 'Flagship',
    highlights: ['Darshan at 20+ temples', 'Radha Kund & Govardhan', 'Ganga aarti at Vrindavan'],
    color: 'from-saffron to-gold',
  },
  {
    title: 'Mayapur — Sri Dham',
    location: 'Mayapur, West Bengal',
    duration: '5 Days / 4 Nights',
    season: 'Jan – Feb',
    tag: 'Pilgrimage',
    highlights: ['Temple of Vedic Planetarium', 'Ganga boat ride', 'Bha-ga-vata classes'],
    color: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Karnataka Yatra',
    location: 'Udupi · Mangalore · Shringeri',
    duration: '4 Days / 3 Nights',
    season: 'Monsoon (Aug – Sep)',
    tag: 'South India',
    highlights: ['Udupi Krishna darshan', 'Coastal temples', 'Traditional prasadam'],
    color: 'from-blue-500 to-indigo-600',
  },
  {
    title: 'Hyderabad Heritage Trail',
    location: 'Greater Hyderabad',
    duration: '1 Day (Weekend)',
    season: 'Year-round',
    tag: 'Day Trip',
    highlights: ['Sri Simhachalam & ISKCON tours', 'Temple history walks', 'Picnic & kirtan'],
    color: 'from-rose-500 to-pink-600',
  },
  {
    title: 'Kerala Sadhu Sanga',
    location: 'Kerala Backwaters',
    duration: '7 Days / 6 Nights',
    season: 'Dec – Jan',
    tag: 'Retreat',
    highlights: ['Sadhu sanga & retreats', 'Backwater temple circuits', 'Sattvic local cuisine'],
    color: 'from-amber-500 to-orange-600',
  },
  {
    title: 'North Karnataka Circuit',
    location: 'Hampi · Badami · Aihole',
    duration: '3 Days / 2 Nights',
    season: 'Oct – Mar',
    tag: 'Heritage',
    highlights: ['UNESCO heritage sites', 'Ancient Krishna temples', 'Evening kirtans under the stars'],
    color: 'from-violet-500 to-purple-600',
  },
]

const Trips = () => {
  const [selected, setSelected] = useState(null)

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron/10 text-saffron-dark text-[11px] font-black uppercase tracking-widest">
            <Bus size={14} /> Trips & Yatras
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-[0.95]">
            Journey to the <span className="bg-gradient-to-r from-saffron to-gold bg-clip-text text-transparent">holy places</span>
          </h1>
          <p className="text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto">
            For over two decades FOLK has organised 100+ pilgrimage trips — each one a chance to deepen
            devotion, make lifelong friendships and see the sacred sites of India.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TRIPS.map((trip, i) => (
            <motion.div key={trip.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="h-full p-0 overflow-hidden bg-white/70">
                <div className={`h-28 bg-gradient-to-br ${trip.color} p-5 flex items-end justify-between`}>
                  <span className="text-white font-black uppercase tracking-widest text-sm italic drop-shadow">{trip.tag}</span>
                  <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
                    <MapPin size={18} />
                  </span>
                </div>
                <div className="p-5 sm:p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">{trip.title}</h3>
                    <p className="text-xs text-gray-400 font-bold mt-1">{trip.location}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-black text-gray-500">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100"><Calendar size={12} className="text-saffron" /> {trip.duration}</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100"><Clock size={12} className="text-saffron" /> {trip.season}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {trip.highlights.map(h => (
                      <li key={h} className="flex items-start gap-2 text-xs text-gray-500 font-medium">
                        <ChevronRight size={14} className="text-saffron shrink-0 mt-0.5" /> {h}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setSelected(trip)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all active:scale-95"
                  >
                    <Ticket size={14} /> Register Interest
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="flex flex-col sm:flex-row items-center justify-between gap-5 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-saffron/10 text-saffron flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 uppercase tracking-tight">Group rates & custom yatras</h3>
                <p className="text-sm text-gray-500 font-medium">Families, colleges and corporate groups welcome.</p>
              </div>
            </div>
            <a
              href="https://wa.me/919154881444"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-saffron text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-saffron/25 hover:scale-[1.02] transition-all active:scale-95 shrink-0"
            >
              <UtensilsCrossed size={14} /> Plan with us
            </a>
          </Card>
        </motion.div>
      </div>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-premium-xl"
            >
              <div className={`h-24 bg-gradient-to-br ${selected.color} p-5 flex items-end`}>
                <span className="text-white font-black uppercase tracking-widest text-sm italic drop-shadow">{selected.tag}</span>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-black text-gray-900 uppercase italic">{selected.title}</h3>
                <p className="text-xs text-gray-400 font-bold flex items-center gap-1.5"><MapPin size={14} className="text-saffron" /> {selected.location}</p>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Registration for {selected.title} opens soon. Drop your interest and the yatra team will
                  reach out with dates, itinerary and pricing.
                </p>
                <a
                  href={`https://wa.me/919154881444?text=${encodeURIComponent(`Hi, I would like to register interest for the ${selected.title} (${selected.location}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-saffron text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-saffron/25 hover:scale-[1.02] transition-all active:scale-95"
                >
                  <Ticket size={14} /> Register via WhatsApp
                </a>
                <button onClick={() => setSelected(null)} className="w-full py-2 text-center text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Trips