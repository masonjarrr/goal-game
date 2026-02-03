import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from '../../styles/components/rpg-input.module.css';

interface RPGInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function RPGInput({ label, className, ...props }: RPGInputProps) {
  return (
    <div className={styles.inputGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={`${styles.input} ${className || ''}`} {...props} />
    </div>
  );
}

interface RPGSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
}

export function RPGSelect({ label, children, className, ...props }: RPGSelectProps) {
  return (
    <div className={styles.inputGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <select className={`${styles.select} ${className || ''}`} {...props}>
        {children}
      </select>
    </div>
  );
}

interface RPGTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function RPGTextarea({ label, className, ...props }: RPGTextareaProps) {
  return (
    <div className={styles.inputGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea className={`${styles.textarea} ${className || ''}`} {...props} />
    </div>
  );
}
