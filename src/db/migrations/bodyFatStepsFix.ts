import { getDB, persist } from '../database';

const MIGRATION_KEY = 'body_fat_steps_fix_v2';

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

    // Get all quests for this goal ordered by creation
    const questsResult = db.exec(`SELECT id FROM quests WHERE goal_id = ? ORDER BY id`, [goalId]);
    if (!questsResult.length) {
      console.log('No quests found for body fat goal');
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    // Start date: Wednesday, February 4, 2026
    const startDate = new Date(2026, 1, 4, 12, 0, 0);
    let currentDate = new Date(startDate);

    const formatDate = (date: Date): string => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}/${day}`;
    };

    let updatedCount = 0;

    for (let weekNum = 0; weekNum < questsResult[0].values.length; weekNum++) {
      const questId = questsResult[0].values[weekNum][0] as number;

      // Get all steps for this quest ordered by sort_order
      const stepsResult = db.exec(`SELECT id, title, sort_order FROM steps WHERE quest_id = ? ORDER BY sort_order`, [questId]);
      if (!stepsResult.length) continue;

      // Steps come in pairs: workout then protein for each day
      for (let i = 0; i < stepsResult[0].values.length; i++) {
        const stepId = stepsResult[0].values[i][0] as number;
        const title = stepsResult[0].values[i][1] as string;
        const sortOrder = stepsResult[0].values[i][2] as number;

        // Calculate which day this step belongs to (0-6)
        const dayIndex = Math.floor((sortOrder - 1) / 2);
        const stepDate = new Date(currentDate);
        stepDate.setDate(startDate.getDate() + (weekNum * 7) + dayIndex);

        const dateStr = formatDate(stepDate);

        // Determine new title based on current content
        let newTitle: string;
        if (title.toLowerCase().includes('protein') || sortOrder % 2 === 0) {
          newTitle = `${dateStr}: hit 150g of protein`;
        } else {
          newTitle = `${dateStr}: worked out`;
        }

        db.run('UPDATE steps SET title = ? WHERE id = ?', [newTitle, stepId]);
        updatedCount++;
      }
    }

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log(`Fixed ${updatedCount} step titles in body fat goal with dates`);
  } catch (error) {
    console.error('Failed to fix body fat step titles:', error);
    throw error;
  }
}
