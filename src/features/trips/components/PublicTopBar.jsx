import { Button } from '../../../components/ui'

/** Top bar for logged-out visitors, where the app shell is not mounted. */
const PublicTopBar = ({ onLoginClick }) => (
  <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-[70px] sm:px-6 lg:px-8">
      <a href="/" className="flex shrink-0 items-center" aria-label="FOLK Vizag home">
        <img src="/folk_logo_blue.png" alt="FOLK Vizag" className="h-11 w-auto max-w-full object-contain sm:h-12" />
      </a>
      <Button variant="dark" onClick={() => onLoginClick?.()}>Sign in</Button>
    </div>
  </header>
)

export default PublicTopBar
