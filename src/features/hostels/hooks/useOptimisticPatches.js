import { useCallback, useState } from 'react'

/** Per-id local overrides layered over live data until the server catches up. */
export const useOptimisticPatches = () => {
  const [patches, setPatches] = useState({})

  const apply = useCallback((id, patch) => setPatches((p) => ({ ...p, [id]: patch })), [])
  const clear = useCallback((id) => setPatches((p) => {
    if (!(id in p)) return p
    const rest = { ...p }
    delete rest[id]
    return rest
  }), [])
  const prune = useCallback((keep) => setPatches((p) => {
    const entries = Object.entries(p).filter(([id, patch]) => keep(id, patch))
    return entries.length === Object.keys(p).length ? p : Object.fromEntries(entries)
  }), [])

  return { patches, apply, clear, prune }
}
