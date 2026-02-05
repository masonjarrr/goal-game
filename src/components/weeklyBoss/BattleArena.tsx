import { useState } from 'react';
import { WeeklyBoss, BOSS_DAMAGE } from '../../types/weeklyBoss';
import { Character, Stats } from '../../types/character';
import { getXPProgress } from '../../utils/constants';
import { CharacterSprite } from '../character/CharacterSprite';
import { RPGProgressBar } from '../ui/RPGProgressBar';
import styles from '../../styles/components/battle-arena.module.css';

interface BattleArenaProps {
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

export function BattleArena({
  character,
  stats,
  boss,
  loading,
  hpPercentage,
  damageDealt,
  totalDefeated,
  weekStart,
  weekEnd,
}: BattleArenaProps) {
  const [showGuide, setShowGuide] = useState(false);
  const xpProgress = getXPProgress(character.total_xp);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className={styles.arena}>
        <div className={styles.loadingState}>Summoning this week's boss...</div>
      </div>
    );
  }

  if (!boss) {
    return (
      <div className={styles.arena}>
        <div className={styles.loadingState}>No boss found this week</div>
      </div>
    );
  }

  const isDefeated = boss.is_defeated;

  return (
    <div className={`${styles.arena} ${isDefeated ? styles.victoryArena : ''}`}>
      {/* Victory Banner */}
      {isDefeated && (
        <div className={styles.victoryBanner}>
          <span className={styles.victoryIcon}>🏆</span>
          <span className={styles.victoryText}>Victory!</span>
          <span className={styles.victoryReward}>+{boss.xp_reward} XP</span>
        </div>
      )}

      {/* Battle Scene */}
      <div className={styles.battleScene}>
        {/* Character Side */}
        <div className={styles.fighterSide}>
          <div className={styles.fighterSprite}>
            <CharacterSprite level={character.level} stats={stats} size="medium" />
          </div>
          <div className={styles.fighterInfo}>
            <div className={styles.fighterName}>{character.name}</div>
            <div className={styles.fighterTitle}>Level {character.level}</div>
          </div>
          <div className={styles.fighterBar}>
            <RPGProgressBar
              value={xpProgress.current}
              max={xpProgress.needed}
              color="gold"
              showValue={false}
            />
            <span className={styles.barLabel}>{xpProgress.current}/{xpProgress.needed} XP</span>
          </div>
        </div>

        {/* VS Center */}
        <div className={styles.vsCenter}>
          <div className={styles.vsText}>VS</div>
          <div className={styles.battleStats}>
            <div className={styles.damageDealt}>
              <span className={styles.damageValue}>{damageDealt}</span>
              <span className={styles.damageLabel}>DMG</span>
            </div>
          </div>
        </div>

        {/* Boss Side */}
        <div className={styles.fighterSide}>
          <div className={`${styles.bossSprite} ${isDefeated ? styles.defeated : ''}`}>
            <span className={styles.bossIcon}>{boss.icon}</span>
            {!isDefeated && <div className={styles.bossGlow} />}
          </div>
          <div className={styles.fighterInfo}>
            <div className={`${styles.fighterName} ${styles.bossName}`}>{boss.name}</div>
            <div className={styles.fighterTitle}>{boss.description}</div>
          </div>
          <div className={styles.fighterBar}>
            <div className={styles.hpBar}>
              <div
                className={`${styles.hpFill} ${hpPercentage < 30 ? styles.low : ''} ${isDefeated ? styles.empty : ''}`}
                style={{ width: `${hpPercentage}%` }}
              />
            </div>
            <span className={`${styles.barLabel} ${styles.hpLabel}`}>
              {boss.current_hp}/{boss.max_hp} HP
            </span>
          </div>
        </div>
      </div>

      {/* Battle Info Bar */}
      <div className={styles.battleInfo}>
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}>⚔️</span>
          <span className={styles.infoText}>{totalDefeated} bosses defeated</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}>🎁</span>
          <span className={styles.infoText}>
            +{boss.xp_reward} XP
            {boss.bonus_shields > 0 && ` +${boss.bonus_shields} Shield`}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}>📅</span>
          <span className={styles.infoText}>{formatDate(weekStart)} - {formatDate(weekEnd)}</span>
        </div>
      </div>

      {/* Damage Guide Toggle */}
      {!isDefeated && (
        <>
          <button className={styles.guideToggle} onClick={() => setShowGuide(!showGuide)}>
            {showGuide ? 'Hide' : 'How to Deal Damage'} {showGuide ? '▲' : '▼'}
          </button>

          {showGuide && (
            <div className={styles.damageGuide}>
              <div className={styles.guideGrid}>
                <div className={styles.guideItem}>
                  <span>Complete Step</span>
                  <span className={styles.guideAmount}>-{BOSS_DAMAGE.step_completed} HP</span>
                </div>
                <div className={styles.guideItem}>
                  <span>Activate Buff</span>
                  <span className={styles.guideAmount}>-{BOSS_DAMAGE.buff_activated} HP</span>
                </div>
                <div className={styles.guideItem}>
                  <span>Complete Quest</span>
                  <span className={styles.guideAmount}>-{BOSS_DAMAGE.quest_completed} HP</span>
                </div>
                <div className={styles.guideItem}>
                  <span>Complete Goal</span>
                  <span className={styles.guideAmount}>-{BOSS_DAMAGE.goal_completed} HP</span>
                </div>
                <div className={styles.guideItem}>
                  <span>Daily Quest</span>
                  <span className={styles.guideAmount}>-{BOSS_DAMAGE.daily_quest_completed} HP</span>
                </div>
                <div className={styles.guideItem}>
                  <span>Focus Session</span>
                  <span className={styles.guideAmount}>-{BOSS_DAMAGE.focus_session} HP</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
