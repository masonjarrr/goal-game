import { useNotifications } from '../../hooks/useNotifications';
import { REMINDER_OPTIONS } from '../../types/notification';
import { RPGPanel } from '../ui/RPGPanel';
import { RPGButton } from '../ui/RPGButton';
import styles from '../../styles/components/notifications.module.css';

export function NotificationSettings() {
  const {
    settings,
    permissionState,
    isSupported,
    isConfigured,
    canEnable,
    isIOS,
    isStandalone,
    loading,
    error,
    enableNotifications,
    disableNotificationsHandler,
    setDefaultReminderMinutes,
  } = useNotifications();

  if (!isConfigured) {
    return (
      <RPGPanel className={styles.settingsPanel}>
        <h3 className={styles.settingsTitle}>Push Notifications</h3>
        <p className={styles.settingsDescription}>
          Push notifications are not configured. To enable them, add your Firebase
          configuration to the .env file.
        </p>
      </RPGPanel>
    );
  }

  if (!isSupported) {
    return (
      <RPGPanel className={styles.settingsPanel}>
        <h3 className={styles.settingsTitle}>Push Notifications</h3>
        <p className={styles.settingsDescription}>
          Push notifications are not supported in this browser.
        </p>
      </RPGPanel>
    );
  }

  return (
    <RPGPanel className={styles.settingsPanel}>
      <h3 className={styles.settingsTitle}>Push Notifications</h3>

      {/* iOS Instructions */}
      {isIOS && !isStandalone && (
        <div className={styles.iosInstructions}>
          <p className={styles.iosTitle}>iOS Setup Required</p>
          <p className={styles.iosText}>
            To receive push notifications on iOS, you need to add this app to your home screen first:
          </p>
          <ol className={styles.iosList}>
            <li>Tap the Share button in Safari</li>
            <li>Select "Add to Home Screen"</li>
            <li>Open the app from your home screen</li>
            <li>Then enable notifications here</li>
          </ol>
        </div>
      )}

      {/* Permission denied message */}
      {permissionState === 'denied' && (
        <div className={styles.deniedMessage}>
          <p>Notifications are blocked. Please enable them in your browser settings.</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}

      {/* Enable/Disable toggle */}
      <div className={styles.settingRow}>
        <span className={styles.settingLabel}>Event Reminders</span>
        {settings.enabled ? (
          <RPGButton
            variant="danger"
            size="small"
            onClick={disableNotificationsHandler}
            disabled={loading}
          >
            {loading ? 'Disabling...' : 'Disable'}
          </RPGButton>
        ) : (
          <RPGButton
            variant="primary"
            size="small"
            onClick={enableNotifications}
            disabled={loading || !canEnable || permissionState === 'denied'}
          >
            {loading ? 'Enabling...' : 'Enable'}
          </RPGButton>
        )}
      </div>

      {/* Default reminder time selector */}
      {settings.enabled && (
        <div className={styles.settingRow}>
          <span className={styles.settingLabel}>Default Reminder</span>
          <select
            className={styles.reminderSelect}
            value={settings.defaultReminderMinutes}
            onChange={(e) => setDefaultReminderMinutes(Number(e.target.value))}
          >
            {REMINDER_OPTIONS.filter((opt) => opt.value !== null).map((option) => (
              <option key={option.value} value={option.value!}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status indicator */}
      {settings.enabled && (
        <div className={styles.statusIndicator}>
          <span className={styles.statusDot} />
          Notifications enabled
        </div>
      )}

      {/* Debug info */}
      {settings.enabled && (
        <div className={styles.debugInfo}>
          <p className={styles.debugLabel}>Token Status:</p>
          {settings.fcmToken ? (
            <p className={styles.debugToken}>
              {settings.fcmToken.substring(0, 20)}...{settings.fcmToken.substring(settings.fcmToken.length - 10)}
            </p>
          ) : (
            <p className={styles.debugError}>No token - notifications will not work!</p>
          )}
          <p className={styles.debugLabel}>Device ID: {settings.deviceId.substring(0, 8)}...</p>
        </div>
      )}

      {/* Show if enabled but no token */}
      {settings.enabled && !settings.fcmToken && (
        <div className={styles.errorMessage}>
          <p>Token missing! Try: Disable → Wait 5 sec → Re-enable</p>
        </div>
      )}
    </RPGPanel>
  );
}
