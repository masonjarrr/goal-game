import { useState } from 'react';
import { WeeklyBoss, BOSS_DAMAGE, BOSS_TEMPLATES } from '../../types/weeklyBoss';
import { Character, Stats } from '../../types/character';
import { getXPProgress } from '../../utils/constants';
import { CharacterSprite } from '../character/CharacterSprite';
import { RPGPanel } from '../ui/RPGPanel';
import { RPGProgressBar } from '../ui/RPGProgressBar';
import styles from '../../styles/components/boss-page.module.css';

interface BossPageProps {
  character: Character;
  stats: Stats;
  boss: WeeklyBoss | null;
  loading: boolean;
  hpPercentage: number;
  damageDealt: number;
  totalDefeated: number;
  weekStart: string;
  weekEnd: string;
}

export function BossPage({
  character,
  stats,
  boss,
  loading,
  hpPercentage,
  damageDealt,
  totalDefeated,
  weekStart,
  weekEnd,
}: BossPageProps) {
  const xpProgress = getXPProgress(character.total_xp);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className={styles.bossPage}>
        <div className={styles.loadingState}>Summoning this week's boss...</div>
      </div>
    );
  }

  if (!boss) {
    return (
      <div className={styles.bossPage}>
        <div className={styles.loadingState}>No boss found this week</div>
      </div>
    );
  }

  const isDefeated = boss.is_defeated;

  return (
    <div className={styles.bossPage}>
      {/* Week Header */}
      <div className={styles.weekHeader}>
        <span className={styles.weekLabel}>This Week's Challenge</span>
        <span className={styles.weekDates}>{formatDate(weekStart)} — {formatDate(weekEnd)}</span>
      </div>

      {/* Victory Banner */}
      {isDefeated && (
        <div className={styles.victoryBanner}>
          <div className={styles.victoryContent}>
            <span className={styles.victoryIcon}>🏆</span>
            <div className={styles.victoryText}>
              <div className={styles.victoryTitle}>Victory!</div>
              <div className={styles.victorySubtitle}>You defeated {boss.name} this week!</div>
            </div>
            <div className={styles.victoryRewards}>
              <span className={styles.rewardItem}>+{boss.xp_reward} XP</span>
              {boss.bonus_shields > 0 && (
                <span className={styles.rewardItem}>+{boss.bonus_shields} Shield{boss.bonus_shields > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Battle Arena */}
      <div className={styles.battleArena}>
        {/* Character Side */}
        <div className={styles.fighterCard}>
          <div className={styles.fighterSprite}>
            <CharacterSprite level={character.level} stats={stats} size="large" />
          </div>
          <div className={styles.fighterDetails}>
            <div className={styles.fighterName}>{character.name}</div>
            <div className={styles.fighterTitle}>Level {character.level} {character.title}</div>
            <div className={styles.fighterXP}>
              <RPGProgressBar
                value={xpProgress.current}
                max={xpProgress.needed}
                color="gold"
                showValue={false}
              />
              <span className={styles.xpText}>{xpProgress.current} / {xpProgress.needed} XP</span>
            </div>
          </div>
        </div>

        {/* VS Section */}
        <div className={styles.vsSection}>
          <div className={styles.vsGlow} />
          <div className={styles.vsText}>VS</div>
          <div className={styles.damageCounter}>
            <div className={styles.damageValue}>{damageDealt}</div>
            <div className={styles.damageLabel}>Total Damage</div>
          </div>
        </div>

        {/* Boss Side */}
        <div className={styles.fighterCard}>
          <div className={`${styles.bossSprite} ${isDefeated ? styles.defeated : ''}`}>
            <span className={styles.bossIcon}>{boss.icon}</span>
            {!isDefeated && <div className={styles.bossAura} />}
          </div>
          <div className={styles.fighterDetails}>
            <div className={`${styles.fighterName} ${styles.bossNameColor}`}>{boss.name}</div>
            <div className={styles.fighterTitle}>{boss.description}</div>
            <div className={styles.bossHP}>
              <div className={styles.hpBarContainer}>
                <div
                  className={`${styles.hpBar} ${hpPercentage < 30 ? styles.lowHP : ''}`}
                  style={{ width: `${hpPercentage}%` }}
                />
              </div>
              <span className={styles.hpText}>{boss.current_hp} / {boss.max_hp} HP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <RPGPanel className={styles.statCard}>
          <div className={styles.statIcon}>⚔️</div>
          <div className={styles.statValue}>{damageDealt}</div>
          <div className={styles.statLabel}>Damage This Week</div>
        </RPGPanel>
        <RPGPanel className={styles.statCard}>
          <div className={styles.statIcon}>💀</div>
          <div className={styles.statValue}>{totalDefeated}</div>
          <div className={styles.statLabel}>Bosses Defeated</div>
        </RPGPanel>
        <RPGPanel className={styles.statCard}>
          <div className={styles.statIcon}>🎁</div>
          <div className={styles.statValue}>+{boss.xp_reward}</div>
          <div className={styles.statLabel}>XP Reward</div>
        </RPGPanel>
        <RPGPanel className={styles.statCard}>
          <div className={styles.statIcon}>🛡️</div>
          <div className={styles.statValue}>{boss.bonus_shields}</div>
          <div className={styles.statLabel}>Shield Reward</div>
        </RPGPanel>
      </div>

      {/* Damage Guide */}
      {!isDefeated && (
        <RPGPanel header="How to Deal Damage" className={styles.damageGuide}>
          <div className={styles.guideText}>
            Complete tasks to deal damage to the boss. Defeat the boss before the week ends to earn rewards!
          </div>
          <div className={styles.damageGrid}>
            <div className={styles.damageItem}>
              <span className={styles.damageAction}>✅ Complete Step</span>
              <span className={styles.damageAmount}>-{BOSS_DAMAGE.step_completed} HP</span>
            </div>
            <div className={styles.damageItem}>
              <span className={styles.damageAction}>✨ Activate Buff</span>
              <span className={styles.damageAmount}>-{BOSS_DAMAGE.buff_activated} HP</span>
            </div>
            <div className={styles.damageItem}>
              <span className={styles.damageAction}>📋 Complete Quest</span>
              <span className={styles.damageAmount}>-{BOSS_DAMAGE.quest_completed} HP</span>
            </div>
            <div className={styles.damageItem}>
              <span className={styles.damageAction}>🎯 Complete Goal</span>
              <span className={styles.damageAmount}>-{BOSS_DAMAGE.goal_completed} HP</span>
            </div>
            <div className={styles.damageItem}>
              <span className={styles.damageAction}>📝 Daily Quest</span>
              <span className={styles.damageAmount}>-{BOSS_DAMAGE.daily_quest_completed} HP</span>
            </div>
            <div className={styles.damageItem}>
              <span className={styles.damageAction}>🎯 Focus Session</span>
              <span className={styles.damageAmount}>-{BOSS_DAMAGE.focus_session} HP</span>
            </div>
            <div className={styles.damageItem}>
              <span className={styles.damageAction}>🌅 Complete Routine</span>
              <span className={styles.damageAmount}>-{BOSS_DAMAGE.routine_completed} HP</span>
            </div>
          </div>
        </RPGPanel>
      )}

      {/* Boss Bestiary */}
      <RPGPanel header="Boss Bestiary" className={styles.bestiary}>
        <div className={styles.bestiaryText}>
          Face different bosses each week, each representing challenges to overcome.
        </div>
        <div className={styles.bestiaryGrid}>
          {BOSS_TEMPLATES.map((template) => (
            <div
              key={template.type}
              className={`${styles.bestiaryItem} ${boss.boss_type === template.type ? styles.currentBoss : ''}`}
            >
              <span className={styles.bestiaryIcon}>{template.icon}</span>
              <div className={styles.bestiaryInfo}>
                <div className={styles.bestiaryName}>{template.name}</div>
                <div className={styles.bestiaryDesc}>{template.description}</div>
                <div className={styles.bestiaryStats}>
                  <span>HP: {template.hpRange[0]}-{template.hpRange[1]}</span>
                  <span>•</span>
                  <span>+{template.xpReward} XP</span>
                  {template.bonusShields > 0 && (
                    <>
                      <span>•</span>
                      <span>+{template.bonusShields} Shield</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </RPGPanel>
    </div>
  );
}
