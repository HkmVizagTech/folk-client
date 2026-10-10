import React from 'react'
import Alert from '../Alert'
import { useEditor } from './EditorContext'

/** Said up front so nobody picks a file only to learn there is nowhere to put it. */
const UploadsNotice = () => {
  const { up } = useEditor()
  const cfg = up.uploadConfig
  if (!cfg || cfg.configured !== false) return null

  if (cfg.reachable === false) {
    return (
      <Alert tone="warning" title="Could not check image storage">
        The server did not answer the storage check{cfg.error ? `: ${cfg.error}` : '.'} This is a connection or deployment
        problem rather than a missing setting. Everything else on this trip saves as normal.
      </Alert>
    )
  }
  return (
    <Alert tone="warning" title="Image uploads are not configured yet">
      The server has no image storage set up, so new pictures cannot be added. Everything else on this trip saves as normal,
      and any image already on it keeps showing.
      {Array.isArray(cfg.missing) && cfg.missing.length > 0 && (
        <span className="mt-2 block">
          Missing on the server: <span className="font-mono font-semibold">{cfg.missing.join(', ')}</span> — add{' '}
          {cfg.missing.length === 1 ? 'it' : 'them'} to the backend environment variables and redeploy.
        </span>
      )}
    </Alert>
  )
}

export default UploadsNotice
