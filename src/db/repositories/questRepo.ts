import { getDB, persist } from '../database';
import { Goal, Quest, Step, QuestWithSteps, GoalWithQuests } from '../../types/quest';
import { Domain } from '../../types/common';
import type { SqlValue } from 'sql.js';

export function getDomains(): Domain[] {
  const db = getDB();
  const result = db.exec('SELECT id, name, icon, color FROM domains ORDER BY id');
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    name: row[1] as string,
    icon: row[2] as string,
    color: row[3] as string,
  }));
}

export function getGoals(domainId?: number, status?: string): Goal[] {
  const db = getDB();
  let sql = 'SELECT id, domain_id, title, description, status, created_at, completed_at FROM goals WHERE 1=1';
  const params: (string | number)[] = [];
  if (domainId) { sql += ' AND domain_id = ?'; params.push(domainId); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  const result = db.exec(sql, params);
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    domain_id: row[1] as number,
    title: row[2] as string,
    description: row[3] as string,
    status: row[4] as Goal['status'],
    created_at: row[5] as string,
    completed_at: row[6] as string | null,
  }));
}

export async function createGoal(domainId: number, title: string, description: string = ''): Promise<number> {
  const db = getDB();
  db.run('INSERT INTO goals (domain_id, title, description) VALUES (?, ?, ?)', [domainId, title, description]);
  const result = db.exec('SELECT last_insert_rowid()');
  await persist();
  return result[0].values[0][0] as number;
}

export async function updateGoalStatus(id: number, status: string): Promise<void> {
  const db = getDB();
  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  db.run('UPDATE goals SET status = ?, completed_at = ? WHERE id = ?', [status, completedAt, id]);
  await persist();
}

export function getQuests(goalId?: number, status?: string): Quest[] {
  const db = getDB();
  let sql = 'SELECT id, goal_id, title, description, priority, status, created_at, completed_at FROM quests WHERE 1=1';
  const params: (string | number)[] = [];
  if (goalId) { sql += ' AND goal_id = ?'; params.push(goalId); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  const result = db.exec(sql, params);
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    goal_id: row[1] as number,
    title: row[2] as string,
    description: row[3] as string,
    priority: row[4] as Quest['priority'],
    status: row[5] as Quest['status'],
    created_at: row[6] as string,
    completed_at: row[7] as string | null,
  }));
}

export async function createQuest(goalId: number, title: string, description: string = '', priority: string = 'normal'): Promise<number> {
  const db = getDB();
  db.run('INSERT INTO quests (goal_id, title, description, priority) VALUES (?, ?, ?, ?)', [goalId, title, description, priority]);
  const result = db.exec('SELECT last_insert_rowid()');
  await persist();
  return result[0].values[0][0] as number;
}

export async function updateQuestStatus(id: number, status: string): Promise<void> {
  const db = getDB();
  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  db.run('UPDATE quests SET status = ?, completed_at = ? WHERE id = ?', [status, completedAt, id]);
  await persist();
}

export function getSteps(questId: number): Step[] {
  const db = getDB();
  const result = db.exec(
    'SELECT id, quest_id, title, priority, status, sort_order, completed_at FROM steps WHERE quest_id = ? ORDER BY sort_order, id',
    [questId]
  );
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    quest_id: row[1] as number,
    title: row[2] as string,
    priority: row[3] as Step['priority'],
    status: row[4] as Step['status'],
    sort_order: row[5] as number,
    completed_at: row[6] as string | null,
  }));
}

export async function createStep(questId: number, title: string, priority: string = 'normal'): Promise<number> {
  const db = getDB();
  const maxOrder = db.exec('SELECT COALESCE(MAX(sort_order), 0) FROM steps WHERE quest_id = ?', [questId]);
  const nextOrder = (maxOrder[0].values[0][0] as number) + 1;
  db.run('INSERT INTO steps (quest_id, title, priority, sort_order) VALUES (?, ?, ?, ?)', [questId, title, priority, nextOrder]);
  const result = db.exec('SELECT last_insert_rowid()');
  await persist();
  return result[0].values[0][0] as number;
}

export async function completeStep(id: number): Promise<void> {
  const db = getDB();
  db.run("UPDATE steps SET status = 'completed', completed_at = datetime('now') WHERE id = ?", [id]);
  await persist();
}

export async function uncompleteStep(id: number): Promise<void> {
  const db = getDB();
  db.run("UPDATE steps SET status = 'pending', completed_at = NULL WHERE id = ?", [id]);
  await persist();
}

export async function deleteStep(id: number): Promise<void> {
  const db = getDB();
  db.run('DELETE FROM steps WHERE id = ?', [id]);
  await persist();
}

export async function deleteQuest(id: number): Promise<void> {
  const db = getDB();
  db.run('DELETE FROM steps WHERE quest_id = ?', [id]);
  db.run('DELETE FROM quests WHERE id = ?', [id]);
  await persist();
}

export async function deleteGoal(id: number): Promise<void> {
  const db = getDB();
  const quests = getQuests(id);
  for (const q of quests) {
    db.run('DELETE FROM steps WHERE quest_id = ?', [q.id]);
  }
  db.run('DELETE FROM quests WHERE goal_id = ?', [id]);
  db.run('DELETE FROM goals WHERE id = ?', [id]);
  await persist();
}

export function getQuestWithSteps(questId: number): QuestWithSteps | null {
  const db = getDB();
  const result = db.exec(
    `SELECT q.id, q.goal_id, q.title, q.description, q.priority, q.status, q.created_at, q.completed_at,
            d.name as domain_name, d.icon as domain_icon, d.color as domain_color, g.title as goal_title
     FROM quests q
     JOIN goals g ON q.goal_id = g.id
     JOIN domains d ON g.domain_id = d.id
     WHERE q.id = ?`,
    [questId]
  );
  if (!result.length) return null;
  const row = result[0].values[0];
  return {
    id: row[0] as number,
    goal_id: row[1] as number,
    title: row[2] as string,
    description: row[3] as string,
    priority: row[4] as Quest['priority'],
    status: row[5] as Quest['status'],
    created_at: row[6] as string,
    completed_at: row[7] as string | null,
    domain_name: row[8] as string,
    domain_icon: row[9] as string,
    domain_color: row[10] as string,
    goal_title: row[11] as string,
    steps: getSteps(questId),
  };
}

export function getGoalsWithQuests(domainId?: number, status?: string): GoalWithQuests[] {
  const goals = getGoals(domainId, status);
  const domains = getDomains();
  const domainMap = new Map(domains.map((d) => [d.id, d]));

  return goals.map((goal) => {
    const domain = domainMap.get(goal.domain_id);
    const quests = getQuests(goal.id).map((q) => ({
      ...q,
      steps: getSteps(q.id),
      domain_name: domain?.name,
      domain_icon: domain?.icon,
      domain_color: domain?.color,
      goal_title: goal.title,
    }));
    return {
      ...goal,
      quests,
      domain_name: domain?.name,
      domain_icon: domain?.icon,
      domain_color: domain?.color,
    };
  });
}
