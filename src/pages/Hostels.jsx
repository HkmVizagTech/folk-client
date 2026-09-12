import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Users, Info, Loader2, Send, X, Plus, Minus, Image as ImageIcon,
  CheckCircle2, XCircle, Clock, Ban, Sparkles, Calendar, BedDouble, Eye, EyeOff, Edit3
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useFirestore } from '../hooks/useFirestore'
import { useAuth } from '../hooks/useAuth'
import { auth, db } from '../lib/firebase'
import { collection, addDoc, updateDoc, doc, serverTimestamp, where, orderBy } from 'firebase/firestore'

const emptyListingForm = {
  name: '',
  description: '',
  capacity: 1,
  amenities: '',
  img: ''
}

const Hostels = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head';

  // ---------------- Listings (public) ----------------
  const { data: listings, loading: listingsLoading } = useFirestore('hostel_listings');

  // ---------------- Bookings ----------------
  // Staff can read every booking (rules allow it); everyone else is scoped
  // to just their own, mirroring Accommodation.jsx's role-aware query.
  const bookingsQuery = React.useMemo(() => {
    if (isStaff) return [orderBy('createdAt', 'desc')];
    return [where('userId', '==', user?.uid || 'guest'), orderBy('createdAt', 'desc')];
  }, [isStaff, user?.uid]);
  const { data: bookings, loading: bookingsLoading } = useFirestore('hostel_bookings', bookingsQuery);

  const myBookings = React.useMemo(
    () => (bookings || []).filter((b) => b.userId === user?.uid),
    [bookings, user?.uid]
  );
  const allBookings = bookings;
  const allBookingsLoading = bookingsLoading;

  // ---------------- Booking modal state ----------------
  const [bookingListing, setBookingListing] = useState(null);
  const [bookingForm, setBookingForm] = useState({ checkIn: '', checkOut: '', guestCount: 1, notes: '' });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const openBookingModal = (listing) => {
    setBookingListing(listing);
    setBookingForm({ checkIn: '', checkOut: '', guestCount: 1, notes: '' });
  };

  const closeBookingModal = () => {
    if (submittingBooking) return;
    setBookingListing(null);
  };

  const adjustGuestCount = (delta) => {
    setBookingForm((prev) => ({
      ...prev,
      guestCount: Math.max(1, (parseInt(prev.guestCount, 10) || 1) + delta)
    }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user || !bookingListing) return;
    setSubmittingBooking(true);
    try {
      await addDoc(collection(db, 'hostel_bookings'), {
        listingId: bookingListing.id,
        listingName: bookingListing.name,
        userId: user.uid,
        userName: user.fullName || auth.currentUser?.displayName || 'Devotee',
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        guestCount: parseInt(bookingForm.guestCount, 10) || 1,
        notes: bookingForm.notes || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'notifications'), {
        type: 'new_hostel_booking',
        title: `New Hostel Booking Request`,
        message: `${user.fullName || 'A devotee'} requested "${bookingListing.name}" from ${bookingForm.checkIn} to ${bookingForm.checkOut}.`,
        link: '/hostels',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'system'
      });

      setBookingListing(null);
    } catch (error) {
      console.error('Error submitting hostel booking:', error);
      alert('Failed to submit booking request: ' + error.message);
    } finally {
      setSubmittingBooking(false);
    }
  };

  // ---------------- Cancel my booking ----------------
  const [cancelLoading, setCancelLoading] = useState(null);
  const handleCancelBooking = async (bookingId) => {
    setCancelLoading(bookingId);
    try {
      await updateDoc(doc(db, 'hostel_bookings', bookingId), {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking: ' + error.message);
    } finally {
      setCancelLoading(null);
    }
  };

  // ---------------- Staff: approve/reject bookings ----------------
  const [statusActionLoading, setStatusActionLoading] = useState(null);
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    setStatusActionLoading(bookingId);
    try {
      await updateDoc(doc(db, 'hostel_bookings', bookingId), {
        status: newStatus,
        staffNotes: '',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking: ' + error.message);
    } finally {
      setStatusActionLoading(null);
    }
  };

  // ---------------- Staff: create / edit listing ----------------
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [editingListingId, setEditingListingId] = useState(null);
  const [listingForm, setListingForm] = useState(emptyListingForm);
  const [savingListing, setSavingListing] = useState(false);
  const [listingToggleLoading, setListingToggleLoading] = useState(null);

  const openCreateListingModal = () => {
    setEditingListingId(null);
    setListingForm(emptyListingForm);
    setIsListingModalOpen(true);
  };

  const openEditListingModal = (listing) => {
    setEditingListingId(listing.id);
    setListingForm({
      name: listing.name || '',
      description: listing.description || '',
      capacity: listing.capacity || 1,
      amenities: Array.isArray(listing.amenities) ? listing.amenities.join(', ') : '',
      img: listing.img || ''
    });
    setIsListingModalOpen(true);
  };

  const closeListingModal = () => {
    if (savingListing) return;
    setIsListingModalOpen(false);
  };

  const handleListingImageUpload = (e) => {
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
        setListingForm((prev) => ({ ...prev, img: canvas.toDataURL('image/jpeg', 0.7) }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleListingSubmit = async (e) => {
    e.preventDefault();
    setSavingListing(true);
    try {
      const amenitiesArr = listingForm.amenities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      if (editingListingId) {
        await updateDoc(doc(db, 'hostel_listings', editingListingId), {
          name: listingForm.name,
          description: listingForm.description,
          capacity: parseInt(listingForm.capacity, 10) || 1,
          amenities: amenitiesArr,
          img: listingForm.img
        });
      } else {
        await addDoc(collection(db, 'hostel_listings'), {
          name: listingForm.name,
          description: listingForm.description,
          capacity: parseInt(listingForm.capacity, 10) || 1,
          amenities: amenitiesArr,
          img: listingForm.img,
          active: true,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || 'system'
        });
      }

      setIsListingModalOpen(false);
      setListingForm(emptyListingForm);
      setEditingListingId(null);
    } catch (error) {
      console.error('Error saving hostel listing:', error);
      alert('Failed to save listing: ' + error.message);
    } finally {
      setSavingListing(false);
    }
  };

  const handleToggleActive = async (listing) => {
    setListingToggleLoading(listing.id);
    try {
      await updateDoc(doc(db, 'hostel_listings', listing.id), {
        active: !listing.active
      });
    } catch (error) {
      console.error('Error toggling listing:', error);
      alert('Failed to update listing: ' + error.message);
    } finally {
      setListingToggleLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'text-green-600 bg-green-100 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-100 border-red-200';
      case 'cancelled': return 'text-gray-500 bg-gray-100 border-gray-200';
      default: return 'text-saffron bg-saffron/10 border-saffron/20';
    }
  };

  const getStatusIcon = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved': return <CheckCircle2 size={12} />;
      case 'rejected': return <XCircle size={12} />;
      case 'cancelled': return <Ban size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const activeListings = (listings || []).filter((l) => l.active !== false);
  const pendingBookings = (allBookings || []).filter((b) => (b.status || '').toLowerCase() === 'pending');

  if (listingsLoading && (listings || []).length === 0) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-saffron" size={40} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins text-saffron-dark underline decoration-gold/20">Folk Hostels</h1>
          <p className="text-gray-500 mt-1">Ongoing rooms & beds for youth devotees — browse and request your stay.</p>
        </div>
        {isStaff && (
          <Button
            onClick={openCreateListingModal}
            className="w-full sm:w-auto min-h-[44px] px-6 bg-gradient-to-r from-saffron to-gold shadow-lg font-bold rounded-2xl flex items-center justify-center gap-2"
          >
            <Plus size={18} /> New Listing
          </Button>
        )}
      </div>

      {/* --------- Listings Grid --------- */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-saffron/10 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="text-saffron" size={20} />
          </div>
          Available Stays
        </h2>

        {activeListings.length === 0 ? (
          <Card className="p-10 text-center border-none shadow-sm bg-white">
            <p className="text-gray-400 italic text-sm">No hostel listings available right now. Please check back soon.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {activeListings.map((listing) => (
                <motion.div
                  key={listing.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="p-0 border-none shadow-premium-xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col h-full bg-white">
                    <div className="relative h-44 bg-gradient-to-br from-saffron/10 to-gold/10 overflow-hidden">
                      {listing.img ? (
                        <img src={listing.img} alt={listing.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BedDouble size={48} className="text-saffron/30" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-gray-700 shadow-md flex items-center gap-1.5">
                        <Users size={12} className="text-saffron" /> {listing.capacity || 1}
                      </div>
                      {isStaff && listing.active === false && (
                        <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                          Hidden
                        </div>
                      )}
                    </div>
                    <div className="p-5 sm:p-6 flex-1 flex flex-col gap-3">
                      <h3 className="font-bold text-gray-800 text-base">{listing.name}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{listing.description}</p>
                      {Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {listing.amenities.map((a, i) => (
                            <span key={i} className="px-2.5 py-1 bg-saffron/10 text-saffron-dark text-[10px] font-bold rounded-full">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-auto pt-4 flex flex-col gap-2">
                        <Button
                          onClick={() => openBookingModal(listing)}
                          disabled={!user}
                          className="w-full min-h-[44px] bg-saffron text-white font-bold rounded-xl disabled:opacity-50"
                        >
                          Book Now
                        </Button>
                        {isStaff && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditListingModal(listing)}
                              aria-label={`Edit ${listing.name}`}
                              className="flex-1 min-h-[40px] py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              disabled={listingToggleLoading === listing.id}
                              onClick={() => handleToggleActive(listing)}
                              aria-label={listing.active === false ? `Show ${listing.name}` : `Hide ${listing.name}`}
                              className="flex-1 min-h-[40px] py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              {listingToggleLoading === listing.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : listing.active === false ? (
                                <><Eye size={13} /> Show</>
                              ) : (
                                <><EyeOff size={13} /> Hide</>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* --------- My Bookings --------- */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-saffron/10 rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="text-saffron" size={20} />
          </div>
          Your Bookings
        </h2>
        {(myBookings || []).length === 0 ? (
          <Card className="p-8 text-center border-none shadow-sm bg-white">
            <p className="text-gray-400 italic text-sm">You haven&apos;t requested a hostel stay yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {myBookings.map((b) => (
                <motion.div key={b.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="p-5 border-none shadow-sm bg-white">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-bold text-gray-800 text-sm truncate">{b.listingName}</h4>
                      <span className={`shrink-0 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border whitespace-nowrap flex items-center gap-1 ${getStatusColor(b.status)}`}>
                        {getStatusIcon(b.status)} {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{b.checkIn} &rarr; {b.checkOut}</p>
                    <p className="text-xs text-gray-400 font-medium mt-1">{b.guestCount} guest{b.guestCount > 1 ? 's' : ''}</p>
                    {b.staffNotes && (
                      <p className="text-xs text-gray-500 mt-2 italic bg-cream/50 rounded-lg p-2">&quot;{b.staffNotes}&quot;</p>
                    )}
                    {(b.status || '').toLowerCase() === 'pending' && (
                      <button
                        disabled={cancelLoading === b.id}
                        onClick={() => handleCancelBooking(b.id)}
                        className="mt-3 w-full min-h-[36px] py-2 bg-red-50 text-red-500 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {cancelLoading === b.id ? <Loader2 size={13} className="animate-spin" /> : 'Cancel Request'}
                      </button>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* --------- Staff: All Bookings Management --------- */}
      {isStaff && (
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-saffron/10 rounded-xl flex items-center justify-center shrink-0">
              <Users className="text-saffron" size={20} />
            </div>
            Manage Bookings
            {pendingBookings.length > 0 && (
              <span className="text-[10px] font-black px-2 py-1 rounded-md bg-saffron text-white uppercase tracking-widest">
                {pendingBookings.length} pending
              </span>
            )}
          </h2>

          {allBookingsLoading && (allBookings || []).length === 0 ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-saffron" size={28} /></div>
          ) : (allBookings || []).length === 0 ? (
            <Card className="p-8 text-center border-none shadow-sm bg-white">
              <p className="text-gray-400 italic text-sm">No bookings yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {allBookings.map((b) => (
                <Card key={b.id} className="p-5 border-none shadow-sm bg-white flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-800 text-sm">{b.listingName}</h4>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border flex items-center gap-1 ${getStatusColor(b.status)}`}>
                        {getStatusIcon(b.status)} {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      {b.userName || 'Devotee'} &middot; {b.checkIn} &rarr; {b.checkOut} &middot; {b.guestCount} guest{b.guestCount > 1 ? 's' : ''}
                    </p>
                    {b.notes && <p className="text-xs text-gray-500 mt-1 italic">&quot;{b.notes}&quot;</p>}
                  </div>
                  {(b.status || '').toLowerCase() === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        disabled={statusActionLoading === b.id}
                        onClick={() => handleUpdateBookingStatus(b.id, 'approved')}
                        className="min-h-[40px] px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {statusActionLoading === b.id ? <Loader2 size={14} className="animate-spin" /> : 'Approve'}
                      </button>
                      <button
                        disabled={statusActionLoading === b.id}
                        onClick={() => handleUpdateBookingStatus(b.id, 'rejected')}
                        className="min-h-[40px] px-4 py-2 bg-red-50 text-red-500 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {statusActionLoading === b.id ? <Loader2 size={14} className="animate-spin" /> : 'Reject'}
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* --------- Booking Modal --------- */}
      <AnimatePresence>
        {bookingListing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeBookingModal}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-premium-xl p-6 sm:p-10 overflow-y-auto max-h-[90vh] border border-saffron/10"
            >
              <button
                onClick={closeBookingModal}
                aria-label="Close"
                className="absolute top-5 right-5 w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"
              >
                <X size={22} />
              </button>

              <div className="mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-saffron to-gold rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <BedDouble className="text-white" size={26} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Book: {bookingListing.name}</h2>
                <p className="text-gray-400 text-sm mt-1">Submit a request — staff will confirm your stay.</p>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Check-in</label>
                    <input
                      required
                      type="date"
                      value={bookingForm.checkIn}
                      onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                      className="w-full px-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Check-out</label>
                    <input
                      required
                      type="date"
                      value={bookingForm.checkOut}
                      onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                      className="w-full px-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Number of Guests</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      aria-label="Decrease guest count"
                      onClick={() => adjustGuestCount(-1)}
                      className="w-11 h-11 shrink-0 rounded-xl bg-cream/50 border border-saffron/10 flex items-center justify-center text-saffron hover:bg-saffron/10 transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="flex-1 text-center text-lg font-bold text-gray-800">{bookingForm.guestCount}</span>
                    <button
                      type="button"
                      aria-label="Increase guest count"
                      onClick={() => adjustGuestCount(1)}
                      className="w-11 h-11 shrink-0 rounded-xl bg-cream/50 border border-saffron/10 flex items-center justify-center text-saffron hover:bg-saffron/10 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Notes (optional)</label>
                  <textarea
                    rows={3}
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                    placeholder="Any special requirements..."
                    className="w-full bg-cream/30 border border-saffron/10 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium resize-none"
                  />
                </div>

                <Button
                  disabled={submittingBooking}
                  className="w-full py-4 bg-gradient-to-r from-saffron to-gold shadow-lg font-bold rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submittingBooking ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                  {submittingBooking ? 'Submitting...' : 'Submit Booking Request'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --------- Staff: Create/Edit Listing Modal --------- */}
      <AnimatePresence>
        {isListingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeListingModal}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-premium-xl p-6 sm:p-10 overflow-y-auto max-h-[90vh] border border-saffron/10"
            >
              <button
                onClick={closeListingModal}
                aria-label="Close"
                className="absolute top-5 right-5 w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"
              >
                <X size={22} />
              </button>

              <div className="mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-saffron to-gold rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Sparkles className="text-white" size={26} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{editingListingId ? 'Edit Listing' : 'New Hostel Listing'}</h2>
                <p className="text-gray-400 text-sm mt-1">Add a room or bed available for youth stays.</p>
              </div>

              <form onSubmit={handleListingSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Name</label>
                  <input
                    required
                    type="text"
                    value={listingForm.name}
                    onChange={(e) => setListingForm({ ...listingForm, name: e.target.value })}
                    placeholder="e.g. Boys Dormitory - Block A"
                    className="w-full px-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea
                    rows={3}
                    value={listingForm.description}
                    onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                    placeholder="Brief details about the room..."
                    className="w-full bg-cream/30 border border-saffron/10 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Capacity (beds)</label>
                    <input
                      required
                      type="number"
                      min={1}
                      value={listingForm.capacity}
                      onChange={(e) => setListingForm({ ...listingForm, capacity: e.target.value })}
                      className="w-full px-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Amenities (comma-separated)</label>
                    <input
                      type="text"
                      value={listingForm.amenities}
                      onChange={(e) => setListingForm({ ...listingForm, amenities: e.target.value })}
                      placeholder="WiFi, AC, Attached bath"
                      className="w-full px-4 py-3 bg-cream/30 border border-saffron/10 rounded-xl outline-none focus:bg-white focus:border-saffron/40 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Photo</label>
                  <label className="flex items-center gap-4 cursor-pointer w-full p-5 bg-cream/30 border-2 border-dashed border-saffron/20 rounded-2xl hover:bg-cream/50 transition-all overflow-hidden">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                      <ImageIcon className="text-gray-400" size={20} />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest truncate">
                      {listingForm.img ? 'Image selected' : 'Choose an image'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleListingImageUpload} className="hidden" />
                  </label>
                </div>

                <Button
                  disabled={savingListing}
                  className="w-full py-4 bg-gradient-to-r from-saffron to-gold shadow-lg font-bold rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {savingListing ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                  {savingListing ? 'Saving...' : editingListingId ? 'Save Changes' : 'Create Listing'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Hostels
