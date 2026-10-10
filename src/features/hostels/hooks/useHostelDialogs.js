import { useState } from 'react'
import { emptyBooking, emptyListing, listingToForm } from '../lib/hostels'

/** Open/close + draft state for the booking and listing dialogs. */
export const useHostelDialogs = ({ onBook, onSaveListing }) => {
  const [bookingListing, setBookingListing] = useState(null)
  const [bookingForm, setBookingForm] = useState(emptyBooking)
  const [listingOpen, setListingOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [listingForm, setListingForm] = useState(emptyListing)
  const [submitting, setSubmitting] = useState(false)

  const openBooking = (listing) => { setBookingListing(listing); setBookingForm(emptyBooking) }
  const openCreate = () => { setEditingId(null); setListingForm(emptyListing); setListingOpen(true) }
  const openEdit = (listing) => { setEditingId(listing.id); setListingForm(listingToForm(listing)); setListingOpen(true) }

  const closeBooking = () => !submitting && setBookingListing(null)
  const closeListing = () => !submitting && setListingOpen(false)

  const submitBooking = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const ok = await onBook(bookingListing, bookingForm)
    setSubmitting(false)
    if (ok) setBookingListing(null)
  }

  const submitListing = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const ok = await onSaveListing(listingForm, editingId)
    setSubmitting(false)
    if (ok) { setListingOpen(false); setListingForm(emptyListing); setEditingId(null) }
  }

  return {
    submitting,
    booking: { listing: bookingListing, form: bookingForm, setForm: setBookingForm, open: openBooking, close: closeBooking, submit: submitBooking },
    listing: { open: listingOpen, editing: !!editingId, form: listingForm, setForm: setListingForm, openCreate, openEdit, close: closeListing, submit: submitListing },
  }
}
