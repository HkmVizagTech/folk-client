import { createContext, useContext } from 'react'

export const EditorContext = createContext(null)

/** The editor sections read the form state from the TripEditor that wraps them. */
export const useEditor = () => {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('Editor sections must render inside <TripEditor>')
  return ctx
}
