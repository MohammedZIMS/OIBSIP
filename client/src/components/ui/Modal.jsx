import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

export default function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.querySelector('input,select,textarea,button')?.focus();
    const key = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') { // keep focus inside the dialog
        const f = [...ref.current.querySelectorAll('a[href],button:not([disabled]),input,select,textarea')];
        if (!f.length) return;
        const first = f[0]; const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-pan/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`card max-h-[92vh] w-full overflow-y-auto rounded-b-none p-6 sm:rounded-lg ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 hover:bg-crust/50 dark:hover:bg-white/10"><Icon name="close" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
