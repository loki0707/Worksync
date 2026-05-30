import React, { useEffect } from 'react';
import { X } from 'lucide-react';
export default function Modal({ open, onClose, title, children, size='' }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal${size ? ` modal-${size}` : ''}`} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <span className="modal-title">{title}</span>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16}/></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
