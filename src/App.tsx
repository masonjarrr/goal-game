import { useState, useEffect, useCallback } from 'react';
import { TabId } from './types/common';
import { useDatabase } from './hooks/useDatabase';
import { useCharacter } from './hooks/useCharacter';
import { useQuests } from './hooks/useQuests';
import { useBuffs } from './hooks/useBuffs';
import { useAutoBackup } from './hooks/useAutoBackup';
import { useNotifications } from './hooks/useNotifications';
import { useDailyQuests } from './hooks/useDailyQuests';
import { useStreaks } from './hooks/useStreaks';
import { useWeeklyBoss } from './hooks/useWeeklyBoss';
import { useAchievements } from './hooks/useAchievements';
import { useEnergy } from './hooks/useEnergy';
import { useFocusTimer } from './hooks/useFocusTimer';
import { useRoutines } from './hooks/useRoutines';
import { useCombos } from './hooks/useCombos';
import { useWeeklyReview } from './hooks/useWeeklyReview';
import { useRandomEvents } from './hooks/useRandomEvents';
import { useSkillTree } from './hooks/useSkillTree';
import { useCharacterClass } from './hooks/useCharacterClass';
import { useTerritory } from './hooks/useTerritory';
import { useInventory } from './hooks/useInventory';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LevelUpModal } from './components/layout/LevelUpModal';
import { CharacterScreen } from './components/character/CharacterScreen';
import { CharacterHeader } from './components/character/CharacterHeader';
import { AccordionSection } from './components/ui/Accordion';
import { QuestLog } from './components/quests/QuestLog';
import { BuffTracker } from './components/buffs/BuffTracker';
import { BackupSettings } from './components/settings/BackupSettings';
import { NotificationSettings } from './components/notifications/NotificationSettings';
import { DailyQuestsPanel } from './components/dailyQuests/DailyQuestsPanel';
import { WeeklyBossPanel } from './components/weeklyBoss/WeeklyBossPanel';
import { AchievementPanel } from './components/achievements/AchievementPanel';
import { AchievementUnlockModal } from './components/achievements/AchievementUnlockModal';
import { FocusTimerPanel } from './components/focusTimer/FocusTimerPanel';
import { RoutinePanel } from './components/routines/RoutinePanel';
import { ComboDisplay } from './components/combos/ComboDisplay';
import { WeeklyReviewPanel } from './components/weeklyReview/WeeklyReviewPanel';
import { exportDatabase, importDatabase } from './db/database';
import { RPGButton } from './components/ui/RPGButton';
import { GuideButton } from './components/layout/GuideModal';
import styles from './styles/components/layout.module.css';

export default function App() {
  const { ready, error } = useDatabase();
  const [activeTab, setActiveTab] = useState<TabId>('character');

  if (!ready) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0a0f', color: '#c8a84e',
        fontFamily: 'Cinzel, serif', fontSize: '1.2rem',
      }}>
        {error ? `Error: ${error}` : 'Loading database...'}
      </div>
    );
  }

  return <AppContent activeTab={activeTab} setActiveTab={setActiveTab} />;
}

