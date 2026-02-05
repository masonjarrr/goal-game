import { getDB, persist } from '../database';

const MIGRATION_KEY = 'body_fat_steps_fix_v1';

export async function fixBodyFatStepTitles(): Promise<void> {
  // Check if already run
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Find the goal
    const goalResult = db.exec(`SELECT id FROM goals WHERE title = 'Achieve 12% Body Fat'`);
    if (!goalResult.length || !goalResult[0].values.length) {
      console.log('Body fat goal not found, skipping step title fix');
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    const goalId = goalResult[0].values[0][0] as number;

    // Get all quests for this goal
    const questsResult = db.exec(`SELECT id FROM quests WHERE goal_id = ?`, [goalId]);
    if (!questsResult.length) {
      console.log('No quests found for body fat goal');
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    let updatedCount = 0;

    for (const questRow of questsResult[0].values) {
      const questId = questRow[0] as number;

      // Get all steps for this quest
      const stepsResult = db.exec(`SELECT id, title FROM steps WHERE quest_id = ? ORDER BY sort_order`, [questId]);
      if (!stepsResult.length) continue;

      for (const stepRow of stepsResult[0].values) {
        const stepId = stepRow[0] as number;
        const title = stepRow[1] as string;

        // Determine new title based on current content
        let newTitle: string;
        if (title.toLowerCase().includes('protein')) {
          newTitle = 'hit 150g of protein';
        } else {
          newTitle = 'worked out';
        }

        db.run('UPDATE steps SET title = ? WHERE id = ?', [newTitle, stepId]);
        updatedCount++;
      }
    }

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log(`Fixed ${updatedCount} step titles in body fat goal`);
  } catch (error) {
    console.error('Failed to fix body fat step titles:', error);
    throw error;
  }
}
