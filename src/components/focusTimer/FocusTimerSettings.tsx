import { FocusSettings } from '../../types/focusTimer';
import { RPGPanel } from '../ui/RPGPanel';
import styles from '../../styles/components/focus-timer.module.css';

interface FocusTimerSettingsProps {
  settings: FocusSettings;
  onUpdateSettings: (settings: Partial<Omit<FocusSettings, 'id'>>) => void;
}

export function FocusTimerSettings({ settings, onUpdateSettings }: FocusTimerSettingsProps) {
  return (
    <RPGPanel header="Timer Settings">
      <div className={styles.settingsGrid}>
        <div className={styles.settingItem}>
          <label className={styles.settingLabel}>Work Duration (min)</label>
          <input
            type="number"
            className={styles.settingInput}
            value={settings.work_duration}
            onChange={(e) => onUpdateSettings({ work_duration: Number(e.target.value) })}
            min={1}
            max={120}
          />
        </div>
        <div className={styles.settingItem}>
          <label className={styles.settingLabel}>Short Break (min)</label>
          <input
            type="number"
            className={styles.settingInput}
            value={settings.short_break}
            onChange={(e) => onUpdateSettings({ short_break: Number(e.target.value) })}
            min={1}
            max={30}
          />
        </div>
        <div className={styles.settingItem}>
          <label className={styles.settingLabel}>Long Break (min)</label>
          <input
            type="number"
            className={styles.settingInput}
            value={settings.long_break}
            onChange={(e) => onUpdateSettings({ long_break: Number(e.target.value) })}
            min={1}
            max={60}
          />
        </div>
        <div className={styles.settingItem}>
          <label className={styles.settingLabel}>Sessions Before Long Break</label>
          <input
            type="number"
            className={styles.settingInput}
            value={settings.sessions_before_long_break}
            onChange={(e) => onUpdateSettings({ sessions_before_long_break: Number(e.target.value) })}
            min={1}
            max={10}
          />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>Auto-start breaks</span>
          <div
            className={`${styles.toggle} ${settings.auto_start_breaks ? styles.active : ''}`}
            onClick={() => onUpdateSettings({ auto_start_breaks: !settings.auto_start_breaks })}
          >
            <div className={styles.toggleKnob} />
          </div>
        </div>
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>Sound notifications</span>
          <div
            className={`${styles.toggle} ${settings.sound_enabled ? styles.active : ''}`}
            onClick={() => onUpdateSettings({ sound_enabled: !settings.sound_enabled })}
          >
            <div className={styles.toggleKnob} />
          </div>
        </div>
      </div>
    </RPGPanel>
  );
}
