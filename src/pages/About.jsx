import React from 'react'
import { motion } from 'framer-motion'
import Card from '../components/ui/Card'
import { Feather, GraduationCap, Sparkles, Users, Heart, BookOpen, Leaf, HandHeart } from 'lucide-react'

const VALUES = [
  { icon: <Sparkles size={24} />, title: 'Art of Mind Control', desc: 'Harness the mind through the ancient science of mantra meditation — one round of japa transforms your whole day.' },
  { icon: <BookOpen size={24} />, title: 'Gita for Youth', desc: 'The Bhagavad-gita as a call to leadership. 6-session intro courses and leadership lessons that turn knowledge into character.' },
  { icon: <Leaf size={24} />, title: 'Intentional Living', desc: 'Rising before sunrise, a simple sattvic routine, and conscious technology use — a life of clarity and purpose.' },
  { icon: <HandHeart size={24} />, title: 'Selfless Service', desc: 'Volunteer seva that makes the community stronger — feeding drives, weekend clubs and everything in between.' },
]

const PILLARS = [
  { icon: <Feather size={26} />, title: 'Devotion', desc: 'Chanting, reading and hearing — the heart of community life.' },
  { icon: <Heart size={26} />, title: 'Service', desc: 'Everyone is welcome. Everyone has something to give.' },
  { icon: <Users size={26} />, title: 'Brotherhood', desc: '50,000+ devotees in Hyderabad live this bond every day.' },
  { icon: <GraduationCap size={26} />, title: 'Education', desc: 'Gita classes, courses and leadership development for all ages.' },
]

const STATS = [
  { value: '500+', label: 'Professionals educated' },
  { value: '200+', label: 'Weekend network members' },
  { value: '100+', label: 'Devotional trips & yatras' },
  { value: '2001', label: 'FOLK founded' },
]

const About = () => {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-3xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron/10 text-saffron-dark text-[11px] font-black uppercase tracking-widest">
            <GraduationCap size={14} /> About Us
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter uppercase italic leading-[0.95]">
            Who we <span className="bg-gradient-to-r from-saffron to-gold bg-clip-text text-transparent">are</span>
          </h1>
          <p className="text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto">
            FOLK is a Faternity Of Lifestyle K(f)ara-crétières — the devotional youth wing of ISKCON
            Hyderabad. We help professionals, students and families grow deeper in their spiritual life
            through meditation, Gita education, devotional service and community.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <Card className="p-6 bg-white/70 rounded-[1.75rem]">
                <p className="text-4xl font-black bg-gradient-to-r from-saffron to-gold bg-clip-text text-transparent">{s.value}</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">{s.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase italic mb-6 text-center">
            What we <span className="bg-gradient-to-r from-saffron to-gold bg-clip-text text-transparent">offer</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALUES.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-saffron to-gold flex items-center justify-center text-white mb-4 shadow-lg shadow-saffron/25">
                    {v.icon}
                  </div>
                  <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">{v.title}</h3>
                  <p className="text-sm text-gray-500 font-medium mt-2 leading-relaxed">{v.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase italic mb-6 text-center">
            Our <span className="bg-gradient-to-r from-saffron to-gold bg-clip-text text-transparent">pillars</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILLARS.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full text-center">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-saffron/10 text-saffron flex items-center justify-center mb-4">
                    {p.icon}
                  </div>
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">{p.title}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">{p.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-saffron to-gold text-white text-center p-8 sm:p-12 border-0">
            <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight mb-3">
              Join the Fraternity
            </h2>
            <p className="text-white/90 font-medium max-w-xl mx-auto text-sm sm:text-base leading-relaxed mb-6">
              Whether you are exploring spirituality for the first time or deepening an established
              practice, FOLK is a place to belong. Come for a Sunday feast, a Gita class or a yatra —
              you will always find a seat.
            </p>
            <a
              href="https://wa.me/919154881444"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-saffron-dark font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl hover:scale-[1.03] hover:shadow-white/30 transition-all active:scale-95"
            >
              Connect with us on WhatsApp
            </a>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default About