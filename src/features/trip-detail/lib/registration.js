export const statusOf = (reg) => (reg?.status || '').toLowerCase()

/** A live registration is any that has not been cancelled. */
export const isLive = (reg) => !!reg && statusOf(reg) !== 'cancelled'

/** Why booking is closed, or null when it is open. */
export const getBlockedReason = (trip, seatsLeft) => {
  if (!trip) return null
  const status = (trip.status || 'upcoming').toLowerCase()
  if (status === 'cancelled') return 'This yatra has been cancelled. Please get in touch for alternatives.'
  if (status === 'completed') return 'This yatra has already taken place. Browse the upcoming journeys instead.'
  if (trip.registrationOpen === false) return 'Registrations are closed for this yatra right now. Contact the team to be told when they reopen.'
  if (seatsLeft === 0) return 'Every seat is booked. Message the yatra team to be added to the waitlist.'
  return null
}
