import { ReactNode, useEffect } from 'react';
import styles from '../../styles/components/rpg-modal.module.css';

interface RPGModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function RPGModal({ open, onClose, title, children, actions }: RPGModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>{title}</h3>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>
        )}
        {children}
        {actions && <div className={styles.modalActions}>{actions}</div>}
      </div>
    </div>
  );
}
