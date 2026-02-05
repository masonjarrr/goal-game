import { useState, useEffect } from 'react';
import { getDatabase } from '../db/database';
import { runFebruary2026BillingMigration } from '../db/migrations/february2026Billing';
import { runNotificationsMigration } from '../db/migrations/notificationsMigration';
import { seedBodyFatGoal } from '../db/migrations/bodyFatGoalSeed';
import { runDailyQuestsMigration } from '../db/migrations/dailyQuestsMigration';
import { runStreakMigration } from '../db/migrations/streakMigration';
import { runWeeklyBossMigration } from '../db/migrations/weeklyBossMigration';
import { runAchievementMigration } from '../db/migrations/achievementMigration';
import { runEnergyMigration } from '../db/migrations/energyMigration';
import { runFocusTimerMigration } from '../db/migrations/focusTimerMigration';
import { runRoutineMigration } from '../db/migrations/routineMigration';
import { runComboMigration } from '../db/migrations/comboMigration';
import { runWeeklyReviewMigration } from '../db/migrations/weeklyReviewMigration';
import { runRandomEventMigration } from '../db/migrations/randomEventMigration';
import { runSkillTreeMigration } from '../db/migrations/skillTreeMigration';
import { runCharacterClassMigration } from '../db/migrations/characterClassMigration';
import { runTerritoryMigration } from '../db/migrations/territoryMigration';
import { runInventoryMigration } from '../db/migrations/inventoryMigration';

export function useDatabase() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDatabase()
      .then(async () => {
        // Run migrations (order matters for dependencies)
        await runFebruary2026BillingMigration();
        await runNotificationsMigration();
        await seedBodyFatGoal();
        await runDailyQuestsMigration();
        await runStreakMigration();
        await runWeeklyBossMigration();
        // New feature migrations
        await runAchievementMigration();
        await runEnergyMigration();
        await runFocusTimerMigration();
        await runRoutineMigration();
        await runComboMigration();
        await runWeeklyReviewMigration();
        await runRandomEventMigration();
        await runSkillTreeMigration();
        await runCharacterClassMigration();
        await runTerritoryMigration();
        await runInventoryMigration();
        setReady(true);
      })
      .catch((err) => setError(err.message));
  }, []);

  return { ready, error };
}
