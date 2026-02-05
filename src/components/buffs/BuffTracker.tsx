import { useState, useMemo } from 'react';
import { BuffDefinition, ActiveBuff } from '../../types/buff';
import { StreakInfo, StreakMilestone, getLatestMilestone } from '../../types/streak';
import { STAT_NAMES } from '../../types/common';
import { parseStatEffects } from '../../utils/buffEngine';
import { RPGPanel } from '../ui/RPGPanel';
import { RPGButton } from '../ui/RPGButton';
import { RPGModal } from '../ui/RPGModal';
import { RPGInput, RPGTextarea, RPGSelect } from '../ui/RPGInput';
import styles from '../../styles/components/buffs.module.css';

interface BuffTrackerProps {
  definitions: BuffDefinition[];
  activeBuffs: ActiveBuff[];
  onCreateDefinition: (
    name: string,
    description: string,
    type: string,
    icon: string,
    durationHours: number,
    statEffects: string
  ) => void;
  onDeleteDefinition: (id: number) => void;
  onActivateBuff: (definitionId: number) => void;
  onDeactivateBuff: (logId: number) => void;
  streakInfos?: Map<number, StreakInfo>;
  shieldCount?: number;
  onUseShield?: (buffDefinitionId: number) => Promise<boolean>;
  getUnclaimedMilestones?: (buffDefinitionId: number) => StreakMilestone[];
  onClaimMilestones?: (buffDefinitionId: number) => Promise<StreakMilestone[]>;
}

interface Preset {
  name: string;
  description: string;
  type: 'buff' | 'debuff';
  icon: string;
  duration: number;
  stats: Record<string, number>;
}

