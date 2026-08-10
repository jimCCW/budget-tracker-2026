'use client';
import { Dialog } from 'primereact/dialog';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max width class, e.g. 'max-w-lg' or 'max-w-4xl'. Defaults to 'max-w-lg'. */
  maxWidth?: string;
  /** id of the heading rendered inside `children` — gives the dialog an accessible name. */
  ariaLabelledBy?: string;
};

export function Modal({
  open,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  ariaLabelledBy,
}: ModalProps) {
  return (
    <Dialog
      visible={open}
      onHide={onClose}
      closable={false}
      dismissableMask={true}
      pt={{
        mask: {
          className:
            'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm',
        },
        root: {
          className: `relative w-full ${maxWidth} bg-surface rounded-xl shadow-lg border border-border`,
          'aria-labelledby': ariaLabelledBy,
        },
        content: { className: 'max-h-[90vh] overflow-y-auto p-0' },
        header: { className: 'hidden' },
      }}
    >
      {children}
    </Dialog>
  );
}
