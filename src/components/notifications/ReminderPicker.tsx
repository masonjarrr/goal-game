import { ReminderOption, REMINDER_OPTIONS } from '../../types/notification';
import styles from '../../styles/components/notifications.module.css';

interface ReminderPickerProps {
  value: ReminderOption;
  onChange: (value: ReminderOption) => void;
  disabled?: boolean;
}

export function ReminderPicker({ value, onChange, disabled }: ReminderPickerProps) {
  return (
    <div className={styles.reminderPicker}>
      <label className={styles.reminderLabel}>Reminder</label>
      <select
        className={styles.reminderSelect}
        value={value === null ? 'null' : value.toString()}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === 'null' ? null : Number(val) as ReminderOption);
        }}
        disabled={disabled}
      >
        {REMINDER_OPTIONS.map((option) => (
          <option key={option.value === null ? 'null' : option.value} value={option.value === null ? 'null' : option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
