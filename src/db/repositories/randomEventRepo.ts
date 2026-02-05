import { getDB, persist } from '../database';
import { EventTemplate, ActiveEvent, EventHistory, ActiveEventWithTemplate } from '../../types/randomEvent';
import type { SqlValue } from 'sql.js';

export function getEventTemplates(): EventTemplate[] {
  const db = getDB();
  const result = db.exec(`
    SELECT id, name, description, type, icon, duration_hours, effect_type, effect_value, rarity, weight
    FROM event_templates ORDER BY rarity, name
  `);
  if (!result.length) return [];
  return result[0].values.map(mapTemplateRow);
}

export function getTemplateById(id: number): EventTemplate | null {
  const db = getDB();
  const result = db.exec(`
    SELECT id, name, description, type, icon, duration_hours, effect_type, effect_value, rarity, weight
    FROM event_templates WHERE id = ?
  `, [id]);
  if (!result.length || !result[0].values.length) return null;
  return mapTemplateRow(result[0].values[0]);
}

export function getActiveEvents(): ActiveEventWithTemplate[] {
  const db = getDB();
  const result = db.exec(`
    SELECT ae.id, ae.template_id, ae.started_at, ae.expires_at, ae.is_claimed, ae.claimed_at,
           et.id, et.name, et.description, et.type, et.icon, et.duration_hours, et.effect_type, et.effect_value, et.rarity, et.weight
    FROM active_events ae
    JOIN event_templates et ON ae.template_id = et.id
    WHERE ae.expires_at > datetime('now') OR (ae.is_claimed = 0 AND et.duration_hours = 0)
    ORDER BY ae.started_at DESC
  `);
  if (!result.length) return [];

  const now = Date.now();
  return result[0].values.map((row: SqlValue[]) => {
    const expiresAt = new Date(row[3] as string + 'Z').getTime();
    return {
      id: row[0] as number,
      template_id: row[1] as number,
      started_at: row[2] as string,
      expires_at: row[3] as string,
      is_claimed: Boolean(row[4]),
      claimed_at: row[5] as string | null,
      template: {
        id: row[6] as number,
        name: row[7] as string,
        description: row[8] as string,
        type: row[9] as EventTemplate['type'],
        icon: row[10] as string,
        duration_hours: row[11] as number,
        effect_type: row[12] as string,
        effect_value: row[13] as string,
        rarity: row[14] as EventTemplate['rarity'],
        weight: row[15] as number,
      },
      time_remaining: Math.max(0, Math.floor((expiresAt - now) / 1000)),
    };
  });
}

export function getUnclaimedEvents(): ActiveEventWithTemplate[] {
  return getActiveEvents().filter((e) => !e.is_claimed);
}

export async function triggerRandomEvent(): Promise<ActiveEventWithTemplate | null> {
  const db = getDB();
  const templates = getEventTemplates();
  if (templates.length === 0) return null;

  // Weighted random selection
  const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.random() * totalWeight;

  let selected: EventTemplate | null = null;
  for (const template of templates) {
    random -= template.weight;
    if (random <= 0) {
      selected = template;
      break;
    }
  }

  if (!selected) selected = templates[0];

  // Calculate expiry
  const expiresAt = selected.duration_hours > 0
    ? `datetime('now', '+${selected.duration_hours} hours')`
    : `datetime('now', '+24 hours')`; // Instant rewards expire after 24h if not claimed

  db.run(
    `INSERT INTO active_events (template_id, expires_at) VALUES (?, ${expiresAt})`,
    [selected.id]
  );

  await persist();

  const events = getActiveEvents();
  return events.find((e) => e.template_id === selected!.id) || null;
}

export async function claimEvent(eventId: number): Promise<{ success: boolean; effectValue: Record<string, any> }> {
  const db = getDB();
  const events = getActiveEvents();
  const event = events.find((e) => e.id === eventId);

  if (!event || event.is_claimed) {
    return { success: false, effectValue: {} };
  }

  db.run(
    `UPDATE active_events SET is_claimed = 1, claimed_at = datetime('now') WHERE id = ?`,
    [eventId]
  );

  // Log to history
  db.run(
    `INSERT INTO event_history (template_id, event_name, result, xp_earned)
     VALUES (?, ?, 'claimed', 0)`,
    [event.template_id, event.template.name]
  );

  await persist();

  try {
    return { success: true, effectValue: JSON.parse(event.template.effect_value) };
  } catch {
    return { success: true, effectValue: {} };
  }
}

export async function expireOldEvents(): Promise<void> {
  const db = getDB();
  // Mark expired unclaimed events
  db.run(`
    DELETE FROM active_events
    WHERE expires_at <= datetime('now') AND is_claimed = 0
  `);
  await persist();
}

export function getEventHistory(limit: number = 20): EventHistory[] {
  const db = getDB();
  const result = db.exec(`
    SELECT id, template_id, event_name, started_at, result, xp_earned
    FROM event_history ORDER BY started_at DESC LIMIT ?
  `, [limit]);
  if (!result.length) return [];
  return result[0].values.map((row: SqlValue[]) => ({
    id: row[0] as number,
    template_id: row[1] as number,
    event_name: row[2] as string,
    started_at: row[3] as string,
    result: row[4] as string,
    xp_earned: row[5] as number,
  }));
}

function mapTemplateRow(row: SqlValue[]): EventTemplate {
  return {
    id: row[0] as number,
    name: row[1] as string,
    description: row[2] as string,
    type: row[3] as EventTemplate['type'],
    icon: row[4] as string,
    duration_hours: row[5] as number,
    effect_type: row[6] as string,
    effect_value: row[7] as string,
    rarity: row[8] as EventTemplate['rarity'],
    weight: row[9] as number,
  };
}
