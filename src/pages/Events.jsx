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
// Postgres-backed shim, NOT the real Firebase SDK: `db` is only a marker
// object now, so firebase/firestore helpers throw on it - and useFirestore
// swallows that, leaving the screen silently empty instead of erroring.
import { collection, addDoc, serverTimestamp, setDoc, doc, where, runTransaction } from '../lib/pgstore'
import { v4 as uuidv4 } from 'uuid'
import { audienceOf, audiencesFor } from '../content/audiences'

const ATTENDING = 'Attending';
const DECLINED = 'Not Attending';
const CANCELLED = 'Cancelled';

// Which head-count on the event each answer belongs to. `Cancelled` is a
// withdrawal, so it is deliberately absent here: it sits in neither count.
const COUNTER_FIELD = { [ATTENDING]: 'attendingCount', [DECLINED]: 'declinedCount' };

/**
 * The member's current answer and the ways to change it. The featured banner
 * and the grid cards offer exactly the same three moves, so they share this and
 * differ only in colour.
 */
const RsvpChoice = ({ status, busy, onChoose, dark = false }) => {
  const answered = status === ATTENDING || status === DECLINED;
  const shape = dark ? 'rounded-3xl px-8' : 'rounded-2xl px-6';
  const btn = `min-h-[44px] min-w-[44px] py-3 ${shape} font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2`;
  const tone = dark
    ? {
        label: 'text-gray-400',
        yes: 'bg-white text-gray-900 hover:bg-cream shadow-2xl',
        no: 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20',
        quiet: 'text-gray-400 hover:text-white'
      }
    : {
        label: 'text-gray-300',
        yes: 'bg-saffron text-white shadow-lg hover:shadow-saffron/20',
        no: 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100',
        quiet: 'text-gray-400 hover:text-gray-900'
      };

  return (
    <div className="w-full flex flex-col gap-3">
      <span className={`text-[10px] font-black uppercase tracking-widest text-left ${tone.label}`}>
        {status === ATTENDING ? 'You are going' : status === DECLINED ? 'You are not going' : 'Will you be there?'}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        {status !== ATTENDING && (
          <button type="button" disabled={busy} onClick={() => onChoose(ATTENDING)} className={`${btn} ${tone.yes}`}>
            {busy ? <Loader2 className="animate-spin" size={14} /> : <><CheckCircle2 size={14} /> I will attend</>}
          </button>
        )}
        {status !== DECLINED && (
          <button type="button" disabled={busy} onClick={() => onChoose(DECLINED)} className={`${btn} ${tone.no}`}>
            {busy ? <Loader2 className="animate-spin" size={14} /> : <><XCircle size={14} /> Can&apos;t make it</>}
          </button>
        )}
        {answered && (
          <button type="button" disabled={busy} onClick={() => onChoose(CANCELLED)} className={`${btn} ${tone.quiet}`}>
            {busy ? <Loader2 className="animate-spin" size={14} /> : 'Withdraw'}
          </button>
        )}
      </div>
    </div>
  );
};

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

      // Who the event is for. Only an admin may publish to everyone (those
      // also show on folkvizag.org), so a FOLK guide creating from here makes
      // it for the youth they guide; the server enforces the same rule.
      const audience = formData.audience || (user?.role === 'admin' ? 'all' : 'mine');
      // Prasadam coupons are admin-only (the server enforces it too).
      const givesPrasadamCoupon = user?.role === 'admin' && !!formData.givesPrasadamCoupon;

      await addDoc(collection(db, 'events'), {
        ...formData,
        audience,
        givesPrasadamCoupon,
        ownerId: user?.uid || auth.currentUser?.uid || null,
        ownerName: user?.name || user?.displayName || 'FOLK team',
        date: formattedDate,
        dateISO: rawDate.toISOString(),
        // Seed both RSVP counters at zero. A member's RSVP may only move a
        // counter by one, so starting from a missing key means the very first
        // "not attending" has nothing to count from - and an event with no
        // replies yet should read 0, not blank.
        attendingCount: 0,
        declinedCount: 0,
        groupId: auth.currentUser?.uid || 'system',
        createdAt: serverTimestamp()
      });
      
      // Best effort: the event is already saved, so a failed announcement must
      // not be reported as "failed to create event" - that sent admins back to
      // the form to create the same event a second time.
      //
      // Only public events are announced: every signed-in member can read
      // notifications, so posting a guide's private program there would show
      // its title to the whole club. Scoped events appear in the calendar of
      // the people they are for instead.
      try {
        if (audience === 'all') await addDoc(collection(db, 'notifications'), {
          type: 'new_event',
          title: `New Event: ${formData.title}`,
          message: `Join our upcoming ${formData.category} at ${formData.location} on ${formattedDate}.`,
          link: '/events',
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || 'system'
        });
      } catch (notifyError) {
        console.error('Event created, but the announcement could not be posted:', notifyError);
      }


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

  const handleRSVP = async (event, nextStatus) => {
    if (!user) {
      alert("Please login to RSVP");
      return;
    }
    // A second tap before the first write lands would read the same stale
    // answer and move the same counter a second time.
    if (rsvpLoading[event.id]) return;

    const prevStatus = registrations?.find(r => r.eventId === event.id)?.status || null;
    if (prevStatus === nextStatus) return;
    // Nothing to withdraw from, so there is no counter to give back and no
    // reason to leave a "Cancelled" row behind for someone who never answered.
    if (nextStatus === CANCELLED && !COUNTER_FIELD[prevStatus]) return;

    setRsvpLoading(prev => ({ ...prev, [event.id]: true }));
    try {
      const token = nextStatus === ATTENDING ? uuidv4().slice(0, 8).toUpperCase() : null;
      const registrationRef = doc(db, 'registrations', `${event.id}_${user.uid}`);
      const eventRef = doc(db, 'events', event.id);
      const leaving = COUNTER_FIELD[prevStatus];
      const joining = COUNTER_FIELD[nextStatus];

      const registration = {
        eventId: event.id,
        eventTitle: event.title,
        userId: user.uid,
        // The profile field is `name` (see AuthContext.completeProfile);
        // `fullName` never existed, so every roster and every attendance scan
        // showed this person as a nameless "Devotee".
        userName: user.name || user.fullName || auth.currentUser?.displayName || 'Devotee',
        // Cleared on anything but "attending" so a withdrawn member's old token
        // can no longer be scanned through at the gate.
        token: token,
        status: nextStatus,
        updatedAt: serverTimestamp()
      };

      // Mock events live only in this page, so there is no document to count on.
      if (event.id.startsWith('mock')) {
        await setDoc(registrationRef, registration, { merge: true });
      } else {
        // The answer and the counters it moves go up in one commit: a counter
        // written separately could fail on its own and leave the event
        // miscounted for good, and the server only accepts a move of one per
        // counter, which is exactly what a single change of answer is.
        await runTransaction(db, async (transaction) => {
          const counts = (await transaction.get(eventRef)).data() || {};
          const patch = {};
          // Absolute values rather than increment(): events created before the
          // counters existed read as 0, and a blind -1 would send one negative,
          // which the server refuses - taking the whole commit down with it.
          if (leaving) patch[leaving] = Math.max(0, (Number(counts[leaving]) || 0) - 1);
          if (joining) patch[joining] = (Number(counts[joining]) || 0) + 1;
          transaction.set(registrationRef, registration, { merge: true });
          transaction.update(eventRef, patch);
        });
      }

      if (nextStatus === ATTENDING) alert(`Successfully registered! Your Attendance Token: ${token}`);
    } catch (error) {
      console.error("Registration error:", error);
      alert("Your RSVP could not be saved: " + error.message);
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

                 <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col gap-6">
                    {(() => {
                        const event = filteredEvents[0];
                        const reg = registrations?.find(r => r.eventId === event.id);
                        return (
                          <>
                            {reg?.status === 'Attending' && (
                              <div className="self-start px-10 py-5 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center gap-4">
                                 <CheckCircle2 size={24} className="text-green-400" />
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Your Token</span>
                                    <span className="text-lg font-black text-white tracking-widest">{reg.token}</span>
                                 </div>
                              </div>
                            )}
                            <RsvpChoice
                              dark
                              status={reg?.status}
                              busy={rsvpLoading[event.id]}
                              onChoose={(next) => handleRSVP(event, next)}
                            />
                          </>
                        );
                    })()}
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest italic">
                        {/* ?? not ||: now that the last attendee can withdraw,
                            attendingCount: 0 is a real answer, and || would
                            fall through to the number staff typed at creation
                            and claim people are coming who are not. */}
                        {filteredEvents[0].attendingCount ?? filteredEvents[0].attendees ?? 0} Devotees expected
                    </p>
                 </div>
             </div>
          </Card>
        )}

        {/* Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {filteredEvents.slice(activeCategory === 'All' ? 1 : 0).map((event, idx) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                 <Card className="p-0 border-none shadow-premium-xl rounded-[3.5rem] overflow-hidden flex flex-col h-full bg-white group transition-all hover:translate-y-[-10px]">
                    <div className="relative h-64 overflow-hidden">
                       <img src={event.img} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                       <div className="absolute top-6 left-6 block text-left">
                          <span className="px-5 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-[10px] font-black text-gray-900 border border-white/20 shadow-xl uppercase tracking-widest text-left">{event.category}</span>
                          {/* Only called out when it isn't the public calendar, so the
                              team can see at a glance who a program is for. */}
                          {audienceOf(event).id !== 'all' && (
                            <span className="px-5 py-2 bg-navy/90 backdrop-blur-md rounded-2xl text-[10px] font-black text-white border border-white/20 shadow-xl uppercase tracking-widest text-left">{audienceOf(event).short}</span>
                          )}
                       </div>
                       <div className="absolute bottom-6 right-6">
                          <div className="flex items-center gap-2 bg-gray-900/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                             <Users size={12} className="text-gold" />
                             <span className="text-[10px] font-black text-white uppercase">{event.attendingCount ?? event.attendees ?? 0}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="p-6 sm:p-8 lg:p-10 flex-1 flex flex-col space-y-6">
                       <div className="flex items-center gap-2 text-saffron text-[11px] font-black uppercase tracking-[0.2em]">
                          <Calendar size={14} /> {event.date}
                       </div>
                       <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight italic uppercase group-hover:text-saffron transition-colors text-left">{event.title}</h3>
                       <p className="text-sm text-gray-400 font-bold leading-relaxed line-clamp-3 text-left">{event.description}</p>
                       
                       <div className="pt-8 mt-auto border-t border-gray-100 space-y-5">
                          {(() => {
                             const reg = registrations?.find(r => r.eventId === event.id);
                             return (
                               <>
                                 <div className="flex items-center justify-between gap-3">
                                    <div className="flex flex-col text-left">
                                       <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-left">Venue</span>
                                       <span className="text-xs font-bold text-gray-900 truncate max-w-[120px] text-left">{event.location}</span>
                                    </div>
                                    {reg?.status === 'Attending' && (
                                      <div className="p-3 bg-green-50 rounded-2xl flex items-center gap-3">
                                         <CheckCircle2 size={16} className="text-green-500" />
                                         <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">{reg.token}</span>
                                      </div>
                                    )}
                                 </div>
                                 <RsvpChoice
                                   status={reg?.status}
                                   busy={rsvpLoading[event.id]}
                                   onChoose={(next) => handleRSVP(event, next)}
                                 />
                               </>
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
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] sm:rounded-[4rem] shadow-premium-xl p-6 sm:p-10 xl:p-14 overflow-y-auto max-h-[90vh] border border-saffron/10 scrollbar-hide">
               <button onClick={() => setIsModalOpen(false)} aria-label="Close" className="absolute top-6 right-6 sm:top-8 sm:right-8 w-11 h-11 sm:w-12 sm:h-12 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"><X size={24}/></button>

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
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Who is it for?</label>
                       <select
                          value={formData.audience || (user?.role === 'admin' ? 'all' : 'mine')}
                          onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                          className="w-full px-8 py-5 bg-gray-50 rounded-3xl border border-gray-100 focus:bg-white focus:border-saffron outline-none font-black text-gray-900 transition-all appearance-none cursor-pointer"
                       >
                          {audiencesFor(user?.role).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                       </select>
                       <p className="text-[10px] font-bold text-gray-400 ml-1">{audienceOf({ audience: formData.audience || (user?.role === 'admin' ? 'all' : 'mine') }).desc}</p>
                    </div>
                    {/* Coupons are meals the kitchen has to cook, so admins only
                        (the server enforces this as well). */}
                    {user?.role === 'admin' && (
                      <div className="space-y-3 md:col-span-2">
                         <label className="flex items-start gap-4 px-8 py-5 bg-gray-50 rounded-3xl border border-gray-100 cursor-pointer hover:bg-white transition-all">
                            <input
                               type="checkbox"
                               checked={!!formData.givesPrasadamCoupon}
                               onChange={(e) => setFormData({ ...formData, givesPrasadamCoupon: e.target.checked })}
                               className="mt-1 w-5 h-5 shrink-0 accent-saffron"
                            />
                            <span>
                               <span className="block font-black text-gray-900">Gives a prasadam coupon</span>
                               <span className="block mt-1 text-[11px] font-bold text-gray-400">Everyone marked present gets that day&apos;s prasadam coupon in the Hare Krishna app.</span>
                            </span>
                         </label>
                      </div>
                    )}
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
