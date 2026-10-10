import * as Dialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const round = 'absolute z-10 flex h-11 w-11 items-center justify-center rounded-full bg-ink/60 text-white transition-colors hover:bg-ink/80'

/** Full-screen gallery viewer; Radix owns focus trap, scroll lock and Escape. */
const Lightbox = ({ images, index, title, onClose, onStep }) => {
  const open = index !== null && !!images[index]
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[210] bg-ink/90 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[210] flex items-center justify-center p-4 outline-none data-[state=open]:animate-pop-in"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <Dialog.Title className="sr-only">{`Gallery image ${(index ?? 0) + 1} of ${images.length}`}</Dialog.Title>
          {open && (
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-ink">
              <img src={images[index]} alt={`${title || 'Yatra'} photo ${index + 1}`} className="mx-auto block h-auto max-h-[85vh] w-auto max-w-full object-contain" />
              <Dialog.Close aria-label="Close image" className={`${round} right-3 top-3`}><X size={20} /></Dialog.Close>
              {images.length > 1 && (
                <>
                  <button type="button" onClick={() => onStep(-1)} aria-label="Previous image" className={`${round} left-2 top-1/2 -translate-y-1/2 sm:left-3`}><ChevronLeft size={22} /></button>
                  <button type="button" onClick={() => onStep(1)} aria-label="Next image" className={`${round} right-2 top-1/2 -translate-y-1/2 sm:right-3`}><ChevronRight size={22} /></button>
                  <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink/60 px-3 py-1.5 text-[13px] font-semibold text-white">{index + 1} / {images.length}</span>
                </>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default Lightbox
