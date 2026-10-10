import { inr } from '../../trips/lib/format'

/** Answers drawn only from what the trip and its payment setup actually say. */
export const buildFaq = (trip, { pricing, modes }) => {
  const items = []

  if (modes.onlineAvailable || modes.cashAvailable) {
    const routes = [modes.onlineAvailable && 'online by UPI, card or net-banking', modes.cashAvailable && 'in cash at the FOLK office'].filter(Boolean).join(' or ')
    items.push({
      q: 'How do I pay?',
      a: `You can pay ${routes}.${pricing.advance > 0 ? ` ${inr(pricing.advance)} per person is due now and the rest before departure.` : ''} Your seat is confirmed once the payment is recorded.`,
    })
  } else {
    items.push({ q: 'How do I pay?', a: 'Send a request for your seat. The yatra team confirms it and arranges payment with you directly.' })
  }

  if (trip.eligibility) items.push({ q: 'Who can join?', a: trip.eligibility })
  items.push({
    q: 'Where do we meet?',
    a: trip.meetingPoint || 'The meeting point is shared with confirmed travellers.',
  })
  items.push({
    q: 'What details will you need from me?',
    a: 'Booking takes only your name and phone number. Once your seat is held you can add traveller names, ages and ID details so the team can book tickets. All of it is optional.',
  })
  items.push({
    q: 'Can I cancel?',
    a: 'Yes. While your registration is still pending you can cancel it from this page. For anything else, contact the yatra team.',
  })
  if (trip.contactPhone) items.push({ q: 'Who do I contact with questions?', a: `Call or WhatsApp the yatra team on ${trip.contactPhone}.` })
  return items
}
