import { lazy } from 'react'

const loaders = []

/** React.lazy that remembers its loader, so every screen can be fetched ahead of the click. */
export const lazyPage = (loader) => {
  const Page = lazy(loader)
  Page.preload = loader
  loaders.push(loader)
  return Page
}

/** Fetch all screen bundles when the browser is idle, so navigating never waits on the network. */
export const preloadPages = () => {
  const run = () => loaders.forEach((load) => load().catch(() => {}))
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 4000 })
  else setTimeout(run, 1500)
}
