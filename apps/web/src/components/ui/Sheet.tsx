import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "./Button";
import "./sheet.css";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Optional control rendered left of the title, e.g. a back button. */
  leading?: ReactNode;
}

/**
 * Modal built on native <dialog>: focus trapping, Esc and top-layer come for free.
 * Bottom sheet on phones, centred panel from 640px.
 */
export function Sheet({ open, onClose, title, description, children, footer, leading }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="sheet__panel">
          <header className="sheet__head">
            {leading}
            <div className="stack gap-1 sheet__titles">
              <h2 id="sheet-title" className="sheet__title">
                {title}
              </h2>
              {description && <p className="sheet__desc">{description}</p>}
            </div>
            <IconButton icon="close" label="Close" onClick={onClose} />
          </header>
          <div className="sheet__body">{children}</div>
          {footer && <footer className="sheet__foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
