import { useState, useEffect, useCallback } from 'react';
import { TabId } from './types/common';
import { useDatabase } from './hooks/useDatabase';
import { useCharacter } from './hooks/useCharacter';
import { useQuests } from './hooks/useQuests';
import { useBuffs } from './hooks/useBuffs';
import { usePlanner } from './hooks/usePlanner';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LevelUpModal } from './components/layout/LevelUpModal';
import { CharacterScreen } from './components/character/CharacterScreen';
import { QuestLog } from './components/quests/QuestLog';
import { BuffTracker } from './components/buffs/BuffTracker';
import { PlannerViewComponent } from './components/planner/PlannerView';
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
  const quests = useQuests({ grantXP: char.grantXP });
  const buffs = useBuffs({ grantXP: char.grantXP });
  const planner = usePlanner({ grantXP: char.grantXP });

  // Refresh data on tab change
  useEffect(() => {
    char.refresh();
    if (activeTab === 'quests') quests.refresh();
    if (activeTab === 'buffs') buffs.refresh();
    if (activeTab === 'planner') planner.refresh();
  }, [activeTab]);

  // Initial load
  useEffect(() => {
    quests.refresh();
    buffs.refresh();
    planner.refresh();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === '1') setActiveTab('character');
      if (e.key === '2') setActiveTab('quests');
      if (e.key === '3') setActiveTab('buffs');
      if (e.key === '4') setActiveTab('planner');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveTab]);

  const handleExport = useCallback(async () => {
    const data = await exportDatabase();
    const blob = new Blob([data], { type: 'application/octet-stream' });
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
      <Header character={char.character} />

      <main className={styles.main}>
        {activeTab === 'character' && (
          <CharacterScreen
            character={char.character}
            stats={buffs.stats}
            activeBuffs={buffs.activeBuffs}
            xpLog={char.xpLog}
            onNameChange={char.setName}
          />
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
          />
        )}

        {activeTab === 'planner' && (
          <PlannerViewComponent
            view={planner.view}
            setView={planner.setView}
            currentDate={planner.currentDate}
            events={planner.events}
            onNavigate={planner.navigateDay}
            onGoToToday={planner.goToToday}
            onCreate={planner.createEvent}
            onComplete={planner.completeEvent}
            onUncomplete={planner.uncompleteEvent}
            onDelete={planner.deleteEvent}
          />
        )}

        {/* Data management footer */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10, justifyContent: 'center' }}>
          <RPGButton size="small" variant="ghost" onClick={handleExport}>
            Export Save
          </RPGButton>
          <RPGButton size="small" variant="ghost" onClick={handleImport}>
            Import Save
          </RPGButton>
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

      <GuideButton />
    </div>
  );
}
