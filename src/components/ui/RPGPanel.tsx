import { ReactNode } from 'react';
import styles from '../../styles/components/rpg-panel.module.css';

interface RPGPanelProps {
  children: ReactNode;
  header?: ReactNode;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function RPGPanel({ children, header, glow, className, style }: RPGPanelProps) {
  const cls = [styles.panel, glow && styles.panelGlow, className].filter(Boolean).join(' ');
  return (
    <div className={cls} style={style}>
      {header && <div className={styles.panelHeader}>{header}</div>}
      {children}
    </div>
  );
}
