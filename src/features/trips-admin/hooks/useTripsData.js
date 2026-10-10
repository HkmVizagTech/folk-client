import { useCallback, useMemo } from 'react'
import { useFirestore } from '../../../hooks/useFirestore'
import { indexPayments, resolvePayment } from '../lib/payments'

const NO_QUERY = []

/** Live collections plus the read-only payment resolver derived from them. */
export const useTripsData = () => {
  const { data: trips, loading: tripsLoading } = useFirestore('trips', NO_QUERY)
  const { data: registrations, loading: regsLoading } = useFirestore('trip_registrations', NO_QUERY)
  const { data: payments, loading: paymentsLoading } = useFirestore('payments', NO_QUERY)

  // Nothing here ever writes a "paid" flag; truth is resolved each render from payments/{orderId}.
  const paymentsById = useMemo(() => indexPayments(payments), [payments])
  const resolve = useCallback(
    (reg) => resolvePayment(reg, paymentsById, paymentsLoading),
    [paymentsById, paymentsLoading],
  )

  return { trips, registrations, tripsLoading, regsLoading, resolve }
}
