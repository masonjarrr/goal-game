import { useState, useEffect, useRef } from 'react';
import styles from '../../styles/components/guide.module.css';

export function GuideButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={styles.guideButton} onClick={() => setOpen(true)} title="Open Guide">
        ?
      </button>
      {open && <GuideModal onClose={() => setOpen(false)} />}
    </>
  );
}

function GuideModal({ onClose }: { onClose: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const scrollTo = (id: string) => {
    const el = contentRef.current?.querySelector(`#${id}`);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.guideOverlay} onClick={onClose}>
      <div className={styles.guideContainer} onClick={(e) => e.stopPropagation()} ref={contentRef}>
        <div className={styles.guideHeader}>
          <span className={styles.guideTitle}>Adventurer's Guide</span>
          <button className={styles.closeButton} onClick={onClose}>Close</button>
        </div>

        <ul className={styles.tocList}>
          {['overview','character','quests','buffs','planner','xp','levels','stats','tips','data'].map((id) => (
            <li key={id} className={styles.tocItem} onClick={() => scrollTo(`guide-${id}`)}>
              {id === 'xp' ? 'XP System' : id === 'data' ? 'Save Data' : id.charAt(0).toUpperCase() + id.slice(1)}
            </li>
          ))}
        </ul>

        <div className={styles.guideContent}>

          <h2 id="guide-overview">Overview</h2>
          <p>
            Goal Game turns your real-life goals into an RPG adventure. You create <strong>Goals</strong> (big-picture ambitions), break them into <strong>Quests</strong> (projects), and then into <strong>Steps</strong> (individual tasks). Completing steps earns <strong>XP</strong>, which levels up your character.
          </p>
          <p>
            Track daily habits as <strong>Buffs</strong> (positive) and <strong>Debuffs</strong> (negative) that affect your character's stats. Plan your schedule with the <strong>Planner</strong>.
          </p>

          <h2 id="guide-character">Character Screen</h2>
          <p>Your character screen shows your current progress at a glance.</p>
          <h3>What you'll see</h3>
          <ul>
            <li><strong>Name</strong> — Tap "Rename" to change your character's name.</li>
            <li><strong>Level &amp; Title</strong> — Your current level and rank title (e.g., "Novice", "Adept"). Titles change automatically as you level up.</li>
            <li><strong>XP Bar</strong> — Shows progress toward your next level. The numbers show current XP in this level / XP needed for next level.</li>
            <li><strong>Total XP</strong> — Your lifetime XP earned across all activities.</li>
            <li><strong>Stats</strong> — Five attributes (Stamina, Willpower, Health, Focus, Charisma) that start at 10 and change based on your active buffs/debuffs.</li>
            <li><strong>Active Effects</strong> — Currently active buffs (green pulse) and debuffs (red throb) with time remaining.</li>
            <li><strong>XP History</strong> — A log of your most recent XP gains showing what you earned and why.</li>
          </ul>

          <h2 id="guide-quests">Quest Log</h2>
          <p>This is where you organize everything you want to accomplish.</p>

          <h3>Hierarchy</h3>
          <p>Life is organized in three layers:</p>
          <ol>
            <li><strong>Goals</strong> — Big-picture ambitions tied to a life domain. Example: "Get fit" in the Health domain.</li>
            <li><strong>Quests</strong> — Specific projects within a goal. Example: "Run a 5K" under "Get fit".</li>
            <li><strong>Steps</strong> — Individual actionable tasks within a quest. Example: "Run 1 mile without stopping" inside "Run a 5K".</li>
          </ol>

          <h3>Domains</h3>
          <p>Every goal belongs to one of eight life domains:</p>
          <table className={styles.table}>
            <thead><tr><th>Icon</th><th>Domain</th><th>Examples</th></tr></thead>
            <tbody>
              <tr><td>❤</td><td>Health</td><td>Fitness, diet, sleep</td></tr>
              <tr><td>⚔</td><td>Career</td><td>Work projects, promotions, skills</td></tr>
              <tr><td>📖</td><td>Learning</td><td>Courses, reading, certifications</td></tr>
              <tr><td>🤝</td><td>Social</td><td>Relationships, networking, community</td></tr>
              <tr><td>💰</td><td>Finance</td><td>Saving, investing, budgeting</td></tr>
              <tr><td>🎨</td><td>Creative</td><td>Art, music, writing, hobbies</td></tr>
              <tr><td>✨</td><td>Spiritual</td><td>Meditation, mindfulness, gratitude</td></tr>
              <tr><td>🏠</td><td>Home</td><td>Cleaning, organizing, repairs</td></tr>
            </tbody>
          </table>

          <h3>Priority Levels</h3>
          <p>Quests and steps can have a priority that affects XP rewards:</p>
          <table className={styles.table}>
            <thead><tr><th>Priority</th><th>Color</th><th>Step XP</th></tr></thead>
            <tbody>
              <tr><td>Normal</td><td>Gray</td><td>10 XP</td></tr>
              <tr><td>Important</td><td>Gold</td><td>15 XP (1.5x)</td></tr>
              <tr><td>Legendary</td><td>Orange</td><td>20 XP (2x)</td></tr>
            </tbody>
          </table>

          <h3>How to use</h3>
          <ol>
            <li>Tap <strong>+ New Goal</strong> — pick a domain, give it a title.</li>
            <li>Inside a goal, tap <strong>+ Quest</strong> — name the project, choose priority.</li>
            <li>Tap a quest to expand it, then type steps in the "Add a step" field at the bottom.</li>
            <li>Check off steps to earn XP. When all steps are done, the quest auto-completes for bonus XP. When all quests in a goal are done, the goal auto-completes for even more bonus XP.</li>
          </ol>

          <h3>Filters</h3>
          <p>Use the dropdowns at the top to filter by domain or status (Active / Completed / All).</p>

          <h2 id="guide-buffs">Buffs &amp; Debuffs</h2>
          <p>Buffs and debuffs represent daily habits that affect your character.</p>

          <h3>Buffs (Positive Habits)</h3>
          <p>Things you <em>want</em> to do every day. Examples:</p>
          <ul>
            <li>💪 Morning Exercise — +2 Stamina, +1 Health</li>
            <li>🧘 Meditation — +2 Willpower, +1 Focus</li>
            <li>😴 8 Hours Sleep — +1 Health, +1 Focus, +1 Stamina</li>
            <li>📚 Read 30 Minutes — +2 Focus</li>
          </ul>
          <p>Activating a buff earns <strong>5 XP</strong> and applies its stat effects for the duration you set (e.g., 24 hours). After that, the buff expires and you need to activate it again the next day.</p>

          <h3>Debuffs (Negative Habits)</h3>
          <p>Things you want to be <em>honest about tracking</em>. There is no XP penalty — this is for self-awareness. Examples:</p>
          <ul>
            <li>🍕 Junk Food — -1 Health, -1 Stamina</li>
            <li>📱 Doomscrolling — -2 Focus, -1 Willpower</li>
            <li>🍺 Alcohol — -1 Health, -1 Focus</li>
          </ul>
          <p>Debuffs still affect your stats while active, shown as red on your character screen.</p>

          <h3>Streaks</h3>
          <p>Activate the same buff on consecutive days to build a streak. Every <strong>7-day streak</strong> earns a bonus <strong>25 XP</strong>.</p>

          <h3>How to use</h3>
          <ol>
            <li>Tap <strong>+ New Buff/Debuff</strong> to define a habit template.</li>
            <li>Choose a name, type (buff or debuff), icon, duration in hours, and stat effects (positive numbers for buffs, negative for debuffs).</li>
            <li>Once created, it appears in the Buffs or Debuffs column. Tap <strong>Activate</strong> each day you do the habit.</li>
            <li>Active effects appear at the top with a countdown timer and are reflected on your Character screen stats.</li>
          </ol>

          <h3>Expiry</h3>
          <p>Buffs and debuffs expire automatically after their duration. The app checks every 60 seconds. You can also manually remove an active effect by tapping <strong>Remove</strong>.</p>

          <h2 id="guide-planner">Planner</h2>
          <p>A calendar to schedule your time and link events to your quests.</p>

          <h3>Views</h3>
          <ul>
            <li><strong>Day</strong> — Shows time slots from 6 AM to 9 PM. Scheduled events appear in their time slot. Unscheduled events appear at the bottom.</li>
            <li><strong>Week</strong> — 7-column grid (Mon–Sun). Each day shows its events. Tap <strong>+</strong> on any day to add an event.</li>
            <li><strong>Month</strong> — Calendar grid. Tap any day to add an event. Shows up to 3 events per day with a "+X more" indicator.</li>
          </ul>

          <h3>Navigation</h3>
          <p>Use the <strong>← →</strong> arrows to move between days/weeks/months. Tap <strong>Today</strong> to jump back to the current date.</p>

          <h3>Events</h3>
          <p>Tap <strong>+ Event</strong> to create one. Each event has:</p>
          <ul>
            <li><strong>Title</strong> — What you're doing.</li>
            <li><strong>Date</strong> — When.</li>
            <li><strong>Start/End Time</strong> — Optional. If set, it appears in the correct time slot in Day view.</li>
            <li><strong>Description</strong> — Optional notes.</li>
          </ul>
          <p>Check off events when completed. Linked events (connected to a quest or step) earn <strong>10 XP</strong> when completed.</p>

          <h2 id="guide-xp">XP System</h2>
          <p>Everything you do earns experience points:</p>
          <table className={styles.table}>
            <thead><tr><th>Action</th><th>XP</th></tr></thead>
            <tbody>
              <tr><td>Complete a normal step</td><td>+10</td></tr>
              <tr><td>Complete an important step</td><td>+15</td></tr>
              <tr><td>Complete a legendary step</td><td>+20</td></tr>
              <tr><td>Complete a quest (all steps done)</td><td>+50 bonus</td></tr>
              <tr><td>Complete a goal (all quests done)</td><td>+200 bonus</td></tr>
              <tr><td>Activate a buff (daily habit)</td><td>+5</td></tr>
              <tr><td>7-day streak on any buff</td><td>+25 bonus</td></tr>
              <tr><td>Complete a linked planner event</td><td>+10</td></tr>
            </tbody>
          </table>

          <h2 id="guide-levels">Levels &amp; Titles</h2>
          <p>XP needed per level increases as you grow. The formula is <code>50 × level^1.8</code>.</p>
          <table className={styles.table}>
            <thead><tr><th>Level</th><th>Title</th><th>Approx. Timeline</th></tr></thead>
            <tbody>
              <tr><td>1–4</td><td>Novice</td><td>Starting out</td></tr>
              <tr><td>5–9</td><td>Apprentice</td><td>~1–2 weeks</td></tr>
              <tr><td>10–14</td><td>Journeyman</td><td>~3–4 weeks</td></tr>
              <tr><td>15–21</td><td>Adept</td><td>~1–2 months</td></tr>
              <tr><td>22–29</td><td>Expert</td><td>~2–4 months</td></tr>
              <tr><td>30–39</td><td>Master</td><td>~4–8 months</td></tr>
              <tr><td>40–49</td><td>Legend</td><td>~8–12 months</td></tr>
              <tr><td>50+</td><td>Dragonborn</td><td>~1 year+</td></tr>
            </tbody>
          </table>
          <p>When you level up, a golden overlay appears announcing your new level and title.</p>

          <h2 id="guide-stats">Stats</h2>
          <p>Your character has five stats, all starting at <strong>10</strong>:</p>
          <table className={styles.table}>
            <thead><tr><th>Stat</th><th>Represents</th></tr></thead>
            <tbody>
              <tr><td>Stamina</td><td>Physical energy, endurance, exercise habits</td></tr>
              <tr><td>Willpower</td><td>Discipline, self-control, mental toughness</td></tr>
              <tr><td>Health</td><td>Physical wellbeing, nutrition, sleep</td></tr>
              <tr><td>Focus</td><td>Concentration, productivity, mental clarity</td></tr>
              <tr><td>Charisma</td><td>Social skills, confidence, communication</td></tr>
            </tbody>
          </table>
          <p>Stats are modified by active buffs and debuffs. They serve as a mirror of your current lifestyle — high Focus means you've been studying and avoiding distractions; low Health means you've been eating junk food or skipping sleep.</p>

          <h2 id="guide-tips">Tips</h2>
          <ul>
            <li><strong>Start small.</strong> Create one goal with one quest and a few steps. Don't overload yourself on day one.</li>
            <li><strong>Be honest with debuffs.</strong> There's no punishment — tracking negative habits helps you see patterns.</li>
            <li><strong>Use priorities wisely.</strong> Reserve "Legendary" for truly difficult or impactful tasks.</li>
            <li><strong>Build streaks.</strong> The 7-day streak bonus compounds — maintaining 3 daily buffs earns 75 bonus XP per week on top of the daily 5 XP each.</li>
            <li><strong>Use the planner.</strong> Scheduling time for quests makes you far more likely to complete them.</li>
            <li><strong>Check your character screen daily.</strong> Your stats tell you how balanced your life is.</li>
          </ul>

          <h2 id="guide-data">Saving &amp; Data</h2>
          <p>All your data is stored locally on this device in the browser's database. It persists across sessions — closing and reopening the app keeps everything.</p>
          <ul>
            <li><strong>Export Save</strong> — Downloads your entire database as a .db file. Use this for backups.</li>
            <li><strong>Import Save</strong> — Loads a previously exported .db file, replacing all current data. Use this to restore a backup or transfer data between devices.</li>
          </ul>
          <p><strong>Important:</strong> Clearing your browser/app data will erase your progress. Export a backup regularly.</p>

          <h3>Keyboard Shortcuts (Desktop)</h3>
          <table className={styles.table}>
            <thead><tr><th>Key</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>Character screen</td></tr>
              <tr><td>2</td><td>Quest Log</td></tr>
              <tr><td>3</td><td>Buffs</td></tr>
              <tr><td>4</td><td>Planner</td></tr>
              <tr><td>Esc</td><td>Close any open modal/popup</td></tr>
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
