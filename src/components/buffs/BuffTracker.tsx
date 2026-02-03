import { useState } from 'react';
import { BuffDefinition, ActiveBuff } from '../../types/buff';
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

export function BuffTracker({
  definitions,
  activeBuffs,
  onCreateDefinition,
  onDeleteDefinition,
  onActivateBuff,
  onDeactivateBuff,
}: BuffTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState('buff');
  const [formIcon, setFormIcon] = useState('💪');
  const [formDuration, setFormDuration] = useState(24);
  const [formStats, setFormStats] = useState<Record<string, number>>({});

  const applyPreset = (presetIndex: string) => {
    if (presetIndex === '') return;
    const preset = PRESETS[Number(presetIndex)];
    if (!preset) return;
    setFormName(preset.name);
    setFormDesc(preset.description);
    setFormType(preset.type);
    setFormIcon(preset.icon);
    setFormDuration(preset.duration);
    setFormStats({ ...preset.stats });
  };

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormType('buff');
    setFormIcon('💪');
    setFormDuration(24);
    setFormStats({});
  };

  const handleCreate = () => {
    if (!formName.trim()) return;
    const filteredStats = Object.fromEntries(Object.entries(formStats).filter(([, v]) => v !== 0));
    onCreateDefinition(formName.trim(), formDesc.trim(), formType, formIcon, formDuration, JSON.stringify(filteredStats));
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

  const buffPresets = PRESETS.map((p, i) => ({ ...p, index: i })).filter((p) => p.type === 'buff');
  const debuffPresets = PRESETS.map((p, i) => ({ ...p, index: i })).filter((p) => p.type === 'debuff');

  return (
    <div className={styles.buffTracker}>
      <div className={styles.buffToolbar}>
        <div />
        <RPGButton variant="primary" onClick={() => { resetForm(); setShowForm(true); }}>
          + New Buff/Debuff
        </RPGButton>
      </div>

      {/* Active Effects */}
      {activeBuffs.length > 0 && (
        <RPGPanel header="Active Effects" glow>
          <div className={styles.activeSection}>
            {activeBuffs.map((buff) => {
              const effects = parseStatEffects(buff.stat_effects);
              const effectStr = Object.entries(effects)
                .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`)
                .join(', ');
              return (
                <div
                  key={buff.id}
                  className={`${styles.activeBuffItem} ${buff.type === 'buff' ? styles.isBuff : styles.isDebuff}`}
                >
                  <span className={styles.activeBuffIcon}>{buff.icon}</span>
                  <div className={styles.activeBuffInfo}>
                    <div className={styles.activeBuffName}>{buff.name}</div>
                    <div className={styles.activeBuffTimer}>{getRemainingTime(buff.expires_at)} remaining</div>
                    {effectStr && <div className={styles.activeBuffEffects}>{effectStr}</div>}
                  </div>
                  <RPGButton size="small" variant="danger" onClick={() => onDeactivateBuff(buff.id)}>
                    Remove
                  </RPGButton>
                </div>
              );
            })}
          </div>
        </RPGPanel>
      )}

      <div className={styles.buffGrid}>
        {/* Buffs */}
        <RPGPanel header="Buffs (Positive Habits)">
          {buffs.length === 0 ? (
            <div className={styles.emptyState}>No buffs defined yet</div>
          ) : (
            <div className={styles.buffSection}>
              {buffs.map((def) => (
                <BuffDefCard
                  key={def.id}
                  definition={def}
                  onActivate={onActivateBuff}
                  onDelete={onDeleteDefinition}
                />
              ))}
            </div>
          )}
        </RPGPanel>

        {/* Debuffs */}
        <RPGPanel header="Debuffs (Negative Habits)">
          {debuffs.length === 0 ? (
            <div className={styles.emptyState}>No debuffs defined yet</div>
          ) : (
            <div className={styles.buffSection}>
              {debuffs.map((def) => (
                <BuffDefCard
                  key={def.id}
                  definition={def}
                  onActivate={onActivateBuff}
                  onDelete={onDeleteDefinition}
                />
              ))}
            </div>
          )}
        </RPGPanel>
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
            <RPGInput label="Duration (hours)" type="number" value={formDuration} onChange={(e) => setFormDuration(Number(e.target.value))} min={1} max={168} />
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

function BuffDefCard({
  definition,
  onActivate,
  onDelete,
}: {
  definition: BuffDefinition;
  onActivate: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const effects = parseStatEffects(definition.stat_effects);
  const effectStr = Object.entries(effects)
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`)
    .join(', ');

  return (
    <div className={styles.buffCard}>
      <span className={styles.buffCardIcon}>{definition.icon}</span>
      <div className={styles.buffCardInfo}>
        <div className={styles.buffCardName}>{definition.name}</div>
        {definition.description && <div className={styles.buffCardDesc}>{definition.description}</div>}
        <div className={styles.buffCardMeta}>
          <span className={`${styles.buffTypeBadge} ${definition.type === 'buff' ? styles.buffTypeBuff : styles.buffTypeDebuff}`}>
            {definition.type}
          </span>
          {' '}{definition.duration_hours}h
          {effectStr && ` — ${effectStr}`}
        </div>
      </div>
      <div className={styles.buffCardActions}>
        <RPGButton size="small" variant="primary" onClick={() => onActivate(definition.id)}>
          Activate
        </RPGButton>
        <RPGButton size="small" variant="danger" onClick={() => onDelete(definition.id)}>
          Delete
        </RPGButton>
      </div>
    </div>
  );
}
