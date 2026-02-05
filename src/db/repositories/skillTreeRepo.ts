import { getDB, persist } from '../database';
import { SkillBranch, SkillNode, UnlockedSkill, SkillNodeWithStatus } from '../../types/skillTree';
import type { SqlValue } from 'sql.js';

export function getSkillBranches(): SkillBranch[] {
  const db = getDB();
  const result = db.exec(`SELECT id, name, description, icon, color, sort_order FROM skill_branches ORDER BY sort_order`);
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    name: row[1] as string,
    description: row[2] as string,
    icon: row[3] as string,
    color: row[4] as string,
    sort_order: row[5] as number,
  }));
}

export function getSkillNodes(branchId?: number): SkillNode[] {
  const db = getDB();
  let sql = `SELECT id, branch_id, name, description, icon, tier, position, xp_cost, prerequisite_node_id, effect_type, effect_value, is_capstone FROM skill_nodes`;
  const params: number[] = [];
  if (branchId) {
    sql += ' WHERE branch_id = ?';
    params.push(branchId);
  }
  sql += ' ORDER BY tier, position';
  const result = db.exec(sql, params);
  if (!result.length) return [];
  return result[0].values.map(mapNodeRow);
}

export function getUnlockedSkills(): UnlockedSkill[] {
  const db = getDB();
  const result = db.exec(`SELECT id, node_id, unlocked_at FROM unlocked_skills`);
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    node_id: row[1] as number,
    unlocked_at: row[2] as string,
  }));
}

export function getSkillNodesWithStatus(): SkillNodeWithStatus[] {
  const db = getDB();
  const result = db.exec(`
    SELECT sn.id, sn.branch_id, sn.name, sn.description, sn.icon, sn.tier, sn.position, sn.xp_cost,
           sn.prerequisite_node_id, sn.effect_type, sn.effect_value, sn.is_capstone,
           us.unlocked_at, sb.name as branch_name, sb.color as branch_color
    FROM skill_nodes sn
    LEFT JOIN unlocked_skills us ON sn.id = us.node_id
    JOIN skill_branches sb ON sn.branch_id = sb.id
    ORDER BY sb.sort_order, sn.tier, sn.position
  `);
  if (!result.length) return [];

  const unlockedIds = new Set(getUnlockedSkills().map((u) => u.node_id));

  return result[0].values.map((row: SqlValue[]) => {
    const nodeId = row[0] as number;
    const prerequisiteId = row[8] as number | null;
    const unlocked = row[12] !== null;
    const canUnlock = !unlocked && (prerequisiteId === null || unlockedIds.has(prerequisiteId));

    return {
      id: nodeId,
      branch_id: row[1] as number,
      name: row[2] as string,
      description: row[3] as string,
      icon: row[4] as string,
      tier: row[5] as number,
      position: row[6] as number,
      xp_cost: row[7] as number,
      prerequisite_node_id: prerequisiteId,
      effect_type: row[9] as string,
      effect_value: row[10] as string,
      is_capstone: Boolean(row[11]),
      unlocked,
      unlocked_at: row[12] as string | null,
      can_unlock: canUnlock,
      branch_name: row[13] as string,
      branch_color: row[14] as string,
    };
  });
}

export async function unlockSkill(nodeId: number): Promise<boolean> {
  const db = getDB();
  const existing = db.exec(`SELECT 1 FROM unlocked_skills WHERE node_id = ?`, [nodeId]);
  if (existing.length && existing[0].values.length) return false;

  db.run(`INSERT INTO unlocked_skills (node_id) VALUES (?)`, [nodeId]);
  await persist();
  return true;
}

export function getSkillStatBonuses(): Record<string, number> {
  const db = getDB();
  const result = db.exec(`
    SELECT sn.effect_value FROM skill_nodes sn
    JOIN unlocked_skills us ON sn.id = us.node_id
    WHERE sn.effect_type IN ('stat_bonus', 'combined')
  `);
  if (!result.length) return {};

  const bonuses: Record<string, number> = {};
  for (const row of result[0].values) {
    try {
      const effects = JSON.parse(row[0] as string);
      for (const [stat, value] of Object.entries(effects)) {
        if (typeof value === 'number' && !stat.includes('_bonus')) {
          bonuses[stat] = (bonuses[stat] || 0) + value;
        }
      }
    } catch { /* ignore parse errors */ }
  }
  return bonuses;
}

export function getTotalXpSpentOnSkills(): number {
  const db = getDB();
  const result = db.exec(`
    SELECT COALESCE(SUM(sn.xp_cost), 0) FROM skill_nodes sn
    JOIN unlocked_skills us ON sn.id = us.node_id
  `);
  return result.length ? (result[0].values[0][0] as number) : 0;
}

function mapNodeRow(row: SqlValue[]): SkillNode {
  return {
    id: row[0] as number,
    branch_id: row[1] as number,
    name: row[2] as string,
    description: row[3] as string,
    icon: row[4] as string,
    tier: row[5] as number,
    position: row[6] as number,
    xp_cost: row[7] as number,
    prerequisite_node_id: row[8] as number | null,
    effect_type: row[9] as string,
    effect_value: row[10] as string,
    is_capstone: Boolean(row[11]),
  };
}
