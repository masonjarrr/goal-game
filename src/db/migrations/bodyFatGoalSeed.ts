import { getDB, persist } from '../database';

const MIGRATION_KEY = 'body_fat_goal_seed_v4';

export async function seedBodyFatGoal(): Promise<void> {
  // Check if already seeded
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const db = getDB();

  try {
    // Delete old version if exists
    const oldGoal = db.exec(`SELECT id FROM goals WHERE title = 'Achieve 12% Body Fat'`);
    if (oldGoal.length && oldGoal[0].values.length) {
      const oldGoalId = oldGoal[0].values[0][0] as number;
      const oldQuests = db.exec(`SELECT id FROM quests WHERE goal_id = ?`, [oldGoalId]);
      if (oldQuests.length) {
        for (const row of oldQuests[0].values) {
          db.run('DELETE FROM steps WHERE quest_id = ?', [row[0]]);
        }
      }
      db.run('DELETE FROM quests WHERE goal_id = ?', [oldGoalId]);
      db.run('DELETE FROM goals WHERE id = ?', [oldGoalId]);
    }

    // Create the goal (Health domain = id 1)
    db.run(
      `INSERT INTO goals (domain_id, title, description) VALUES (?, ?, ?)`,
      [1, 'Achieve 12% Body Fat', '12-week transformation program starting Feb 4, 2026. From 18-19% to 12% body fat through consistent training and nutrition.']
    );
    const goalResult = db.exec('SELECT last_insert_rowid()');
    const goalId = goalResult[0].values[0][0] as number;

    // Start date: Wednesday, February 4, 2026
    // Use noon to avoid timezone issues
    const startDate = new Date(2026, 1, 4, 12, 0, 0); // Month is 0-indexed, so 1 = February

    // Weekly quest data
    const weeks = [
      { title: 'Week 1 - Build Foundation', desc: 'Establish daily habits and set your baseline.' },
      { title: 'Week 2 - Gain Momentum', desc: 'Lock in the routine. Consistency is key.' },
      { title: 'Week 3 - Stay Disciplined', desc: 'Push through early challenges. Trust the process.' },
      { title: 'Week 4 - Complete Month 1', desc: 'First month done! Take measurements and assess progress.' },
      { title: 'Week 5 - Intensify', desc: 'Increase intensity. Your body is adapting.' },
      { title: 'Week 6 - Push Through', desc: 'Mental toughness week. No excuses.' },
      { title: 'Week 7 - Halfway Point', desc: 'You\'re halfway there! Stay focused.' },
      { title: 'Week 8 - Stay Strong', desc: 'Month 2 complete. Reassess and adjust if needed.' },
      { title: 'Week 9 - Final Month Begins', desc: 'Last 4 weeks. Time to lock in.' },
      { title: 'Week 10 - Home Stretch', desc: 'You can see the finish line. Don\'t let up.' },
      { title: 'Week 11 - Almost There', desc: 'One more week after this. Give it everything.' },
      { title: 'Week 12 - Finish Strong', desc: 'Final week! Complete the transformation.' },
    ];

    // Daily template starting from Wednesday
    // Wed -> Tue schedule
    const dailyTemplate = [
      { dayName: 'Wed', workout: 'Light Cardio (20-30 min)', isGym: false },
      { dayName: 'Thu', workout: 'Gym - Legs (Quads/Hams/Glutes)', isGym: true },
      { dayName: 'Fri', workout: 'Gym - Upper Body', isGym: true },
      { dayName: 'Sat', workout: 'Gym - Lower Body / Deadlifts', isGym: true },
      { dayName: 'Sun', workout: 'Rest + Weekly Check-in', isGym: false },
      { dayName: 'Mon', workout: 'Gym - Push (Chest/Shoulders/Triceps)', isGym: true },
      { dayName: 'Tue', workout: 'Gym - Pull (Back/Biceps)', isGym: true },
    ];

    const formatDate = (date: Date): string => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}/${day}`;
    };

    let currentDate = new Date(startDate);

    for (let weekNum = 0; weekNum < weeks.length; weekNum++) {
      const week = weeks[weekNum];
      const weekStartDate = formatDate(currentDate);
      const weekEndDate = formatDate(new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000));

      // Create quest for this week
      db.run(
        `INSERT INTO quests (goal_id, title, description, priority) VALUES (?, ?, ?, ?)`,
        [goalId, `${week.title} (${weekStartDate} - ${weekEndDate})`, week.desc, 'high']
      );
      const questResult = db.exec('SELECT last_insert_rowid()');
      const questId = questResult[0].values[0][0] as number;

      // Create daily steps
      let sortOrder = 1;
      for (let dayNum = 0; dayNum < 7; dayNum++) {
        const template = dailyTemplate[dayNum];
        const dateStr = formatDate(currentDate);

        // Workout/Cardio/Rest step
        db.run(
          `INSERT INTO steps (quest_id, title, priority, sort_order) VALUES (?, ?, ?, ?)`,
          [questId, `${template.dayName} ${dateStr}: ${template.workout}`, 'normal', sortOrder++]
        );

        // Protein intake step (every day)
        db.run(
          `INSERT INTO steps (quest_id, title, priority, sort_order) VALUES (?, ?, ?, ?)`,
          [questId, `${template.dayName} ${dateStr}: Hit protein goal`, 'normal', sortOrder++]
        );

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    await persist();
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Body fat goal seeded successfully (v3 - starting Wed 2/4/2026)');
  } catch (error) {
    console.error('Failed to seed body fat goal:', error);
    throw error;
  }
}
