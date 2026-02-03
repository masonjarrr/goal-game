// Migration: February 2026 Billing Goal
// Creates goal, quests (weekly), and steps (daily) for billing 190 hours

import { getDB, persist } from '../database';

const MIGRATION_KEY = 'migration_feb2026_billing_v1';

export async function runFebruary2026BillingMigration(): Promise<boolean> {
  // Check if already run
  if (localStorage.getItem(MIGRATION_KEY)) {
    return false;
  }

  const db = getDB();

  // Check if goal already exists
  const existing = db.exec("SELECT id FROM goals WHERE title = 'Bill 190 Hours - February 2026'");
  if (existing.length > 0 && existing[0].values.length > 0) {
    localStorage.setItem(MIGRATION_KEY, 'true');
    return false;
  }

  // Create the goal (domain_id 2 = Career)
  db.run(`
    INSERT INTO goals (domain_id, title, description, status)
    VALUES (2, 'Bill 190 Hours - February 2026', 'Target: 8 hours on weekdays, ~4.5 hours on weekends. Started with 8 hours billed.', 'active')
  `);

  const goalResult = db.exec('SELECT last_insert_rowid() as id');
  const goalId = goalResult[0].values[0][0] as number;

  // Weekly quests with daily steps
  const weeks = [
    {
      title: 'Week 1: Feb 3-9',
      description: 'First partial week. Target: ~41 hours (4 weekdays × 8 + 2 weekend days × 4.5)',
      days: [
        { date: '2026-02-03', day: 'Tue', hours: 8, isWeekend: false },
        { date: '2026-02-04', day: 'Wed', hours: 8, isWeekend: false },
        { date: '2026-02-05', day: 'Thu', hours: 8, isWeekend: false },
        { date: '2026-02-06', day: 'Fri', hours: 8, isWeekend: false },
        { date: '2026-02-07', day: 'Sat', hours: 4.5, isWeekend: true },
        { date: '2026-02-08', day: 'Sun', hours: 4.5, isWeekend: true },
      ]
    },
    {
      title: 'Week 2: Feb 9-15',
      description: 'Full week. Target: ~49 hours (5 weekdays × 8 + 2 weekend days × 4.5)',
      days: [
        { date: '2026-02-09', day: 'Mon', hours: 8, isWeekend: false },
        { date: '2026-02-10', day: 'Tue', hours: 8, isWeekend: false },
        { date: '2026-02-11', day: 'Wed', hours: 8, isWeekend: false },
        { date: '2026-02-12', day: 'Thu', hours: 8, isWeekend: false },
        { date: '2026-02-13', day: 'Fri', hours: 8, isWeekend: false },
        { date: '2026-02-14', day: 'Sat', hours: 4.5, isWeekend: true },
        { date: '2026-02-15', day: 'Sun', hours: 4.5, isWeekend: true },
      ]
    },
    {
      title: 'Week 3: Feb 16-22',
      description: 'Full week. Target: ~49 hours (5 weekdays × 8 + 2 weekend days × 4.5)',
      days: [
        { date: '2026-02-16', day: 'Mon', hours: 8, isWeekend: false },
        { date: '2026-02-17', day: 'Tue', hours: 8, isWeekend: false },
        { date: '2026-02-18', day: 'Wed', hours: 8, isWeekend: false },
        { date: '2026-02-19', day: 'Thu', hours: 8, isWeekend: false },
        { date: '2026-02-20', day: 'Fri', hours: 8, isWeekend: false },
        { date: '2026-02-21', day: 'Sat', hours: 4.5, isWeekend: true },
        { date: '2026-02-22', day: 'Sun', hours: 4.5, isWeekend: true },
      ]
    },
    {
      title: 'Week 4: Feb 23-28',
      description: 'Final partial week. Target: ~44.5 hours (5 weekdays × 8 + 1 weekend day × 4.5)',
      days: [
        { date: '2026-02-23', day: 'Mon', hours: 8, isWeekend: false },
        { date: '2026-02-24', day: 'Tue', hours: 8, isWeekend: false },
        { date: '2026-02-25', day: 'Wed', hours: 8, isWeekend: false },
        { date: '2026-02-26', day: 'Thu', hours: 8, isWeekend: false },
        { date: '2026-02-27', day: 'Fri', hours: 8, isWeekend: false },
        { date: '2026-02-28', day: 'Sat', hours: 4.5, isWeekend: true },
      ]
    },
  ];

  for (const week of weeks) {
    // Create quest for the week
    db.run(`
      INSERT INTO quests (goal_id, title, description, priority, status)
      VALUES (?, ?, ?, 'high', 'active')
    `, [goalId, week.title, week.description]);

    const questResult = db.exec('SELECT last_insert_rowid() as id');
    const questId = questResult[0].values[0][0] as number;

    // Create steps for each day
    for (let i = 0; i < week.days.length; i++) {
      const day = week.days[i];
      const title = `${day.day} ${day.date.slice(5)}: Bill ${day.hours} hours`;

      db.run(`
        INSERT INTO steps (quest_id, title, priority, status, sort_order)
        VALUES (?, ?, ?, 'pending', ?)
      `, [questId, title, day.isWeekend ? 'low' : 'normal', i]);
    }
  }

  await persist();
  localStorage.setItem(MIGRATION_KEY, 'true');

  return true;
}
