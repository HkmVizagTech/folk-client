import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '../components/ui/Card'
import { Camera, X, Image } from 'lucide-react'

const ALBUMS = [
  { id: 'contents', title: 'Festivals', count: 48, gradient: 'from-saffron to-gold' },
  { id: 'trips', title: 'Yatras & Trips', count: 76, gradient: 'from-emerald-500 to-teal-600' },
  { id: 'seva', title: 'Seva & Outreach', count: 39, gradient: 'from-blue-500 to-indigo-600' },
  { id: 'classes', title: 'Gita Classes', count: 27, gradient: 'from-violet-500 to-purple-600' },
  { id: 'projects', title: 'Sunday Clubs', count: 33, gradient: 'from-rose-500 to-pink-600' },
  { id: 'youth', title: 'Community & Youth', count: 52, gradient: 'from-amber-500 to-orange-600' },
]

const Gallery = () => {
  const [selected, setSelected] = useState(null)

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron/10 text-saffron-dark text-[11px] font-black uppercase tracking-widest">
            <Camera size={14} /> Our Gallery
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-[0.95]">
            Moments of <span className="bg-gradient-to-r from-saffron to-gold bg-clip-text text-transparent">devotion</span>
          </h1>
          <p className="text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto">
            A glimpse into the life of FOLK — festivals, yatras, seva and the community that makes it
            all happen.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ALBUMS.map((album, i) => (
            <motion.button
              key={album.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setSelected(album)}
              className="group text-left"
            >
              <Card className="p-0 overflow-hidden bg-white/70">
                <div className={`h-48 bg-gradient-to-br ${album.gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_70%)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Image size={28} />
                    </div>
                  </div>
                  <span className="absolute bottom-3 right-4 text-white/90 font-black text-xs tracking-widest">{album.count} photos</span>
                </div>
                <div className="p-5 flex items-center justify-between">
                  <h3 className="font-black text-gray-900 uppercase italic tracking-tight text-sm">{album.title}</h3>
                  <span className="text-[10px] font-black text-saffron uppercase tracking-widest group-hover:translate-x-1 transition-transform">Open →</span>
                </div>
              </Card>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="absolute inset-0 bg-gray-900/70 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-premium-xl"
            >
              <div className={`h-32 bg-gradient-to-br ${selected.gradient} flex items-center justify-center`}>
                <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-white">
                  <Image size={28} />
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-black text-gray-900 uppercase italic">{selected.title}</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">{selected.count} photos</p>
                <p className="text-xs text-gray-400 font-medium mt-4 leading-relaxed">
                  Full photo albums are shared on our social media. Follow FOLK Vizag to see the complete collection.
                </p>
                <div className="flex gap-3 mt-5">
                  <a
                    href="https://www.instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-saffron to-gold text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-saffron/25 hover:scale-[1.02] transition-all active:scale-95 text-center"
                  >
                    Instagram
                  </a>
                  <button
                    onClick={() => setSelected(null)}
                    className="px-5 py-3 rounded-2xl bg-gray-50 text-gray-500 font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all"
                  >
                    <X size={16} className="mx-auto" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Gallery