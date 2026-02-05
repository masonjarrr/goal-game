import { useState, ReactNode } from 'react';
import styles from '../../styles/components/accordion.module.css';

interface AccordionSectionProps {
  title: string;
  badge?: string | number;
  badgeColor?: 'gold' | 'green' | 'red' | 'blue';
  icon?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  headerContent?: ReactNode;
}

export function AccordionSection({
  title,
  badge,
  badgeColor = 'gold',
  icon,
  defaultExpanded = false,
  children,
  headerContent,
}: AccordionSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`${styles.section} ${expanded ? styles.expanded : ''}`}>
      <button
        className={styles.header}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className={styles.headerLeft}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.title}>{title}</span>
          {badge !== undefined && (
            <span className={`${styles.badge} ${styles[badgeColor]}`}>{badge}</span>
          )}
        </div>
        {headerContent && <div className={styles.headerContent}>{headerContent}</div>}
        <span className={`${styles.chevron} ${expanded ? styles.chevronUp : ''}`}>▼</span>
      </button>
      <div className={styles.content}>
        <div className={styles.contentInner}>{children}</div>
      </div>
    </div>
  );
}
