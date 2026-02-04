import { useState } from 'react';
import { Character, XPLogEntry, Stats } from '../../types/character';
import { ActiveBuff } from '../../types/buff';
import { getXPProgress } from '../../utils/constants';
import { parseStatEffects } from '../../utils/buffEngine';
import { STAT_NAMES } from '../../types/common';
import { RPGPanel } from '../ui/RPGPanel';
import { RPGProgressBar } from '../ui/RPGProgressBar';
import { RPGButton } from '../ui/RPGButton';
import { RPGInput } from '../ui/RPGInput';
import { CharacterSprite } from './CharacterSprite';
import styles from '../../styles/components/character.module.css';

interface CharacterScreenProps {
  character: Character;
  stats: Stats;
  activeBuffs: ActiveBuff[];
  xpLog: XPLogEntry[];
  onNameChange: (name: string) => void;
}

const STAT_COLORS: Record<string, 'gold' | 'green' | 'blue'> = {
  stamina: 'green',
  willpower: 'blue',
  health: 'gold',
  focus: 'blue',
  charisma: 'gold',
};

export function CharacterScreen({ character, stats, activeBuffs, xpLog, onNameChange }: CharacterScreenProps) {
  const xpProgress = getXPProgress(character.total_xp);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(character.name);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onNameChange(nameInput.trim());
      setEditingName(false);
    }
  };

  function getRemainingTime(expiresAt: string): string {
    const now = new Date();
    const exp = new Date(expiresAt + 'Z');
    const diff = exp.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m remaining`;
    return `${mins}m remaining`;
  }

  return (
    <div className={styles.characterGrid}>
      <div className={styles.characterMain}>
        <RPGPanel>
          <div className={styles.profileSection}>
            <CharacterSprite level={character.level} stats={stats} />
            {editingName ? (
              <div className={styles.nameEditRow}>
                <RPGInput
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                />
                <RPGButton size="small" variant="primary" onClick={handleSaveName}>
                  Save
                </RPGButton>
                <RPGButton size="small" onClick={() => setEditingName(false)}>
                  Cancel
                </RPGButton>
              </div>
            ) : (
              <>
                <div className={styles.characterNameDisplay}>{character.name}</div>
                <RPGButton size="small" variant="ghost" onClick={() => setEditingName(true)}>
                  Rename
                </RPGButton>
              </>
            )}
            <div className={styles.characterTitleDisplay}>
              Level {character.level} — {character.title}
            </div>
            <div className={styles.xpSection}>
              <RPGProgressBar
                value={xpProgress.current}
                max={xpProgress.needed}
                label="Experience"
                size="large"
                shimmer
              />
              <div className={styles.totalXP}>{character.total_xp} Total XP</div>
            </div>
          </div>
        </RPGPanel>

        <RPGPanel header="Stats">
          <div className={styles.statsGrid}>
            {STAT_NAMES.map((stat) => (
              <div key={stat} className={styles.statRow}>
                <span className={styles.statName}>{stat}</span>
                <div className={styles.statBar}>
                  <RPGProgressBar
                    value={stats[stat]}
                    max={30}
                    showValue={false}
                    color={STAT_COLORS[stat] || 'gold'}
                  />
                </div>
                <span className={styles.statValue}>{stats[stat]}</span>
              </div>
            ))}
          </div>
        </RPGPanel>
      </div>

      <div className={styles.characterSide}>
        <RPGPanel header="Active Effects">
          {activeBuffs.length === 0 ? (
            <div className={styles.emptyState}>No active buffs or debuffs</div>
          ) : (
            <div className={styles.buffsList}>
              {activeBuffs.map((buff) => {
                const effects = parseStatEffects(buff.stat_effects);
                const effectStr = Object.entries(effects)
                  .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`)
                  .join(', ');
                return (
                  <div
                    key={buff.id}
                    className={`${styles.activeBuff} ${buff.type === 'buff' ? styles.buffType : styles.debuffType}`}
                  >
                    <span className={styles.buffIcon}>{buff.icon}</span>
                    <div className={styles.buffInfo}>
                      <div className={styles.buffName}>{buff.name}</div>
                      <div className={styles.buffTimer}>
                        {getRemainingTime(buff.expires_at)}
                        {effectStr && ` — ${effectStr}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </RPGPanel>

        <RPGPanel header="XP History">
          {xpLog.length === 0 ? (
            <div className={styles.emptyState}>No XP earned yet. Complete steps to earn XP!</div>
          ) : (
            <div className={styles.xpLogList}>
              {xpLog.slice(0, 20).map((entry) => (
                <div key={entry.id} className={styles.xpLogEntry}>
                  <span className={styles.xpLogReason}>{entry.reason}</span>
                  <span className={`${styles.xpLogAmount} ${entry.amount < 0 ? styles.negative : ''}`}>
                    {entry.amount > 0 ? '+' : ''}
                    {entry.amount} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </RPGPanel>
      </div>
    </div>
  );
}
