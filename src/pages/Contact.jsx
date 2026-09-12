import React from 'react'
import { motion } from 'framer-motion'
import Card from '../components/ui/Card'
import { MapPin, Phone, Mail, Instagram, Facebook, Youtube, MessageCircle, Clock, Send, Loader2 } from 'lucide-react'
import { useState } from 'react'

const CONTACTS = [
  { icon: <MapPin size={22} />, label: 'Temple & Office', value: 'Hare Krishna Golden Temple, MLA Colony, Road #12, Banjara Hills, Hyderabad — 500034', color: 'text-saffron bg-saffron/10' },
  { icon: <Phone size={22} />, label: 'Phone / WhatsApp', value: '+91-91548 81444', color: 'text-emerald-600 bg-emerald-50' },
  { icon: <Mail size={22} />, label: 'Email', value: 'folkconnect@hkmhyderabad.org', color: 'text-blue-600 bg-blue-50' },
  { icon: <Clock size={22} />, label: 'Temple timings', value: 'Mangala-arati 4:30 AM · Temple open 4:30 AM – 9:00 PM · Sunday Feast 6:00 PM', color: 'text-violet-500 bg-violet-50' },
]

const SOCIALS = [
  { icon: <Instagram size={20} />, label: 'Instagram', href: 'https://www.instagram.com' },
  { icon: <Facebook size={20} />, label: 'Facebook', href: 'https://www.facebook.com' },
  { icon: <Youtube size={20} />, label: 'YouTube', href: 'https://www.youtube.com' },
  { icon: <MessageCircle size={20} />, label: 'WhatsApp', href: 'https://wa.me/919154881444' },
]

const Contact = () => {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSending(true)
    setTimeout(() => { setSending(false); setSent(true) }, 900)
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron/10 text-saffron-dark text-[11px] font-black uppercase tracking-widest">
            <MessageCircle size={14} /> Contact Us
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-[0.95]">
            We would love to <span className="bg-gradient-to-r from-saffron to-gold bg-clip-text text-transparent">hear from you</span>
          </h1>
          <p className="text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto">
            Questions about events, trips, Gita classes, seva or anything else — reach out to us directly.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5">
          {CONTACTS.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="flex items-start gap-4 p-5 sm:p-6">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${c.color}`}>{c.icon}</div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{c.label}</p>
                  <p className="text-sm font-bold text-gray-700 leading-relaxed">{c.value}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
            <Card className="h-full p-6 sm:p-8">
              <h3 className="font-black text-gray-900 uppercase italic tracking-tight text-lg mb-5">Connect with us</h3>
              <div className="grid grid-cols-2 gap-3">
                {SOCIALS.map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50/70 border border-gray-100 hover:bg-saffron/10 hover:border-saffron/20 hover:text-saffron-dark transition-all text-gray-500 group"
                  >
                    <span className="text-gray-400 group-hover:text-saffron transition-colors">{s.icon}</span>
                    <span className="text-xs font-black uppercase tracking-wider">{s.label}</span>
                  </a>
                ))}
              </div>

              <div className="mt-6 rounded-2xl overflow-hidden border border-gray-100 shadow-lg h-48 bg-gray-100 relative">
                <iframe
                  title="Hare Krishna Golden Temple, Hyderabad"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=78.44%2C17.42%2C78.46%2C17.44&layer=mapnik&marker=17.43%2C78.45"
                  className="absolute inset-0 w-full h-full"
                  loading="lazy"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-bold mt-3">Hare Krishna Golden Temple · Banjara Hills, Hyderabad</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3">
            <Card className="h-full p-6 sm:p-8">
              <h3 className="font-black text-gray-900 uppercase italic tracking-tight text-lg mb-2">Send a message</h3>
              <p className="text-xs text-gray-400 font-medium mb-6">We typically reply within 24 hours.</p>
              {sent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                    <Send size={26} />
                  </div>
                  <h4 className="font-black text-gray-900 uppercase tracking-tight">Message sent!</h4>
                  <p className="text-sm text-gray-400 font-medium mt-1">Thank you, we will get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input required placeholder="Your name" className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:border-saffron focus:outline-none text-sm font-medium placeholder-gray-300 transition-colors" />
                    <input required type="email" placeholder="Email address" className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:border-saffron focus:outline-none text-sm font-medium placeholder-gray-300 transition-colors" />
                  </div>
                  <input required placeholder="Subject" className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:border-saffron focus:outline-none text-sm font-medium placeholder-gray-300 transition-colors" />
                  <textarea required rows="5" placeholder="Your message..." className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:border-saffron focus:outline-none text-sm font-medium placeholder-gray-300 transition-colors resize-none" />
                  <button type="submit" disabled={sending} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-saffron text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-saffron/25 hover:scale-[1.02] hover:bg-saffron-dark transition-all active:scale-95 disabled:opacity-60">
                    {sending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Send size={16} /> Send message</>}
                  </button>
                </form>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Contact