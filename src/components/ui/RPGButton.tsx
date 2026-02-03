import { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from '../../styles/components/rpg-button.module.css';

interface RPGButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'normal' | 'small';
  fullWidth?: boolean;
  children: ReactNode;
}

export function RPGButton({
  variant = 'default',
  size = 'normal',
  fullWidth,
  children,
  className,
  ...props
}: RPGButtonProps) {
  const cls = [
    styles.button,
    variant !== 'default' && styles[variant],
    size === 'small' && styles.small,
    fullWidth && styles.fullWidth,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
