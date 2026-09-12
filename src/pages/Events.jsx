import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { auth, db } from '../lib/firebase'
import { 
  Calendar, MapPin, Tag, Users, ArrowRight, Loader2, Plus, X, Clock, Image as ImageIcon, CheckCircle2, XCircle, Filter, Sparkles, Megaphone, ChevronRight
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useFirestore } from '../hooks/useFirestore'
import { collection, addDoc, serverTimestamp, setDoc, doc, where, updateDoc, increment } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'

const Events = () => {
  const { user } = useAuth();
  const { data: firestoreEvents, loading: eventsLoading } = useFirestore('events');
  
  const regQuery = React.useMemo(() => [where('userId', '==', user?.uid || 'guest')], [user?.uid]);
  const { data: registrations } = useFirestore('registrations', regQuery);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState({});
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    category: 'Retreats',
    description: '',
    img: 'https://picsum.photos/seed/temple/800/400',
    attendees: '0'
  });

  const categories = ['All', 'Retreats', 'Kirtans', 'Yatras', 'Seminars', 'Other']
  
  const events = (firestoreEvents || []).slice().sort((a, b) => {
    const aTime = a.dateISO ? new Date(a.dateISO).getTime() : new Date(a.date).getTime();
    const bTime = b.dateISO ? new Date(b.dateISO).getTime() : new Date(b.date).getTime();
    return (aTime || 0) - (bTime || 0);
  });
  
  const filteredEvents = activeCategory === 'All' 
    ? events 
    : events.filter(e => e.category === activeCategory);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const rawDate = new Date(formData.date);
      const formattedDate = rawDate.toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit'
      });

      await addDoc(collection(db, 'events'), {
        ...formData,
        date: formattedDate,
        dateISO: rawDate.toISOString(),
        groupId: auth.currentUser?.uid || 'system',
        createdAt: serverTimestamp()
      });
      
      await addDoc(collection(db, 'notifications'), {
        type: 'new_event',
        title: `New Event: ${formData.title}`,
        message: `Join our upcoming ${formData.category} at ${formData.location} on ${formattedDate}.`,
        link: '/events',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'system'
      });
      
      setIsModalOpen(false);
      setFormData({
        title: '', date: '', location: '', category: 'Retreats',
        description: '', img: 'https://picsum.photos/seed/temple/800/400', attendees: '0'
      });
      setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
      console.error("Error adding event:", error);
      alert("Failed to create event: " + error.message);
    }
  };

  const handleRSVP = async (event, isAttending) => {
    if (!user) {
      alert("Please login to RSVP");
      return;
    }
    setRsvpLoading(prev => ({ ...prev, [event.id]: true }));
    try {
      const token = isAttending ? uuidv4().slice(0, 8).toUpperCase() : null;
      const status = isAttending ? 'Attending' : 'Not Attending';
      const registrationRef = doc(db, 'registrations', `${event.id}_${user.uid}`);
      
      const prevState = registrations?.find(r => r.eventId === event.id)?.status;
      if (prevState === status) {
        setRsvpLoading(prev => ({ ...prev, [event.id]: false }));
        return;
      }
      
      let attendingDiff = isAttending ? 1 : (prevState === 'Attending' ? -1 : 0);
      let declinedDiff = !isAttending ? 1 : (prevState === 'Not Attending' ? -1 : 0);
      
      const eventRef = doc(db, 'events', event.id);
      
      // If it's a real event, update its counts
      if (!event.id.startsWith('mock')) {
        await updateDoc(eventRef, {
          attendingCount: increment(attendingDiff),
          declinedCount: increment(declinedDiff)
        });
      }
      
      await setDoc(registrationRef, {
        eventId: event.id,
        eventTitle: event.title,
        userId: user.uid,
        userName: user.fullName || auth.currentUser?.displayName || 'Devotee',
        token: token,
        status: status,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      if (isAttending) alert(`Successfully registered! Your Attendance Token: ${token}`);
    } catch (error) {
      console.error("Registration error:", error);
      alert("Failed to RSVP: " + error.message);
    } finally {
      setRsvpLoading(prev => ({ ...prev, [event.id]: false }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        if (width > 800) { height = Math.round((height * 800) / width); width = 800; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        setFormData({...formData, img: canvas.toDataURL('image/jpeg', 0.7)});
      }
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  if (eventsLoading && firestoreEvents.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-saffron" size={48} />
          <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">Gathering Events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] p-4 lg:p-10 relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-saffron/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-saffron/10 text-saffron rounded-full border border-saffron/20 shadow-sm">
               <Megaphone size={16} />
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Spiritual Gatherings</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-gray-900 tracking-tighter leading-tight xl:leading-[0.8] uppercase">
              COMMUNITY<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron to-gold">Events</span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex -space-x-3">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="avatar" />
                 </div>
               ))}
               <div className="w-10 h-10 rounded-full border-2 border-white bg-saffron text-white flex items-center justify-center text-[10px] font-black shadow-sm">+50</div>
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Join 1000+ devotees <br/>in sacred practice</p>
            {user?.role && (user.role === 'admin' || user.role === 'folks_head') && (
              <Button onClick={() => setIsModalOpen(true)} className="py-4 px-8 bg-gray-900 text-white font-black rounded-2xl shadow-premium-xl group">
                 <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" /> CREATE EVENT
              </Button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3.5 rounded-2xl whitespace-nowrap transition-all font-black text-xs uppercase tracking-[0.15em] relative ${
                cat === activeCategory 
                  ? 'bg-gray-900 text-white shadow-premium-xl translate-y-[-2px]' 
                  : 'bg-white/60 backdrop-blur-md border border-gray-100 text-gray-400 hover:text-saffron hover:border-saffron/30 hover:bg-white'
              }`}
            >
              {cat}
              {cat === activeCategory && (
                <motion.div layoutId="catActive" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-saffron rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Featured Card */}
        {filteredEvents.length > 0 && activeCategory === 'All' && (
          <Card className="p-0 border-none shadow-premium-xl rounded-[4rem] overflow-hidden group relative min-h-[500px] flex flex-col justify-end bg-black">
             <div className="absolute inset-0 overflow-hidden">
                <img src={filteredEvents[0].img} alt="hero" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
             </div>
             
              <div className="relative z-10 p-8 sm:p-12 xl:p-16 space-y-6 sm:space-y-8">
                <div className="flex flex-wrap gap-3">
                   <span className="px-4 py-1.5 bg-saffron text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Featured</span>
                   <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20">{filteredEvents[0].category}</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter max-w-3xl leading-none italic uppercase">{filteredEvents[0].title}</h2>
                
                <div className="flex flex-wrap gap-6 sm:gap-10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20"><Calendar className="text-gold" size={20} /></div>
                      <div>
                         <span className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</span>
                         <span className="text-sm sm:text-lg font-black text-white tracking-tight">{filteredEvents[0].date}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20"><MapPin className="text-saffron" size={20} /></div>
                      <div className="text-left">
                         <span className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Location</span>
                         <span className="text-sm sm:text-lg font-black text-white tracking-tight text-left">{filteredEvents[0].location}</span>
                      </div>
                   </div>
                </div>

                 <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {(() => {
                        const event = filteredEvents[0];
                        const reg = registrations?.find(r => r.eventId === event.id);
                        if (reg?.status === 'Attending') return (
                          <div className="px-10 py-5 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center gap-4">
                             <CheckCircle2 size={24} className="text-green-400" />
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Your Token</span>
                                <span className="text-lg font-black text-white tracking-widest">{reg.token}</span>
                             </div>
                          </div>
                        );
                        return (
                          <Button 
                            disabled={rsvpLoading[event.id]}
                            onClick={() => handleRSVP(event, true)} 
                            className="w-full sm:w-auto px-10 py-5 bg-white text-gray-900 font-black rounded-3xl hover:bg-cream transition-all uppercase tracking-[0.2em] text-[11px] shadow-2xl disabled:opacity-50"
                          >
                             {rsvpLoading[event.id] ? <Loader2 className="animate-spin mx-auto" size={18} /> : "I will Attend"}
                          </Button>
                        );
                    })()}
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest italic">
                        {filteredEvents[0].attendingCount || filteredEvents[0].attendees || 0} Devotees expected
                    </p>
                 </div>
             </div>
          </Card>
        )}

        {/* Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredEvents.slice(activeCategory === 'All' ? 1 : 0).map((event, idx) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                 <Card className="p-0 border-none shadow-premium-xl rounded-[3.5rem] overflow-hidden flex flex-col h-full bg-white group transition-all hover:translate-y-[-10px]">
                    <div className="relative h-64 overflow-hidden">
                       <img src={event.img} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                       <div className="absolute top-6 left-6 block text-left">
                          <span className="px-5 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-[10px] font-black text-gray-900 border border-white/20 shadow-xl uppercase tracking-widest text-left">{event.category}</span>
                       </div>
                       <div className="absolute bottom-6 right-6">
                          <div className="flex items-center gap-2 bg-gray-900/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                             <Users size={12} className="text-gold" />
                             <span className="text-[10px] font-black text-white uppercase">{event.attendingCount || event.attendees || 0}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="p-10 flex-1 flex flex-col space-y-6">
                       <div className="flex items-center gap-2 text-saffron text-[11px] font-black uppercase tracking-[0.2em]">
                          <Calendar size={14} /> {event.date}
                       </div>
                       <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight italic uppercase group-hover:text-saffron transition-colors text-left">{event.title}</h3>
                       <p className="text-sm text-gray-400 font-bold leading-relaxed line-clamp-3 text-left">{event.description}</p>
                       
                       <div className="pt-8 mt-auto border-t border-gray-100 flex items-center justify-between">
                          <div className="flex flex-col text-left">
                             <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-left">Venue</span>
                             <span className="text-xs font-bold text-gray-900 truncate max-w-[120px] text-left">{event.location}</span>
                          </div>
                          
                          {(() => {
                             const reg = registrations?.find(r => r.eventId === event.id);
                             if (reg?.status === 'Attending') return (
                               <div className="p-3 bg-green-50 rounded-2xl flex items-center gap-3">
                                  <CheckCircle2 size={16} className="text-green-500" />
                                  <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">{reg.token}</span>
                               </div>
                             );
                             return (
                               <Button 
                                 disabled={rsvpLoading[event.id]}
                                 onClick={() => handleRSVP(event, true)} 
                                 className="py-3 px-6 bg-saffron text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-saffron/20 group disabled:opacity-50"
                               >
                                  {rsvpLoading[event.id] ? <Loader2 className="animate-spin mx-auto" size={14} /> : (
                                    <div className="flex items-center">
                                      JOIN <ChevronRight size={14} className="ml-1 group-hover:translate-x-1" />
                                    </div>
                                  )}
                               </Button>
                             );
                          })()}
                       </div>
                    </div>
                 </Card>
              </motion.div>
            ))}
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[4rem] shadow-premium-xl border border-gray-100">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Filter size={40} className="text-gray-200" />
             </div>
             <h3 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">No Sacred Gatherings Found</h3>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Try switching categories, or check back later!</p>
          </div>
        )}

        <div className="h-20" />
      </motion.div>

      {/* Modern Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-premium-xl p-10 sm:p-14 overflow-y-auto max-h-[90vh] border border-saffron/10 scrollbar-hide">
               <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"><X size={24}/></button>
               
               <div className="text-center mb-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-saffron to-gold rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                     <Sparkles size={32} className="text-white" />
                  </div>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Assemble the Sips</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Publish a Divine Gathering</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Title</label>
                       <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-8 py-5 bg-gray-50 rounded-3xl border border-gray-100 focus:bg-white focus:border-saffron outline-none font-black text-gray-900 tracking-tight transition-all placeholder:text-gray-200" placeholder="e.g. Mahotsav 2026" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                       <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-8 py-5 bg-gray-50 rounded-3xl border border-gray-100 focus:bg-white focus:border-saffron outline-none font-black text-gray-900 transition-all appearance-none cursor-pointer">
                          {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date & Time</label>
                       <input required type="datetime-local" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-8 py-5 bg-gray-50 rounded-3xl border border-gray-100 focus:bg-white focus:border-saffron outline-none font-black text-gray-900 transition-all" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location</label>
                       <input required type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-8 py-5 bg-gray-50 rounded-3xl border border-gray-100 focus:bg-white focus:border-saffron outline-none font-black text-gray-900 transition-all placeholder:text-gray-200" placeholder="e.g. Govinda Hall" />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-8 py-5 bg-gray-50 rounded-3xl border border-gray-100 focus:bg-white focus:border-saffron outline-none font-black text-gray-900 transition-all resize-none placeholder:text-gray-200" placeholder="Brief details about the spiritual experience..." />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Visual Banner</label>
                    <label className="flex items-center gap-4 cursor-pointer w-full p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] hover:bg-gray-100 hover:border-saffron transition-all group overflow-hidden">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><ImageIcon className="text-gray-400" size={24} /></div>
                       <span className="text-xs font-black text-gray-400 uppercase tracking-widest truncate">{formData.img.startsWith('data') ? 'IMAGE SECURED' : 'CHOOSE SACRED IMAGE'}</span>
                       <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                 </div>

                 <Button type="submit" disabled={submitting} className="w-full py-6 bg-gray-900 text-white font-black rounded-[2.5rem] shadow-premium-xl hover:bg-black group text-xs uppercase tracking-[0.3em]">
                    {submitting ? <Loader2 className="animate-spin mx-auto" /> : <div className="flex items-center justify-center gap-3">PUBLISH EXPERIENCE <Megaphone size={18} /></div>}
                 </Button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Events
