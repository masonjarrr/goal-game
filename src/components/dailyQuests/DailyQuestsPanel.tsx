import { useState } from 'react';
import { RPGPanel } from '../ui/RPGPanel';
import { RPGButton } from '../ui/RPGButton';
import { DailyQuest } from '../../types/dailyQuest';
import styles from '../../styles/components/daily-quests.module.css';

interface DailyQuestsPanelProps {
  quests: DailyQuest[];
  loading: boolean;
  allCompleted: boolean;
  completedCount: number;
  bonusClaimed: boolean;
  bonusXp: number;
  totalXpEarned: number;
  onClaimBonus: () => void;
  compact?: boolean;
}

export function DailyQuestsPanel({
  quests,
  loading,
  allCompleted,
  completedCount,
  bonusClaimed,
  bonusXp,
  onClaimBonus,
  compact = false,
}: DailyQuestsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  // Compact mode: render content directly without wrapper
  if (compact) {
    if (loading) {
      return <div className={styles.loading}>Loading daily quests...</div>;
    }
    if (quests.length === 0) {
      return <div className={styles.emptyState}>No daily quests available</div>;
    }
    return (
      <div className={styles.compactPanel}>
        <div className={styles.questsList}>
          {quests.map((quest) => (
            <QuestItem key={quest.id} quest={quest} compact />
          ))}
        </div>
        {allCompleted && !bonusClaimed && (
          <div className={styles.compactBonus}>
            <span>All quests complete!</span>
            <RPGButton size="small" onClick={onClaimBonus}>
              Claim +{bonusXp} XP
            </RPGButton>
          </div>
        )}
        {bonusClaimed && (
          <div className={styles.compactBonusClaimed}>
            ✓ Bonus claimed! +{bonusXp} XP
          </div>
        )}
      </div>
    );
  }

  const buttonLabel = loading
    ? 'Daily Quests (Loading...)'
    : `Daily Quests (${completedCount}/${quests.length})${allCompleted && !bonusClaimed ? ' - Bonus Ready!' : ''}`;

  return (
    <div className={styles.dailyQuestsPanel}>
      <RPGButton
        size="small"
        variant={allCompleted && !bonusClaimed ? 'primary' : undefined}
        onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', marginBottom: expanded ? 8 : 0 }}
      >
        {expanded ? 'Hide Daily Quests' : buttonLabel}
      </RPGButton>

      {expanded && (
        <RPGPanel
          glow={allCompleted && !bonusClaimed}
        >
          {loading ? (
            <div className={styles.loading}>Loading daily quests...</div>
          ) : quests.length === 0 ? (
            <div className={styles.emptyState}>No daily quests available</div>
          ) : (
            <>
              <div className={styles.questsList}>
                {quests.map((quest) => (
                  <QuestItem key={quest.id} quest={quest} />
                ))}
              </div>

              <div
                className={`${styles.bonusSection} ${
                  allCompleted && !bonusClaimed
                    ? styles.available
                    : bonusClaimed
                    ? styles.claimed
                    : ''
                }`}
              >
                <div className={styles.bonusTitle}>
                  {bonusClaimed ? 'Bonus Claimed!' : 'Complete All Quests'}
                </div>
                <div className={styles.bonusDescription}>
                  {bonusClaimed
                    ? 'Great work! See you tomorrow.'
                    : 'Finish all 3 quests to earn a bonus'}
                </div>
                <div className={styles.bonusXp}>+{bonusXp} XP</div>
                {allCompleted && !bonusClaimed && (
                  <RPGButton
                    className={styles.claimButton}
                    size="small"
                    onClick={onClaimBonus}
                  >
                    Claim Bonus
                  </RPGButton>
                )}
              </div>
            </>
          )}
        </RPGPanel>
      )}
    </div>
  );
}

function QuestItem({ quest, compact = false }: { quest: DailyQuest; compact?: boolean }) {
  const progress = Math.min(
    (quest.current_value / quest.target_value) * 100,
    100
  );

  if (compact) {
    return (
      <div className={`${styles.questItemCompact} ${quest.is_completed ? styles.completed : ''}`}>
        <div className={styles.questCheckboxCompact}>
          {quest.is_completed ? '✓' : '○'}
        </div>
        <span className={styles.questNameCompact}>{quest.title}</span>
        <div className={styles.progressBarCompact}>
          <div className={styles.progressFillCompact} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.progressTextCompact}>
          {quest.current_value}/{quest.target_value}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${styles.questItem} ${
        quest.is_completed ? styles.completed : ''
      }`}
    >
      <div className={styles.questItemHeader}>
        <div className={styles.questCheckbox}>
          {quest.is_completed && <span>&#10003;</span>}
        </div>
        <div className={styles.questInfo}>
          <div className={styles.questTitleRow}>
            <span className={styles.questName}>{quest.title}</span>
            <span className={styles.questXp}>+{quest.xp_reward} XP</span>
          </div>
          <div className={styles.questDescription}>{quest.description}</div>
        </div>
      </div>
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.progressText}>
          {quest.current_value}/{quest.target_value}
        </span>
      </div>
    </div>
  );
}
