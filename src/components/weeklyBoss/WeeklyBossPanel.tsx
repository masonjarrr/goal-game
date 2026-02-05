import { useState } from 'react';
import { WeeklyBoss, BOSS_DAMAGE } from '../../types/weeklyBoss';
import { RPGPanel } from '../ui/RPGPanel';
import { RPGButton } from '../ui/RPGButton';
import styles from '../../styles/components/weekly-boss.module.css';

interface WeeklyBossPanelProps {
  boss: WeeklyBoss | null;
  loading: boolean;
  weekStart: string;
  weekEnd: string;
  hpPercentage: number;
  damageDealt: number;
  totalDefeated: number;
}

export function WeeklyBossPanel({
  boss,
  loading,
  weekStart,
  weekEnd,
  hpPercentage,
  damageDealt,
  totalDefeated,
}: WeeklyBossPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const buttonLabel = loading
    ? 'Weekly Boss (Loading...)'
    : boss?.is_defeated
    ? `Weekly Boss - ${boss.name} DEFEATED!`
    : `Weekly Boss - ${boss?.name} (${boss?.current_hp}/${boss?.max_hp} HP)`;

  return (
    <div className={styles.bossPanel}>
      <RPGButton
        size="small"
        variant={boss?.is_defeated ? 'primary' : undefined}
        onClick={() => setExpanded(!expanded)}
        className={styles.bossButton}
      >
        {expanded ? 'Hide Weekly Boss' : buttonLabel}
      </RPGButton>

      {expanded && (
        <RPGPanel className={styles.bossContent} glow={boss?.is_defeated}>
          {loading ? (
            <div className={styles.loading}>Summoning this week's boss...</div>
          ) : boss ? (
            <>
              {/* Boss Header */}
              <div className={styles.bossHeader}>
                <span className={`${styles.bossIcon} ${boss.is_defeated ? styles.defeated : ''}`}>
                  {boss.icon}
                </span>
                <div className={styles.bossInfo}>
                  <div className={`${styles.bossName} ${boss.is_defeated ? styles.defeated : ''}`}>
                    {boss.name}
                  </div>
                  <div className={styles.bossDescription}>{boss.description}</div>
                </div>
                <div className={styles.bossStatus}>
                  <div className={styles.bossReward}>+{boss.xp_reward} XP</div>
                  {boss.bonus_shields > 0 && (
                    <div className={styles.bossReward}>+{boss.bonus_shields} Shield{boss.bonus_shields > 1 ? 's' : ''}</div>
                  )}
                </div>
              </div>

              {/* Defeated Banner */}
              {boss.is_defeated && (
                <div className={styles.defeatedBanner}>
                  <div className={styles.defeatedTitle}>Victory!</div>
                  <div className={styles.defeatedText}>
                    You defeated {boss.name} this week!
                  </div>
                  <div className={styles.defeatedRewards}>
                    Rewards: +{boss.xp_reward} XP
                    {boss.bonus_shields > 0 && `, +${boss.bonus_shields} Streak Shield${boss.bonus_shields > 1 ? 's' : ''}`}
                  </div>
                </div>
              )}

              {/* HP Bar */}
              {!boss.is_defeated && (
                <div className={styles.hpSection}>
                  <div className={styles.hpLabel}>
                    <span className={styles.hpTitle}>Boss HP</span>
                    <span className={styles.hpValue}>
                      {boss.current_hp} / {boss.max_hp}
                    </span>
                  </div>
                  <div className={styles.hpBar}>
                    <div
                      className={`${styles.hpFill} ${hpPercentage < 30 ? styles.low : ''}`}
                      style={{ width: `${hpPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Damage Stats */}
              <div className={styles.damageStats}>
                <div className={styles.damageStat}>
                  <div className={styles.damageStatValue}>{damageDealt}</div>
                  <div className={styles.damageStatLabel}>Damage Dealt</div>
                </div>
                <div className={styles.damageStat}>
                  <div className={styles.damageStatValue}>{totalDefeated}</div>
                  <div className={styles.damageStatLabel}>Bosses Defeated</div>
                </div>
              </div>

              {/* Damage Guide */}
              {!boss.is_defeated && (
                <div className={styles.damageGuide}>
                  <div className={styles.damageGuideTitle}>How to Deal Damage</div>
                  <div className={styles.damageGuideList}>
                    <div className={styles.damageGuideItem}>
                      <span>Complete Step</span>
                      <span className={styles.damageGuideAmount}>-{BOSS_DAMAGE.step_completed} HP</span>
                    </div>
                    <div className={styles.damageGuideItem}>
                      <span>Activate Buff</span>
                      <span className={styles.damageGuideAmount}>-{BOSS_DAMAGE.buff_activated} HP</span>
                    </div>
                    <div className={styles.damageGuideItem}>
                      <span>Complete Quest</span>
                      <span className={styles.damageGuideAmount}>-{BOSS_DAMAGE.quest_completed} HP</span>
                    </div>
                    <div className={styles.damageGuideItem}>
                      <span>Complete Goal</span>
                      <span className={styles.damageGuideAmount}>-{BOSS_DAMAGE.goal_completed} HP</span>
                    </div>
                    <div className={styles.damageGuideItem}>
                      <span>Daily Quest</span>
                      <span className={styles.damageGuideAmount}>-{BOSS_DAMAGE.daily_quest_completed} HP</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Week Info */}
              <div className={styles.weekInfo}>
                Week of {formatDate(weekStart)} - {formatDate(weekEnd)}
              </div>
            </>
          ) : (
            <div className={styles.loading}>No boss found</div>
          )}
        </RPGPanel>
      )}
    </div>
  );
}
