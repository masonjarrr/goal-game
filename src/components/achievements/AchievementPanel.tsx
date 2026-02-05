import { useState } from 'react';
import {
  AchievementWithProgress,
  AchievementCategory,
  ACHIEVEMENT_CATEGORY_LABELS,
  ACHIEVEMENT_CATEGORY_ICONS,
} from '../../types/achievement';
import { RPGPanel } from '../ui/RPGPanel';
import styles from '../../styles/components/achievements.module.css';

interface AchievementPanelProps {
  achievements: AchievementWithProgress[];
  stats: { total: number; unlocked: number; totalXp: number; earnedXp: number };
  loading?: boolean;
  compact?: boolean;
}

const CATEGORIES: AchievementCategory[] = ['quests', 'buffs', 'streaks', 'boss', 'levels', 'special'];

export function AchievementPanel({ achievements, stats, loading, compact = false }: AchievementPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  const getCategoryCount = (category: AchievementCategory) => {
    const catAchievements = achievements.filter((a) => a.category === category);
    const unlocked = catAchievements.filter((a) => a.unlocked).length;
    return { unlocked, total: catAchievements.length };
  };

  const progressPercent = stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0;

  if (loading) {
    return (
      <RPGPanel header="Achievements">
        <div className={styles.emptyState}>Loading achievements...</div>
      </RPGPanel>
    );
  }

  return (
    <RPGPanel header="Achievements" glow>
      <div className={styles.achievementPanel}>
        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.unlocked}</span>
            <span className={styles.statLabel}>Unlocked</span>
          </div>
          <div className={styles.progressBarContainer}>
            <div className={styles.progressLabel}>{progressPercent}% Complete</div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.earnedXp}</span>
            <span className={styles.statLabel}>XP Earned</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className={styles.categoryTabs}>
          <button
            className={`${styles.categoryTab} ${selectedCategory === 'all' ? styles.active : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <span className={styles.categoryIcon}>🏆</span>
            All
            <span className={styles.categoryCount}>
              {stats.unlocked}/{stats.total}
            </span>
          </button>
          {CATEGORIES.map((category) => {
            const count = getCategoryCount(category);
            if (count.total === 0) return null;
            return (
              <button
                key={category}
                className={`${styles.categoryTab} ${selectedCategory === category ? styles.active : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                <span className={styles.categoryIcon}>{ACHIEVEMENT_CATEGORY_ICONS[category]}</span>
                {ACHIEVEMENT_CATEGORY_LABELS[category]}
                <span className={styles.categoryCount}>
                  {count.unlocked}/{count.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Achievement Grid */}
        {filteredAchievements.length === 0 ? (
          <div className={styles.emptyState}>No achievements in this category yet</div>
        ) : (
          <div className={styles.achievementGrid}>
            {filteredAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        )}
      </div>
    </RPGPanel>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementWithProgress }) {
  const cardClass = `${styles.achievementCard} ${
    achievement.unlocked ? styles.unlocked : styles.locked
  } ${achievement.is_hidden && !achievement.unlocked ? styles.hidden : ''}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'Z');
    return date.toLocaleDateString();
  };

  return (
    <div className={cardClass}>
      <div className={styles.achievementIcon}>{achievement.icon}</div>
      <div className={styles.achievementInfo}>
        <div className={styles.achievementName}>
          {achievement.is_hidden && !achievement.unlocked ? '???' : achievement.name}
        </div>
        <div className={styles.achievementDesc}>
          {achievement.is_hidden && !achievement.unlocked
            ? 'Hidden achievement'
            : achievement.description}
        </div>
        <div className={styles.achievementMeta}>
          <span className={styles.achievementXp}>+{achievement.xp_reward} XP</span>
          {achievement.unlocked ? (
            <span className={styles.achievementUnlockDate}>
              Unlocked {formatDate(achievement.unlocked_at!)}
            </span>
          ) : (
            <div className={styles.achievementProgress}>
              <div className={styles.achievementProgressTrack}>
                <div
                  className={styles.achievementProgressFill}
                  style={{ width: `${achievement.progress_percent}%` }}
                />
              </div>
              <span className={styles.achievementProgressText}>
                {achievement.current_value}/{achievement.requirement_value}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
