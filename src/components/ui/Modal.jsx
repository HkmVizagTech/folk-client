import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export { Field, inputClass, textareaClass } from './Field'

const WIDTH = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }

/**
 * Accessible dialog on Radix: bottom sheet on phones, centred panel above sm.
 * Focus trap, Escape, scroll lock and aria wiring come from Radix.
 */
const Modal = ({ open, onClose, title, description, children, footer, size = 'md' }) => (
  <Dialog.Root open={!!open} onOpenChange={(o) => !o && onClose?.()}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[200] bg-ink/55 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <Dialog.Content
          aria-describedby={description ? undefined : undefined}
          className={cn(
            'pointer-events-auto relative w-full bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-premium-2xl outline-none',
            'data-[state=open]:animate-sheet-up sm:data-[state=open]:animate-pop-in',
            WIDTH[size] || WIDTH.md,
          )}
        >
          <div className="shrink-0 px-5 sm:px-6 pt-5 pb-4 flex items-start justify-between gap-4 border-b border-line/80">
            <div className="min-w-0">
              <Dialog.Title className="font-display font-semibold text-[19px] leading-snug truncate">{title}</Dialog.Title>
              {description && <Dialog.Description className="text-[14px] text-ink-muted mt-0.5">{description}</Dialog.Description>}
            </div>
            <Dialog.Close aria-label="Close" className="-mr-2 -mt-1 h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-full text-ink-muted hover:bg-paper hover:text-ink">
              <X size={20} />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-5 sm:px-6 py-5">{children}</div>
          {footer && (
            <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-line/80 flex gap-3 justify-end" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              {footer}
            </div>
          )}
        </Dialog.Content>
      </div>
    </Dialog.Portal>
  </Dialog.Root>
)

export default Modal
