import styles from '../../styles/components/rpg-checkbox.module.css';

interface RPGCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function RPGCheckbox({ checked, onChange, label, className }: RPGCheckboxProps) {
  const cls = [styles.checkbox, checked && styles.checked, className].filter(Boolean).join(' ');
  return (
    <label className={cls} onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        className={styles.hidden}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.box}>
        {checked && <span className={styles.checkmark}>✓</span>}
      </span>
      {label && <span className={styles.checkboxLabel}>{label}</span>}
    </label>
  );
}
