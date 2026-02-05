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
          {['overview','character','quests','buffs','achievements','energy','focus','routines','combos','review','events','skills','classes','territory','inventory','xp','levels','stats','tips','data'].map((id) => (
            <li key={id} className={styles.tocItem} onClick={() => scrollTo(`guide-${id}`)}>
              {{
                xp: 'XP System',
                data: 'Save Data',
                achievements: 'Achievements',
                energy: 'Energy',
                focus: 'Focus Timer',
                routines: 'Routines',
                combos: 'Habit Combos',
                review: 'Weekly Review',
                events: 'Random Events',
                skills: 'Skill Trees',
                classes: 'Classes',
                territory: 'Territory Map',
                inventory: 'Inventory',
              }[id] || id.charAt(0).toUpperCase() + id.slice(1)}
            </li>
          ))}
        </ul>

        <div className={styles.guideContent}>

          <h2 id="guide-overview">Overview</h2>
          <p>
            Goal Game turns your real-life goals into an RPG adventure. You create <strong>Goals</strong> (big-picture ambitions), break them into <strong>Quests</strong> (projects), and then into <strong>Steps</strong> (individual tasks). Completing steps earns <strong>XP</strong>, which levels up your character.
          </p>
          <p>
            Track daily habits as <strong>Buffs</strong> (positive) and <strong>Debuffs</strong> (negative) that affect your character's stats.
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

          <h2 id="guide-achievements">Achievements</h2>
          <p>Unlock achievements by reaching milestones. Each achievement rewards XP when unlocked.</p>
          <h3>Categories</h3>
          <ul>
            <li><strong>Quests</strong> — Complete steps, quests, and goals</li>
            <li><strong>Buffs</strong> — Activate habits regularly</li>
            <li><strong>Streaks</strong> — Maintain consecutive day streaks</li>
            <li><strong>Boss</strong> — Defeat weekly bosses</li>
            <li><strong>Levels</strong> — Reach level milestones (5, 10, 25, 50)</li>
          </ul>
          <p>View your progress in the Achievements panel. Some achievements are hidden until unlocked!</p>

          <h2 id="guide-energy">Energy System</h2>
          <p>Energy represents your daily capacity for action.</p>
          <h3>Mechanics</h3>
          <ul>
            <li><strong>Max Energy</strong> — Starts at 100</li>
            <li><strong>Regeneration</strong> — Recovers 10 energy per hour automatically</li>
            <li><strong>Costs</strong> — Some actions cost energy (completing steps: 5, activating buffs: 3)</li>
          </ul>
          <h3>Energy Debuffs</h3>
          <table className={styles.table}>
            <thead><tr><th>Threshold</th><th>Debuff</th><th>Effects</th></tr></thead>
            <tbody>
              <tr><td>Below 20</td><td>Fatigued</td><td>-2 Focus, -2 Willpower</td></tr>
              <tr><td>Below 5</td><td>Exhausted</td><td>-3 Stamina, -3 Willpower, -3 Focus, -1 Health</td></tr>
            </tbody>
          </table>
          <p>Keep your energy up to avoid stat penalties!</p>

          <h2 id="guide-focus">Focus Timer</h2>
          <p>A Pomodoro-style timer to boost productivity.</p>
          <h3>How it works</h3>
          <ul>
            <li><strong>Work sessions</strong> — Default 25 minutes of focused work</li>
            <li><strong>Short breaks</strong> — 5 minutes after each session</li>
            <li><strong>Long breaks</strong> — 15 minutes after 4 sessions</li>
          </ul>
          <h3>XP Rewards</h3>
          <ul>
            <li>+15 XP per completed focus session</li>
            <li>+5 XP bonus if linked to a quest step</li>
            <li>+10 XP bonus every 4 consecutive sessions</li>
          </ul>
          <p>Customize timer durations in Settings.</p>

          <h2 id="guide-routines">Morning/Evening Routines</h2>
          <p>Create routine chains to build powerful habits.</p>
          <h3>Types</h3>
          <ul>
            <li><strong>Morning</strong> — Start your day right</li>
            <li><strong>Evening</strong> — Wind down properly</li>
            <li><strong>Custom</strong> — Any time routines</li>
          </ul>
          <h3>How to use</h3>
          <ol>
            <li>Create a routine with a name and bonus XP reward</li>
            <li>Add steps to the routine (can be linked to buffs)</li>
            <li>Start the routine each day and complete steps in order</li>
            <li>Complete all required steps to earn the bonus XP</li>
          </ol>
          <p>Routine streaks earn extra XP every 7 days!</p>

          <h2 id="guide-combos">Habit Combos</h2>
          <p>Activate specific buff combinations for bonus XP.</p>
          <h3>Example Combos</h3>
          <ul>
            <li><strong>Wellness Warrior</strong> — Meditation + Exercise + Healthy Meal = +30 XP</li>
            <li><strong>Focus Master</strong> — No Phone + Deep Work + Reading = +25 XP</li>
            <li><strong>Early Bird</strong> — Morning Exercise + 8 Hours Sleep + No Phone First Hour = +35 XP</li>
          </ul>
          <p>Combos can only be claimed once per day. Activate all required buffs within 24 hours to qualify.</p>

          <h2 id="guide-review">Weekly Review</h2>
          <p>Reflect on your progress every week.</p>
          <h3>Summary Data</h3>
          <p>Auto-generated stats include: steps completed, quests completed, buffs activated, XP earned, boss damage dealt, focus sessions, and more.</p>
          <h3>Reflection Prompts</h3>
          <ul>
            <li><strong>Wins</strong> — What went well this week?</li>
            <li><strong>Challenges</strong> — What was difficult?</li>
            <li><strong>Priorities</strong> — Set up to 5 priorities for next week</li>
          </ul>
          <p>Completing your weekly review earns <strong>100 XP</strong>.</p>

          <h2 id="guide-events">Random Events</h2>
          <p>Special limited-time opportunities that appear randomly.</p>
          <h3>Event Types</h3>
          <ul>
            <li><strong>Bonus</strong> — Instant rewards (XP, energy, shields)</li>
            <li><strong>Challenge</strong> — Complete objectives for rewards</li>
            <li><strong>Modifier</strong> — Temporary boosts (double XP, stat increases)</li>
          </ul>
          <h3>Rarity</h3>
          <p>Events have different rarities: Common, Uncommon, Rare, Epic. Rarer events have better rewards!</p>
          <p>Events have a 15% chance to trigger and a 4-hour cooldown between checks.</p>

          <h2 id="guide-skills">Skill Trees</h2>
          <p>Spend XP to unlock permanent passive bonuses.</p>
          <h3>Branches</h3>
          <ul>
            <li><strong>Productivity</strong> (Blue) — Quest and step XP bonuses</li>
            <li><strong>Health</strong> (Red) — Energy and stamina bonuses</li>
            <li><strong>Focus</strong> (Purple) — Timer and concentration bonuses</li>
            <li><strong>Social</strong> (Orange) — Streak and charisma bonuses</li>
          </ul>
          <h3>How to unlock</h3>
          <p>Skills cost XP to unlock (100-500 XP per node). You must unlock prerequisite skills first. Capstone skills at the end of each branch provide the biggest bonuses.</p>

          <h2 id="guide-classes">Character Classes</h2>
          <p>Choose a class to specialize your character.</p>
          <h3>Available Classes</h3>
          <table className={styles.table}>
            <thead><tr><th>Class</th><th>Stat Bonuses</th><th>XP Bonus</th><th>Special</th></tr></thead>
            <tbody>
              <tr><td>Warrior</td><td>+3 Stamina, +2 Health</td><td>+10% Quest XP</td><td>Battlecry</td></tr>
              <tr><td>Mage</td><td>+3 Focus, +2 Willpower</td><td>+10% Buff XP</td><td>Arcane Focus</td></tr>
              <tr><td>Ranger</td><td>+3 Willpower, +1 Stamina, +1 Focus</td><td>+10% Streak XP</td><td>Tracking</td></tr>
              <tr><td>Paladin</td><td>+2 Health, +2 Willpower, +1 Charisma</td><td>+10% Boss XP</td><td>Divine Shield</td></tr>
            </tbody>
          </table>
          <p>You can change your class up to 3 times total.</p>

          <h2 id="guide-territory">Territory Map</h2>
          <p>Explore regions as you level up.</p>
          <h3>Territories</h3>
          <ol>
            <li><strong>The Awakening Glade</strong> (Level 1) — Where every journey begins</li>
            <li><strong>Habit Highlands</strong> (Level 5) — Rocky terrain for consistent habits</li>
            <li><strong>Focus Forest</strong> (Level 10) — Dense woods for the focused</li>
            <li><strong>Productivity Plains</strong> (Level 15) — Vast fields for goal achievers</li>
            <li><strong>Summit of Mastery</strong> (Level 25) — The peak for true masters</li>
          </ol>
          <p>Complete territory challenges to unlock rewards and earn special titles!</p>

          <h2 id="guide-inventory">Inventory & Items</h2>
          <p>Collect and equip items for stat bonuses.</p>
          <h3>Item Types</h3>
          <ul>
            <li><strong>Equipment</strong> — Weapons, armor, accessories with stat bonuses</li>
            <li><strong>Consumables</strong> — One-time use items (energy potions, XP elixirs)</li>
            <li><strong>Trophies</strong> — Special commemorative items from achievements</li>
          </ul>
          <h3>Equipment Slots</h3>
          <p>You can equip one item in each slot: Weapon, Armor, Accessory.</p>
          <h3>Rarity</h3>
          <p>Items come in 5 rarities: Common (gray), Uncommon (green), Rare (blue), Epic (purple), Legendary (orange).</p>
          <p>Items drop from achievements, boss defeats, and random events.</p>

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
              <tr><td>Complete a focus session</td><td>+15</td></tr>
              <tr><td>Complete a routine</td><td>+25</td></tr>
              <tr><td>Activate a habit combo</td><td>+25-35</td></tr>
              <tr><td>Complete weekly review</td><td>+100</td></tr>
              <tr><td>Unlock an achievement</td><td>+25-500</td></tr>
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
          <h3>Stat Sources</h3>
          <p>Your final stats are calculated from multiple sources:</p>
          <ul>
            <li><strong>Base</strong> — 10 in each stat</li>
            <li><strong>Active Buffs/Debuffs</strong> — Temporary effects from habits</li>
            <li><strong>Equipped Items</strong> — Bonuses from weapons, armor, accessories</li>
            <li><strong>Skill Tree</strong> — Permanent passive bonuses</li>
            <li><strong>Character Class</strong> — Class-specific bonuses</li>
            <li><strong>Energy Debuffs</strong> — Penalties when energy is low</li>
          </ul>
          <p>Stats serve as a mirror of your current lifestyle — high Focus means you've been studying and avoiding distractions; low Health means you've been eating junk food or skipping sleep.</p>

          <h2 id="guide-tips">Tips</h2>
          <ul>
            <li><strong>Start small.</strong> Create one goal with one quest and a few steps. Don't overload yourself on day one.</li>
            <li><strong>Be honest with debuffs.</strong> There's no punishment — tracking negative habits helps you see patterns.</li>
            <li><strong>Use priorities wisely.</strong> Reserve "Legendary" for truly difficult or impactful tasks.</li>
            <li><strong>Build streaks.</strong> The 7-day streak bonus compounds — maintaining 3 daily buffs earns 75 bonus XP per week on top of the daily 5 XP each.</li>
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
              <tr><td>Esc</td><td>Close any open modal/popup</td></tr>
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
