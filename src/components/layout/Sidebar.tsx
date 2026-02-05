import { TabId } from '../../types/common';
import styles from '../../styles/components/layout.module.css';

const NAV_ITEMS: { id: TabId; label: string; icon: string }[] = [
  { id: 'character', label: 'Character', icon: '⚔' },
  { id: 'quests', label: 'Quest Log', icon: '📜' },
  { id: 'buffs', label: 'Buffs', icon: '✨' },
  { id: 'focus', label: 'Focus Timer', icon: '🎯' },
  { id: 'skills', label: 'Skills', icon: '🌳' },
  { id: 'inventory', label: 'Inventory', icon: '🎒' },
];

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <div className={styles.logoTitle}>GOAL GAME</div>
        <div className={styles.logoSubtitle}>Life Management RPG</div>
      </div>
      <nav className={styles.sidebarNav}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activeTab === item.id ? styles.navItemActive : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