const PRESETS: Preset[] = [
  // ── Buffs ──
  { name: 'Morning Exercise',       description: 'Worked out in the morning',                       type: 'buff',   icon: '💪', duration: 24, stats: { stamina: 3, health: 2, willpower: 1 } },
  { name: 'Cardio / Running',       description: 'Ran, cycled, swam, or did sustained cardio',      type: 'buff',   icon: '🏃', duration: 24, stats: { stamina: 3, health: 2 } },
  { name: 'Strength Training',      description: 'Lifted weights or did resistance training',       type: 'buff',   icon: '🏋', duration: 24, stats: { stamina: 2, health: 1, willpower: 2 } },
  { name: 'Yoga / Stretching',      description: 'Did yoga, stretching, or mobility work',          type: 'buff',   icon: '🧘', duration: 24, stats: { health: 2, focus: 1, willpower: 1 } },
  { name: '8 Hours Sleep',          description: 'Got a full night of quality sleep',                type: 'buff',   icon: '😴', duration: 24, stats: { health: 2, focus: 2, stamina: 1, willpower: 1 } },
  { name: 'Meditation',             description: 'Practiced mindfulness or meditation',              type: 'buff',   icon: '🧘', duration: 24, stats: { willpower: 3, focus: 2 } },
  { name: 'Healthy Meal',           description: 'Ate a balanced, nutritious meal',                  type: 'buff',   icon: '🥗', duration: 24, stats: { health: 3, stamina: 1 } },
  { name: 'Drank Enough Water',     description: 'Hit daily water intake goal',                     type: 'buff',   icon: '💧', duration: 24, stats: { health: 2, stamina: 1, focus: 1 } },
  { name: 'Read 30+ Minutes',       description: 'Read a book, article, or educational material',   type: 'buff',   icon: '📚', duration: 24, stats: { focus: 3, willpower: 1 } },
  { name: 'Studied / Learned',      description: 'Studied a course, skill, or new subject',         type: 'buff',   icon: '🧠', duration: 24, stats: { focus: 3, willpower: 2 } },
  { name: 'Deep Work Session',      description: 'Focused work with no distractions for 90+ min',   type: 'buff',   icon: '⚡', duration: 24, stats: { focus: 3, willpower: 2, stamina: 1 } },
  { name: 'Journaling',             description: 'Wrote in journal or reflected on the day',        type: 'buff',   icon: '📝', duration: 24, stats: { willpower: 2, focus: 1 } },
  { name: 'Cold Shower',            description: 'Took a cold shower or ice bath',                  type: 'buff',   icon: '🧊', duration: 24, stats: { willpower: 3, stamina: 1 } },
  { name: 'No Phone First Hour',    description: 'Avoided phone for first hour after waking',       type: 'buff',   icon: '🌅', duration: 24, stats: { focus: 2, willpower: 2 } },
  { name: 'Socialised',             description: 'Had meaningful social interaction',                type: 'buff',   icon: '🤝', duration: 24, stats: { charisma: 3, willpower: 1 } },
  { name: 'Helped Someone',         description: 'Did something kind or helpful for another person', type: 'buff',  icon: '🤲', duration: 24, stats: { charisma: 2, willpower: 1 } },
  { name: 'Creative Time',          description: 'Spent time on a creative pursuit',                type: 'buff',   icon: '🎨', duration: 24, stats: { focus: 2, charisma: 1, willpower: 1 } },
  { name: 'Sunlight / Nature',      description: 'Spent 20+ minutes outdoors in natural light',     type: 'buff',   icon: '☀', duration: 24, stats: { health: 2, stamina: 1, focus: 1 } },
  { name: 'Gratitude Practice',     description: 'Practiced gratitude — wrote or reflected on 3+',  type: 'buff',   icon: '🙏', duration: 24, stats: { willpower: 2, charisma: 1 } },
  { name: 'Meal Prep',              description: 'Prepared healthy meals in advance',                type: 'buff',   icon: '🍱', duration: 48, stats: { health: 2, willpower: 1, stamina: 1 } },
  { name: 'Cleaned / Organised',    description: 'Cleaned home, desk, or organised belongings',     type: 'buff',   icon: '🧹', duration: 24, stats: { focus: 1, willpower: 2 } },
  { name: 'Financial Check-In',     description: 'Reviewed budget, tracked expenses, or saved',     type: 'buff',   icon: '💰', duration: 24, stats: { willpower: 2, focus: 1 } },

  // ── Debuffs ──
  { name: 'Junk Food',              description: 'Ate fast food, excessive sugar, or processed food', type: 'debuff', icon: '🍕', duration: 24, stats: { health: -3, stamina: -1 } },
  { name: 'Skipped Exercise',       description: 'Had planned to exercise but didn\'t',              type: 'debuff', icon: '🛋', duration: 24, stats: { stamina: -2, willpower: -2 } },
  { name: 'Poor Sleep',             description: 'Got less than 6 hours or very poor quality',       type: 'debuff', icon: '😵', duration: 24, stats: { health: -2, focus: -2, stamina: -1, willpower: -1 } },
  { name: 'Doomscrolling',          description: 'Mindlessly scrolled social media for 30+ min',     type: 'debuff', icon: '📱', duration: 24, stats: { focus: -3, willpower: -2 } },
  { name: 'Excessive Gaming',       description: 'Played video games for 3+ hours unplanned',       type: 'debuff', icon: '🎮', duration: 24, stats: { focus: -2, willpower: -2, stamina: -1 } },
  { name: 'Binge Watching',         description: 'Watched TV/streaming for 3+ hours unplanned',     type: 'debuff', icon: '📺', duration: 24, stats: { focus: -2, willpower: -1, stamina: -1 } },
  { name: 'Alcohol',                description: 'Drank alcohol',                                   type: 'debuff', icon: '🍺', duration: 24, stats: { health: -2, focus: -2, willpower: -1 } },
  { name: 'Smoking / Vaping',       description: 'Smoked cigarettes or vaped',                      type: 'debuff', icon: '🚬', duration: 24, stats: { health: -3, stamina: -2 } },
  { name: 'Excessive Caffeine',     description: 'Had too much coffee or energy drinks',             type: 'debuff', icon: '☕', duration: 24, stats: { health: -1, focus: -1, stamina: -1 } },
  { name: 'Procrastinated',         description: 'Avoided important tasks most of the day',          type: 'debuff', icon: '😤', duration: 24, stats: { willpower: -3, focus: -2 } },
  { name: 'Skipped Meals',          description: 'Skipped a meal or barely ate',                    type: 'debuff', icon: '🚫', duration: 24, stats: { health: -2, stamina: -2, focus: -1 } },
  { name: 'Stayed Up Too Late',     description: 'Went to bed much later than planned',             type: 'debuff', icon: '🌙', duration: 24, stats: { health: -1, willpower: -2, stamina: -1 } },
  { name: 'Impulse Spending',       description: 'Made unnecessary or impulse purchases',           type: 'debuff', icon: '💸', duration: 24, stats: { willpower: -2 } },
  { name: 'Negative Self-Talk',     description: 'Caught in self-criticism or negative thought loops', type: 'debuff', icon: '🌧', duration: 24, stats: { willpower: -2, charisma: -2 } },
  { name: 'Social Isolation',       description: 'Avoided people or cancelled social plans',         type: 'debuff', icon: '🚪', duration: 24, stats: { charisma: -3, willpower: -1 } },
  { name: 'Sugary Drinks',          description: 'Had soda, energy drinks, or sugary beverages',    type: 'debuff', icon: '🥤', duration: 24, stats: { health: -2, stamina: -1 } },
  { name: 'Lost Temper',            description: 'Got angry or had an emotional outburst',           type: 'debuff', icon: '😡', duration: 24, stats: { charisma: -2, willpower: -2 } },
];