function AppContent({ activeTab, setActiveTab }: { activeTab: TabId; setActiveTab: (t: TabId) => void }) {
  const char = useCharacter();
  const streaks = useStreaks({ grantXP: char.grantXP });
  const weeklyBoss = useWeeklyBoss({ grantXP: char.grantXP, addShields: streaks.addShields });
  const dailyQuests = useDailyQuests({ grantXP: char.grantXP });

  // New hooks integration
  const energy = useEnergy();
  const achievements = useAchievements({ grantXP: char.grantXP });
  const skillTree = useSkillTree({ totalXP: char.character.total_xp });
  const characterClass = useCharacterClass();
  const territory = useTerritory({ characterLevel: char.character.level, grantXP: char.grantXP });
  const inventory = useInventory({
    grantXP: char.grantXP,
    addEnergy: energy.addEnergy,
    addShields: streaks.addShields,
  });
  const focusTimer = useFocusTimer({
    grantXP: char.grantXP,
    onSessionComplete: () => {
      achievements.incrementProgress('focus_sessions_completed', 1);
      weeklyBoss.dealDamage('focus_session', 'Focus session completed');
    },
  });
  const routines = useRoutines({
    grantXP: char.grantXP,
    onRoutineComplete: (routineId: number) => {
      achievements.incrementProgress('routines_completed', 1);
      weeklyBoss.dealDamage('routine_completed', 'Routine completed');
    },
  });
  const combos = useCombos({ grantXP: char.grantXP });
  const weeklyReview = useWeeklyReview({ grantXP: char.grantXP });
  const randomEvents = useRandomEvents({
    grantXP: char.grantXP,
    addEnergy: energy.addEnergy,
    addShields: streaks.addShields,
  });

  const quests = useQuests({
    grantXP: char.grantXP,
    onStepComplete: () => {
      dailyQuests.updateProgress('complete_steps', 1);
      weeklyBoss.dealDamage('step_completed', 'Completed a step');
      achievements.incrementProgress('steps_completed', 1);
    },
    onQuestComplete: () => {
      weeklyBoss.dealDamage('quest_completed', 'Completed a quest');
      achievements.incrementProgress('quests_completed', 1);
    },
    onGoalComplete: () => {
      weeklyBoss.dealDamage('goal_completed', 'Completed a goal');
      achievements.incrementProgress('goals_completed', 1);
    },
  });
  const notifications = useNotifications();
  const buffs = useBuffs({
    grantXP: char.grantXP,
    scheduleBuffExpiry: notifications.scheduleBuffExpiry,
    cancelBuffExpiry: notifications.cancelBuffExpiry,
    onBuffActivated: (type) => {
      dailyQuests.updateProgress('activate_buffs', 1);
      // Check for early start (before 8 AM)
      const hour = new Date().getHours();
      if (hour < 8) {
        dailyQuests.updateProgress('early_start', 1);
      }
      // Check for health-related buff
      if (type === 'buff') {
        dailyQuests.updateProgress('activate_specific', 1);
        // Deal damage to boss
        weeklyBoss.dealDamage('buff_activated', 'Activated a buff');
        achievements.incrementProgress('buffs_activated', 1);
      }
      // Refresh streaks when buff is activated
      streaks.refresh();
      // Check for combos
      combos.checkAndActivateCombos();
    },
  });
  const autoBackup = useAutoBackup();
  const [showBackupSettings, setShowBackupSettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // Refresh data on tab change
  useEffect(() => {
    char.refresh();
    if (activeTab === 'quests') quests.refresh();
    if (activeTab === 'buffs') {
      buffs.refresh();
      streaks.refresh();
      combos.refresh();
    }
    if (activeTab === 'focus') focusTimer.refresh();
    if (activeTab === 'skills') {
      skillTree.refresh();
      characterClass.refresh();
      territory.refresh();
    }
    if (activeTab === 'inventory') inventory.refresh();
  }, [activeTab]);

  // Initial load
  useEffect(() => {
    quests.refresh();
    buffs.refresh();
    streaks.refresh();
    energy.refresh();
    achievements.refresh();
    // Check no-debuffs quest status on load
    dailyQuests.checkNoDebuffs();
  }, []);


  // Check for level-based achievements
  useEffect(() => {
    achievements.checkThreshold('character_level', char.character.level);
  }, [char.character.level]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === '1') setActiveTab('character');
      if (e.key === '2') setActiveTab('quests');
      if (e.key === '3') setActiveTab('buffs');
      if (e.key === '4') setActiveTab('focus');
      if (e.key === '5') setActiveTab('skills');
      if (e.key === '6') setActiveTab('inventory');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveTab]);

  const handleExport = useCallback(async () => {
    const data = await exportDatabase();
    const blob = new Blob([new Uint8Array(data)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goal-game-backup-${new Date().toISOString().split('T')[0]}.db`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.db';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const buffer = await file.arrayBuffer();
      await importDatabase(new Uint8Array(buffer));
      window.location.reload();
    };
    input.click();
  }, []);

  return (
    <div className={styles.appShell}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <Header character={char.character} energyState={energy.state} />

      <main className={styles.main}>
        {activeTab === 'character' && (
          <>
            {/* Compact Character Header */}
            <CharacterHeader character={char.character} stats={buffs.stats} />

            {/* Random Event Banner (only if events exist) */}
            {randomEvents.activeEvents.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {randomEvents.activeEvents.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      background: 'linear-gradient(135deg, rgba(200,168,78,0.2), rgba(200,168,78,0.1))',
                      border: '1px solid var(--border-gold)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginBottom: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1.1rem' }}>{event.template.icon}</span>
                      <div>
                        <strong style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>{event.template.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {event.template.description}
                        </div>
                      </div>
                    </div>
                    {!event.is_claimed && (
                      <RPGButton size="small" onClick={() => randomEvents.claimEvent(event.id)}>
                        Claim
                      </RPGButton>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Accordion Sections */}
            <AccordionSection
              title="Today's Tasks"
              icon="📋"
              badge={`${dailyQuests.completedCount}/${dailyQuests.quests.length}`}
              badgeColor={dailyQuests.allCompleted ? 'green' : 'gold'}
              defaultExpanded={true}
            >
              <DailyQuestsPanel
                quests={dailyQuests.quests}
                loading={dailyQuests.loading}
                allCompleted={dailyQuests.allCompleted}
                completedCount={dailyQuests.completedCount}
                bonusClaimed={dailyQuests.bonusClaimed}
                bonusXp={dailyQuests.bonusXp}
                totalXpEarned={dailyQuests.totalXpEarned}
                onClaimBonus={async () => {
                  await dailyQuests.claimBonus();
                  for (const quest of dailyQuests.quests) {
                    if (quest.is_completed) {
                      weeklyBoss.dealDamage('daily_quest_completed', `Daily Quest: ${quest.title}`);
                    }
                  }
                }}
                compact
              />
              {routines.routines.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <RoutinePanel
                    routines={routines.routines}
                    loading={routines.loading}
                    onCreateRoutine={routines.createRoutine}
                    onDeleteRoutine={routines.deleteRoutine}
                    onStartRoutine={routines.startRoutine}
                    onCompleteStep={routines.completeStep}
                    onSkipStep={routines.skipStep}
                    onAddStep={routines.addStep}
                    onDeleteStep={routines.deleteStep}
                    getStepsWithStatus={routines.getStepsWithStatus}
                    compact
                  />
                </div>
              )}
            </AccordionSection>

            <AccordionSection
              title="Weekly Boss"
              icon="🐉"
              badge={weeklyBoss.boss?.is_defeated ? 'Defeated!' : `${weeklyBoss.hpPercentage}% HP`}
              badgeColor={weeklyBoss.boss?.is_defeated ? 'green' : weeklyBoss.hpPercentage < 30 ? 'red' : 'gold'}
              headerContent={
                !weeklyBoss.boss?.is_defeated && (
                  <div style={{ width: 80, height: 6, background: 'var(--bg-dark)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${weeklyBoss.hpPercentage}%`, height: '100%', background: weeklyBoss.hpPercentage < 30 ? '#ef4444' : '#22c55e', borderRadius: 3 }} />
                  </div>
                )
              }
            >
              <WeeklyBossPanel
                boss={weeklyBoss.boss}
                loading={weeklyBoss.loading}
                weekStart={weeklyBoss.weekStart}
                weekEnd={weeklyBoss.weekEnd}
                hpPercentage={weeklyBoss.hpPercentage}
                damageDealt={weeklyBoss.damageDealt}
                totalDefeated={weeklyBoss.totalDefeated}
                compact
              />
            </AccordionSection>

            {combos.combos.length > 0 && (
              <AccordionSection
                title="Combos"
                icon="⚡"
                badge={combos.combos.filter(c => c.is_ready).length > 0 ? `${combos.combos.filter(c => c.is_ready).length} ready!` : undefined}
                badgeColor="green"
              >
                <ComboDisplay
                  combos={combos.combos}
                  loading={combos.loading}
                  onClaimCombo={combos.claimCombo}
                  compact
                />
              </AccordionSection>
            )}

            <AccordionSection
              title="Character Stats"
              icon="⚔️"
              badge={`Lv.${char.character.level}`}
              badgeColor="gold"
            >
              <CharacterScreen
                character={char.character}
                stats={buffs.stats}
                activeBuffs={buffs.activeBuffs}
                xpLog={char.xpLog}
                onNameChange={char.setName}
                compact
              />
            </AccordionSection>

            <AccordionSection
              title="Achievements"
              icon="🏆"
              badge={`${achievements.stats.unlocked}/${achievements.stats.total}`}
              badgeColor={achievements.stats.unlocked === achievements.stats.total ? 'green' : 'gold'}
            >
              <AchievementPanel
                achievements={achievements.achievements}
                stats={achievements.stats}
                loading={achievements.loading}
                compact
              />
            </AccordionSection>

            {!weeklyReview.currentReview?.is_completed && (
              <AccordionSection
                title="Weekly Review"
                icon="📝"
                badge="Due"
                badgeColor="blue"
              >
                <WeeklyReviewPanel
                  currentReview={weeklyReview.currentReview}
                  loading={weeklyReview.loading}
                  onGenerateSummary={weeklyReview.generateSummary}
                  onUpdateContent={weeklyReview.updateContent}
                  onCompleteReview={weeklyReview.completeReview}
                  getSummaryFromReview={weeklyReview.getSummaryFromReview}
                  getPrioritiesFromReview={weeklyReview.getPrioritiesFromReview}
                  getWeekStart={weeklyReview.getWeekStart}
                  compact
                />
              </AccordionSection>
            )}
          </>
        )}

        {activeTab === 'quests' && (
          <QuestLog
            goals={quests.goals}
            domains={quests.domains}
            filterDomain={quests.filterDomain}
            filterStatus={quests.filterStatus}
            onFilterDomain={(d) => { quests.setFilterDomain(d); }}
            onFilterStatus={(s) => { quests.setFilterStatus(s); }}
            onCreateGoal={quests.createGoal}
            onCreateQuest={quests.createQuest}
            onCreateStep={quests.createStep}
            onCompleteStep={quests.completeStep}
            onUncompleteStep={quests.uncompleteStep}
            onDeleteStep={quests.deleteStep}
            onDeleteQuest={quests.deleteQuest}
            onDeleteGoal={quests.deleteGoal}
          />
        )}

        {activeTab === 'buffs' && (
          <BuffTracker
            definitions={buffs.definitions}
            activeBuffs={buffs.activeBuffs}
            onCreateDefinition={buffs.createDefinition}
            onDeleteDefinition={buffs.deleteDefinition}
            onActivateBuff={buffs.activateBuff}
            onDeactivateBuff={buffs.deactivateBuff}
            streakInfos={streaks.streakInfos}
            shieldCount={streaks.shieldCount}
            onUseShield={streaks.useShield}
            getUnclaimedMilestones={streaks.getUnclaimedMilestones}
            onClaimMilestones={streaks.claimMilestones}
          />
        )}

        {activeTab === 'focus' && (
          <FocusTimerPanel
            timerState={focusTimer.timerState}
            settings={focusTimer.settings}
            stats={focusTimer.stats}
            recentSessions={focusTimer.recentSessions}
            onStartWork={focusTimer.startWork}
            onStartBreak={focusTimer.startBreak}
            onPause={focusTimer.pause}
            onResume={focusTimer.resume}
            onStop={focusTimer.stop}
            onSkipBreak={focusTimer.skipBreak}
            onUpdateSettings={focusTimer.updateSettings}
            formatTime={focusTimer.formatTime}
          />
        )}

        {activeTab === 'skills' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Character Class Selection */}
            <div className="rpg-card">
              <h2 style={{ color: 'var(--gold)', marginBottom: 16 }}>Character Class</h2>
              {characterClass.getSelectedClass() ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: '2rem' }}>{characterClass.getSelectedClass()?.icon}</span>
                  <div>
                    <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>
                      {characterClass.getSelectedClass()?.name}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      {characterClass.getSelectedClass()?.description}
                    </p>
                    <p style={{ color: 'var(--gold)', fontSize: '0.85rem', marginTop: 8 }}>
                      {characterClass.getSelectedClass()?.special_ability_desc}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Choose your class to gain unique bonuses:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {characterClass.classes.map((cls) => (
                      <div
                        key={cls.id}
                        style={{
                          background: 'var(--bg-medium)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 8,
                          padding: 16,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => characterClass.selectClass(cls.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-gold)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                      >
                        <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{cls.icon}</div>
                        <h4 style={{ color: 'var(--gold)', margin: '0 0 4px 0' }}>{cls.name}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                          {cls.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Skill Trees */}
            <div className="rpg-card">
              <h2 style={{ color: 'var(--gold)', marginBottom: 16 }}>Skill Trees</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                Spend XP to unlock passive bonuses. Total XP available: {char.character.total_xp}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {skillTree.branches.map((branch) => (
                  <div
                    key={branch.id}
                    style={{
                      background: 'var(--bg-medium)',
                      border: `1px solid ${branch.color}40`,
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <h3 style={{ color: branch.color, marginBottom: 12 }}>
                      {branch.icon} {branch.name}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {skillTree.nodes
                        .filter((n) => n.branch_id === branch.id)
                        .sort((a, b) => a.tier - b.tier)
                        .map((node) => (
                          <div
                            key={node.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              background: node.unlocked ? `${branch.color}20` : 'var(--bg-dark)',
                              border: `1px solid ${node.unlocked ? branch.color : 'var(--border-color)'}`,
                              borderRadius: 6,
                              opacity: node.can_unlock || node.unlocked ? 1 : 0.5,
                            }}
                          >
                            <div>
                              <span style={{ marginRight: 8 }}>{node.icon}</span>
                              <span style={{ color: node.unlocked ? branch.color : 'var(--text-primary)' }}>
                                {node.name}
                              </span>
                            </div>
                            {node.unlocked ? (
                              <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Unlocked</span>
                            ) : node.can_unlock ? (
                              <RPGButton
                                size="small"
                                onClick={() => skillTree.unlockSkill(node.id)}
                              >
                                {node.xp_cost} XP
                              </RPGButton>
                            ) : (
                              <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                {node.xp_cost} XP
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Territory Progress */}
            <div className="rpg-card">
              <h2 style={{ color: 'var(--gold)', marginBottom: 16 }}>Territory Map</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {territory.territories.map((t) => {
                  return (
                    <div
                      key={t.id}
                      style={{
                        flex: '1 1 200px',
                        maxWidth: 250,
                        background: t.is_current ? `${t.background_color}30` : 'var(--bg-medium)',
                        border: `2px solid ${t.is_current ? t.background_color : t.discovered ? 'var(--border-gold)' : 'var(--border-color)'}`,
                        borderRadius: 8,
                        padding: 16,
                        opacity: t.is_locked ? 0.5 : 1,
                        cursor: t.discovered && !t.is_current ? 'pointer' : 'default',
                      }}
                      onClick={() => {
                        if (t.discovered && !t.is_current) {
                          territory.travelTo(t.id);
                        }
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{t.icon}</div>
                      <h4 style={{ color: t.is_current ? t.background_color : 'var(--text-primary)', margin: '0 0 4px 0' }}>
                        {t.name}
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                        {t.is_locked ? `Unlocks at Level ${t.unlock_level}` : t.description}
                      </p>
                      {t.is_current && (
                        <span style={{ display: 'inline-block', marginTop: 8, padding: '2px 8px', background: t.background_color, color: '#000', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                          Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Equipped Items */}
            <div className="rpg-card">
              <h2 style={{ color: 'var(--gold)', marginBottom: 16 }}>Equipment</h2>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['weapon', 'armor', 'accessory'].map((slot) => {
                  const equipped = inventory.getEquipmentBySlot(slot);
                  return (
                    <div
                      key={slot}
                      style={{
                        flex: '1 1 150px',
                        maxWidth: 200,
                        background: 'var(--bg-medium)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        padding: 16,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
                        {slot}
                      </div>
                      {equipped ? (
                        <>
                          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{equipped.item.definition.icon}</div>
                          <div style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{equipped.item.definition.name}</div>
                          <RPGButton size="small" variant="ghost" onClick={() => inventory.unequipItem(slot)}>
                            Unequip
                          </RPGButton>
                        </>
                      ) : (
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Empty</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inventory Grid */}
            <div className="rpg-card">
              <h2 style={{ color: 'var(--gold)', marginBottom: 16 }}>Inventory</h2>
              {inventory.inventory.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>Your inventory is empty. Complete achievements and defeat bosses to earn items!</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                  {inventory.inventory.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: 'var(--bg-medium)',
                        border: `1px solid ${
                          item.definition.rarity === 'legendary' ? '#ff9800' :
                          item.definition.rarity === 'epic' ? '#9c27b0' :
                          item.definition.rarity === 'rare' ? '#2196f3' :
                          item.definition.rarity === 'uncommon' ? '#4caf50' : 'var(--border-color)'
                        }`,
                        borderRadius: 8,
                        padding: 12,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{item.definition.icon}</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: 4 }}>
                        {item.definition.name}
                      </div>
                      {item.quantity > 1 && (
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: 4 }}>
                          x{item.quantity}
                        </div>
                      )}
                      {item.definition.type === 'equipment' && (
                        <RPGButton size="small" onClick={() => inventory.equipItem(item.id)}>
                          Equip
                        </RPGButton>
                      )}
                      {item.definition.type === 'consumable' && (
                        <RPGButton size="small" onClick={() => inventory.useConsumable(item.id)}>
                          Use
                        </RPGButton>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data management footer */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
          {showNotificationSettings && <NotificationSettings />}
          {showBackupSettings && <BackupSettings />}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <RPGButton size="small" variant="ghost" onClick={() => setShowNotificationSettings(!showNotificationSettings)}>
              {showNotificationSettings ? 'Hide Notifications' : 'Notifications'}
            </RPGButton>
            <RPGButton size="small" variant="ghost" onClick={() => setShowBackupSettings(!showBackupSettings)}>
              {showBackupSettings ? 'Hide Cloud Backup' : 'Cloud Backup'}
            </RPGButton>
            <RPGButton size="small" variant="ghost" onClick={handleExport}>
              Export Save
            </RPGButton>
            <RPGButton size="small" variant="ghost" onClick={handleImport}>
              Import Save
            </RPGButton>
          </div>
        </div>
      </main>

      {/* XP Float animations */}
      {char.xpFloats.map((f) => (
        <div key={f.id} className={styles.xpFloat}>
          +{f.amount} XP
        </div>
      ))}

      {/* Level Up Modal */}
      {char.levelUpInfo && (
        <LevelUpModal
          level={char.levelUpInfo.level}
          title={char.levelUpInfo.title}
          onDismiss={char.dismissLevelUp}
        />
      )}

      {/* Achievement Unlock Modal */}
      <AchievementUnlockModal
        unlock={achievements.pendingUnlocks.length > 0 ? achievements.pendingUnlocks[0] : null}
        onDismiss={() => achievements.dismissUnlock(0)}
      />

      <GuideButton />

      {/* Auto-backup notification */}
      {autoBackup.message && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          background: autoBackup.status === 'error' ? 'rgba(231, 76, 60, 0.9)' : 'rgba(46, 204, 113, 0.9)',
          color: '#fff',
          borderRadius: 8,
          fontSize: '0.9rem',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {autoBackup.message}
        </div>
      )}
    </div>
  );
}
