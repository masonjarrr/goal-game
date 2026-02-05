import { ComboWithStatus } from '../../types/combo';
import { RPGPanel } from '../ui/RPGPanel';
import { RPGButton } from '../ui/RPGButton';
import styles from '../../styles/components/combos.module.css';

interface ComboDisplayProps {
  combos: ComboWithStatus[];
  loading?: boolean;
  onClaimCombo: (comboId: number) => void;
  compact?: boolean;
}

export function ComboDisplay({ combos, loading, onClaimCombo, compact = false }: ComboDisplayProps) {
  const readyCombos = combos.filter((c) => c.is_ready);
  const inProgressCombos = combos.filter((c) => c.progress > 0 && !c.is_ready);
  const notStartedCombos = combos.filter((c) => c.progress === 0);

  if (loading) {
    return (
      <RPGPanel header="Habit Combos">
        <div className={styles.emptyState}>Loading combos...</div>
      </RPGPanel>
    );
  }

  if (combos.length === 0) {
    return (
      <RPGPanel header="Habit Combos">
        <div className={styles.emptyState}>
          No combos available. Create buff definitions to unlock combos!
        </div>
      </RPGPanel>
    );
  }

  return (
    <div className={styles.comboPanel}>
      {readyCombos.length > 0 && (
        <RPGPanel header="Ready to Claim!" glow>
          <div className={styles.comboGrid}>
            {readyCombos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} onClaim={() => onClaimCombo(combo.id)} />
            ))}
          </div>
        </RPGPanel>
      )}

      {inProgressCombos.length > 0 && (
        <RPGPanel header="In Progress">
          <div className={styles.comboGrid}>
            {inProgressCombos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        </RPGPanel>
      )}

      {notStartedCombos.length > 0 && (
        <RPGPanel header="Available Combos">
          <div className={styles.comboGrid}>
            {notStartedCombos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        </RPGPanel>
      )}
    </div>
  );
}

function ComboCard({ combo, onClaim }: { combo: ComboWithStatus; onClaim?: () => void }) {
  const requiredIds: number[] = JSON.parse(combo.required_buffs);

  return (
    <div className={`${styles.comboCard} ${combo.is_ready ? styles.ready : combo.progress > 0 ? styles.inProgress : ''}`}>
      <div className={styles.comboHeader}>
        <span className={styles.comboIcon}>{combo.icon}</span>
        <div className={styles.comboInfo}>
          <div className={styles.comboName}>{combo.name}</div>
          <div className={styles.comboXp}>+{combo.bonus_xp} XP</div>
        </div>
      </div>

      <div className={styles.comboDesc}>{combo.description}</div>

      <div className={styles.comboBuffs}>
        {combo.required_buff_names.map((name, index) => {
          const buffId = requiredIds[index];
          const isActive = combo.active_buff_ids.includes(buffId);
          return (
            <div key={index} className={`${styles.comboBuff} ${isActive ? styles.active : styles.missing}`}>
              <span className={styles.buffCheck}>{isActive ? '✓' : '○'}</span>
              {name}
            </div>
          );
        })}
      </div>

      <div className={styles.comboProgress}>
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${combo.progress === 100 ? styles.complete : ''}`}
            style={{ width: `${combo.progress}%` }}
          />
        </div>
        <span className={styles.progressText}>{combo.progress}%</span>
      </div>

      {combo.is_ready && onClaim && (
        <div className={styles.comboActions}>
          <RPGButton variant="primary" onClick={onClaim} style={{ width: '100%' }}>
            Claim Combo!
          </RPGButton>
        </div>
      )}

      {combo.last_activated && !combo.is_ready && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center' }}>
          Last claimed: {new Date(combo.last_activated + 'Z').toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

// Toast notification for combo activation
interface ComboToastProps {
  combo: ComboWithStatus;
  onDismiss: () => void;
}

export function ComboToast({ combo, onDismiss }: ComboToastProps) {
  return (
    <div className={styles.comboToast} onClick={onDismiss}>
      <span className={styles.toastIcon}>{combo.icon}</span>
      <div className={styles.toastContent}>
        <div className={styles.toastTitle}>Combo Activated: {combo.name}</div>
        <div className={styles.toastXp}>+{combo.bonus_xp} XP</div>
      </div>
    </div>
  );
}