const BUFF_ICONS = ['💪', '🧘', '😴', '📚', '🏃', '🍎', '💧', '☀', '🎵', '🧠', '⚡', '🛡', '🍕', '📱', '🎮', '😤', '🍺', '☕', '🥗', '📝', '🧊', '🌅', '🤝', '🤲', '🎨', '🙏', '🍱', '🧹', '💰', '🛋', '😵', '📺', '🚬', '🚫', '🌙', '💸', '🌧', '🚪', '🥤', '😡', '🏋'];

function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m}m`;
}

export function BuffTracker({
  definitions,
  activeBuffs,
  onCreateDefinition,
  onDeleteDefinition,
  onActivateBuff,
  onDeactivateBuff,
  streakInfos,
  shieldCount = 0,
  onUseShield,
  getUnclaimedMilestones,
  onClaimMilestones,
}: BuffTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [expandedBuffs, setExpandedBuffs] = useState(true);
  const [expandedDebuffs, setExpandedDebuffs] = useState(true);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState('buff');
  const [formIcon, setFormIcon] = useState('💪');
  const [formDurationMinutes, setFormDurationMinutes] = useState(1440);
  const [formStats, setFormStats] = useState<Record<string, number>>({});

  const applyPreset = (presetIndex: string) => {
    if (presetIndex === '') return;
    const preset = PRESETS[Number(presetIndex)];
    if (!preset) return;
    setFormName(preset.name);
    setFormDesc(preset.description);
    setFormType(preset.type);
    setFormIcon(preset.icon);
    setFormDurationMinutes(preset.duration * 60);
    setFormStats({ ...preset.stats });
  };

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormType('buff');
    setFormIcon('💪');
    setFormDurationMinutes(1440);
    setFormStats({});
  };

  const handleCreate = () => {
    if (!formName.trim()) return;
    const filteredStats = Object.fromEntries(Object.entries(formStats).filter(([, v]) => v !== 0));
    const durationHours = formDurationMinutes / 60;
    onCreateDefinition(formName.trim(), formDesc.trim(), formType, formIcon, durationHours, JSON.stringify(filteredStats));
    resetForm();
    setShowForm(false);
  };

  function getRemainingTime(expiresAt: string): string {
    const now = new Date();
    const exp = new Date(expiresAt + 'Z');
    const diff = exp.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  const buffs = definitions.filter((d) => d.type === 'buff');
  const debuffs = definitions.filter((d) => d.type === 'debuff');

  // Quick actions: buffs with streaks or recently used
  const quickActionBuffs = useMemo(() => {
    return buffs
      .filter((b) => {
        const streak = streakInfos?.get(b.id);
        return streak && streak.currentStreak > 0;
      })
      .slice(0, 6);
  }, [buffs, streakInfos]);

  const quickActionDebuffs = useMemo(() => {
    return debuffs.slice(0, 4);
  }, [debuffs]);

  const buffPresets = PRESETS.map((p, i) => ({ ...p, index: i })).filter((p) => p.type === 'buff');
  const debuffPresets = PRESETS.map((p, i) => ({ ...p, index: i })).filter((p) => p.type === 'debuff');

  const activeBuffsList = activeBuffs.filter((b) => b.type === 'buff');
  const activeDebuffsList = activeBuffs.filter((b) => b.type === 'debuff');

  return (
    <div className={styles.buffTracker}>
      {/* Active Effects - Always at top */}
      {activeBuffs.length > 0 && (
        <div className={styles.activeEffectsBar}>
          <div className={styles.activeEffectsHeader}>
            <span className={styles.activeEffectsTitle}>Active Effects</span>
            <span className={styles.activeEffectsCount}>
              {activeBuffsList.length > 0 && <span className={styles.buffCount}>+{activeBuffsList.length}</span>}
              {activeDebuffsList.length > 0 && <span className={styles.debuffCount}>-{activeDebuffsList.length}</span>}
            </span>
          </div>
          <div className={styles.activeEffectsList}>
            {activeBuffs.map((buff) => {
              const effects = parseStatEffects(buff.stat_effects);
              const effectStr = Object.entries(effects)
                .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.slice(0, 3)}`)
                .join(' ');
              return (
                <div
                  key={buff.id}
                  className={`${styles.activeEffectChip} ${buff.type === 'buff' ? styles.buffChip : styles.debuffChip}`}
                >
                  <span className={styles.chipIcon}>{buff.icon}</span>
                  <div className={styles.chipInfo}>
                    <span className={styles.chipName}>{buff.name}</span>
                    <span className={styles.chipMeta}>{getRemainingTime(buff.expires_at)} • {effectStr}</span>
                  </div>
                  <button className={styles.chipRemove} onClick={() => onDeactivateBuff(buff.id)}>×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {(quickActionBuffs.length > 0 || quickActionDebuffs.length > 0) && (
        <div className={styles.quickActions}>
          <div className={styles.quickActionsHeader}>
            <span className={styles.quickActionsTitle}>Quick Actions</span>
            <span className={styles.quickActionsHint}>Tap to activate</span>
          </div>
          <div className={styles.quickActionsGrid}>
            {quickActionBuffs.map((def) => {
              const streak = streakInfos?.get(def.id);
              const isActive = activeBuffs.some((b) => b.definition_id === def.id);
              return (
                <button
                  key={def.id}
                  className={`${styles.quickActionBtn} ${styles.quickBuff} ${isActive ? styles.isActive : ''}`}
                  onClick={() => onActivateBuff(def.id)}
                  disabled={isActive}
                >
                  <span className={styles.quickIcon}>{def.icon}</span>
                  <span className={styles.quickName}>{def.name}</span>
                  {streak && streak.currentStreak > 0 && (
                    <span className={styles.quickStreak}>🔥{streak.currentStreak}</span>
                  )}
                </button>
              );
            })}
            {quickActionDebuffs.map((def) => {
              const isActive = activeBuffs.some((b) => b.definition_id === def.id);
              return (
                <button
                  key={def.id}
                  className={`${styles.quickActionBtn} ${styles.quickDebuff} ${isActive ? styles.isActive : ''}`}
                  onClick={() => onActivateBuff(def.id)}
                  disabled={isActive}
                >
                  <span className={styles.quickIcon}>{def.icon}</span>
                  <span className={styles.quickName}>{def.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Shield Inventory */}
      <div className={styles.shieldInventory}>
        <span className={styles.shieldIcon}>🛡️</span>
        <div className={styles.shieldInfo}>
          <div className={styles.shieldTitle}>Streak Shields</div>
          <div className={styles.shieldDesc}>Protects a streak if you miss a day</div>
        </div>
        <span className={styles.shieldCount}>{shieldCount}</span>
      </div>

      {/* Toolbar */}
      <div className={styles.buffToolbar}>
        <RPGButton variant="primary" onClick={() => { resetForm(); setShowForm(true); }}>
          + New Buff/Debuff
        </RPGButton>
      </div>

      {/* Collapsible Buffs Section */}
      <div className={styles.collapsibleSection}>
        <div
          className={styles.sectionHeader}
          onClick={() => setExpandedBuffs(!expandedBuffs)}
        >
          <span className={`${styles.sectionExpand} ${expandedBuffs ? styles.expanded : ''}`}>▶</span>
          <span className={styles.sectionIcon}>✨</span>
          <span className={styles.sectionTitle}>Buffs (Positive Habits)</span>
          <span className={styles.sectionCount}>{buffs.length}</span>
        </div>
        {expandedBuffs && (
          <div className={styles.sectionContent}>
            {buffs.length === 0 ? (
              <div className={styles.emptyStateSmall}>No buffs defined yet. Create one above!</div>
            ) : (
              <div className={styles.compactGrid}>
                {buffs.map((def) => (
                  <CompactBuffCard
                    key={def.id}
                    definition={def}
                    onActivate={onActivateBuff}
                    onDelete={onDeleteDefinition}
                    streakInfo={streakInfos?.get(def.id)}
                    shieldCount={shieldCount}
                    onUseShield={onUseShield}
                    unclaimedMilestones={getUnclaimedMilestones?.(def.id) || []}
                    onClaimMilestones={onClaimMilestones}
                    isActive={activeBuffs.some((b) => b.definition_id === def.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Debuffs Section */}
      <div className={styles.collapsibleSection}>
        <div
          className={`${styles.sectionHeader} ${styles.debuffHeader}`}
          onClick={() => setExpandedDebuffs(!expandedDebuffs)}
        >
          <span className={`${styles.sectionExpand} ${expandedDebuffs ? styles.expanded : ''}`}>▶</span>
          <span className={styles.sectionIcon}>💀</span>
          <span className={styles.sectionTitle}>Debuffs (Negative Habits)</span>
          <span className={styles.sectionCount}>{debuffs.length}</span>
        </div>
        {expandedDebuffs && (
          <div className={styles.sectionContent}>
            {debuffs.length === 0 ? (
              <div className={styles.emptyStateSmall}>No debuffs defined yet.</div>
            ) : (
              <div className={styles.compactGrid}>
                {debuffs.map((def) => (
                  <CompactBuffCard
                    key={def.id}
                    definition={def}
                    onActivate={onActivateBuff}
                    onDelete={onDeleteDefinition}
                    isActive={activeBuffs.some((b) => b.definition_id === def.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Form */}
      <RPGModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Buff / Debuff"
        actions={
          <>
            <RPGButton onClick={() => setShowForm(false)}>Cancel</RPGButton>
            <RPGButton variant="primary" onClick={handleCreate}>Create</RPGButton>
          </>
        }
      >
        <div className={styles.formGrid}>
          <RPGSelect
            label="Quick Select — Common Habits"
            value=""
            onChange={(e) => applyPreset(e.target.value)}
          >
            <option value="">— Choose a preset to auto-fill —</option>
            <optgroup label="Buffs (Positive Habits)">
              {buffPresets.map((p) => (
                <option key={p.index} value={p.index}>
                  {p.icon} {p.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Debuffs (Negative Habits)">
              {debuffPresets.map((p) => (
                <option key={p.index} value={p.index}>
                  {p.icon} {p.name}
                </option>
              ))}
            </optgroup>
          </RPGSelect>

          <div className={styles.divider} />

          <div className={styles.formRow}>
            <RPGInput label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Morning Exercise" />
            <RPGSelect label="Type" value={formType} onChange={(e) => setFormType(e.target.value)}>
              <option value="buff">Buff (Positive)</option>
              <option value="debuff">Debuff (Negative)</option>
            </RPGSelect>
          </div>
          <RPGTextarea label="Description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Describe this habit..." />
          <div className={styles.formRow}>
            <RPGSelect label="Icon" value={formIcon} onChange={(e) => setFormIcon(e.target.value)}>
              {BUFF_ICONS.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </RPGSelect>
            <RPGInput label="Duration (minutes)" type="number" value={formDurationMinutes} onChange={(e) => setFormDurationMinutes(Number(e.target.value))} min={1} max={10080} />
          </div>
          <div>
            <label className={styles.statEffectLabel} style={{ display: 'block', marginBottom: 8, fontFamily: 'var(--font-heading)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Stat Effects
            </label>
            {STAT_NAMES.map((stat) => (
              <div key={stat} className={styles.statEffectRow}>
                <span className={styles.statEffectLabel}>{stat}</span>
                <input
                  type="number"
                  className={styles.statEffectInput}
                  value={formStats[stat] || 0}
                  onChange={(e) => setFormStats({ ...formStats, [stat]: Number(e.target.value) })}
                  style={{
                    padding: '4px 8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)',
                    borderRadius: '4px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </RPGModal>
    </div>
  );
}

function CompactBuffCard({
  definition,
  onActivate,
  onDelete,
  streakInfo,
  shieldCount = 0,
  onUseShield,
  unclaimedMilestones = [],
  onClaimMilestones,
  isActive,
}: {
  definition: BuffDefinition;
  onActivate: (id: number) => void;
  onDelete: (id: number) => void;
  streakInfo?: StreakInfo;
  shieldCount?: number;
  onUseShield?: (buffDefinitionId: number) => Promise<boolean>;
  unclaimedMilestones?: StreakMilestone[];
  onClaimMilestones?: (buffDefinitionId: number) => Promise<StreakMilestone[]>;
  isActive?: boolean;
}) {
  const effects = parseStatEffects(definition.stat_effects);
  const effectStr = Object.entries(effects)
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.slice(0, 3)}`)
    .join(' ');

  const currentMilestone = streakInfo ? getLatestMilestone(streakInfo.currentStreak) : null;
  const hasStreak = streakInfo && streakInfo.currentStreak > 0;
  const isAtRisk = streakInfo?.isAtRisk && !streakInfo?.shieldActive;
  const hasShieldActive = streakInfo?.shieldActive;

  const handleUseShield = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUseShield && streakInfo) {
      await onUseShield(definition.id);
    }
  };

  const handleClaimMilestones = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClaimMilestones) {
      await onClaimMilestones(definition.id);
    }
  };

  return (
    <div
      className={`${styles.compactCard} ${definition.type === 'buff' ? styles.compactBuff : styles.compactDebuff} ${isActive ? styles.cardActive : ''}`}
      onClick={() => !isActive && onActivate(definition.id)}
    >
      <div className={styles.compactCardMain}>
        <span className={styles.compactIcon}>{definition.icon}</span>
        <div className={styles.compactInfo}>
          <div className={styles.compactName}>
            {definition.name}
            {currentMilestone && (
              <span className={styles.compactMilestone}>{currentMilestone.icon}</span>
            )}
          </div>
          <div className={styles.compactMeta}>
            {formatDuration(definition.duration_hours)} • {effectStr}
          </div>
        </div>
        {hasStreak && (
          <div className={`${styles.compactStreak} ${isAtRisk ? styles.atRisk : ''} ${hasShieldActive ? styles.shieldActive : ''}`}>
            {hasShieldActive ? '🛡️' : '🔥'}{streakInfo!.currentStreak}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={styles.compactActions}>
        {isAtRisk && shieldCount > 0 && onUseShield && (
          <button className={styles.compactActionBtn} onClick={handleUseShield} title="Use Shield">
            🛡️
          </button>
        )}
        {unclaimedMilestones.length > 0 && onClaimMilestones && (
          <button className={`${styles.compactActionBtn} ${styles.claimBtn}`} onClick={handleClaimMilestones} title="Claim Milestone">
            🏆
          </button>
        )}
        <button
          className={`${styles.compactActionBtn} ${styles.deleteBtn}`}
          onClick={(e) => { e.stopPropagation(); onDelete(definition.id); }}
          title="Delete"
        >
          ×
        </button>
      </div>

      {isActive && <div className={styles.activeIndicator}>Active</div>}
    </div>
  );
}
