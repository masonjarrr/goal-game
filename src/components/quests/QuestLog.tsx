import { useState, useEffect, useMemo } from 'react';
import { GoalWithQuests } from '../../types/quest';
import { Domain } from '../../types/common';
import { RPGPanel } from '../ui/RPGPanel';
import { RPGButton } from '../ui/RPGButton';
import { RPGSelect } from '../ui/RPGInput';
import { RPGModal } from '../ui/RPGModal';
import { RPGInput, RPGTextarea } from '../ui/RPGInput';
import { QuestCard } from './QuestCard';
import styles from '../../styles/components/quests.module.css';

interface QuestLogProps {
  goals: GoalWithQuests[];
  domains: Domain[];
  filterDomain: number | undefined;
  filterStatus: string | undefined;
  onFilterDomain: (id: number | undefined) => void;
  onFilterStatus: (status: string | undefined) => void;
  onCreateGoal: (domainId: number, title: string, description?: string) => void;
  onCreateQuest: (goalId: number, title: string, description?: string, priority?: string) => void;
  onCreateStep: (questId: number, title: string, priority?: string) => void;
  onCompleteStep: (stepId: number, questId: number, priority: string) => void;
  onUncompleteStep: (stepId: number) => void;
  onMissStep: (stepId: number) => void;
  onUnmissStep: (stepId: number) => void;
  onDeleteStep: (stepId: number) => void;
  onDeleteQuest: (questId: number) => void;
  onDeleteGoal: (goalId: number) => void;
}

export function QuestLog({
  goals,
  domains,
  filterDomain,
  filterStatus,
  onFilterDomain,
  onFilterStatus,
  onCreateGoal,
  onCreateQuest,
  onCreateStep,
  onCompleteStep,
  onUncompleteStep,
  onMissStep,
  onUnmissStep,
  onDeleteStep,
  onDeleteQuest,
  onDeleteGoal,
}: QuestLogProps) {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showQuestForm, setShowQuestForm] = useState<number | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalDomain, setGoalDomain] = useState(1);
  const [questTitle, setQuestTitle] = useState('');
  const [questDesc, setQuestDesc] = useState('');
  const [questPriority, setQuestPriority] = useState('normal');

  // Track which goals are expanded - default: active goals expanded, completed collapsed
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(() => {
    const expanded = new Set<number>();
    goals.forEach((g) => {
      if (g.status !== 'completed') expanded.add(g.id);
    });
    return expanded;
  });

  // Update expanded state when goals change (new goal added, etc.)
  useEffect(() => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      goals.forEach((g) => {
        // Auto-expand new active goals
        if (g.status !== 'completed' && !prev.has(g.id)) {
          next.add(g.id);
        }
      });
      return next;
    });
  }, [goals]);

  const toggleGoal = (goalId: number) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const handleCreateGoal = () => {
    if (!goalTitle.trim()) return;
    onCreateGoal(goalDomain, goalTitle.trim(), goalDesc.trim());
    setGoalTitle('');
    setGoalDesc('');
    setShowGoalForm(false);
  };

  const handleCreateQuest = () => {
    if (!questTitle.trim() || showQuestForm === null) return;
    onCreateQuest(showQuestForm, questTitle.trim(), questDesc.trim(), questPriority);
    setQuestTitle('');
    setQuestDesc('');
    setQuestPriority('normal');
    setShowQuestForm(null);
  };

  // Calculate stats for each goal
  const getGoalStats = (goal: GoalWithQuests) => {
    const totalQuests = goal.quests.length;
    const completedQuests = goal.quests.filter((q) => q.status === 'completed').length;
    const totalSteps = goal.quests.reduce((acc, q) => acc + q.steps.length, 0);
    const completedSteps = goal.quests.reduce(
      (acc, q) => acc + q.steps.filter((s) => s.status === 'completed').length,
      0
    );
    const missedSteps = goal.quests.reduce(
      (acc, q) => acc + q.steps.filter((s) => s.status === 'missed').length,
      0
    );
    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    return { totalQuests, completedQuests, totalSteps, completedSteps, missedSteps, progressPercent };
  };

  // Sort goals: active first, then by most recent activity
  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      // Active goals first
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return 0;
    });
  }, [goals]);

  return (
    <div className={styles.questLog}>
      <div className={styles.questToolbar}>
        <div className={styles.questFilters}>
          <RPGSelect
            value={filterDomain ?? ''}
            onChange={(e) => onFilterDomain(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">All Domains</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.icon} {d.name}
              </option>
            ))}
          </RPGSelect>
          <RPGSelect
            value={filterStatus ?? ''}
            onChange={(e) => onFilterStatus(e.target.value || undefined)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </RPGSelect>
        </div>
        <RPGButton variant="primary" onClick={() => setShowGoalForm(true)}>
          + New Goal
        </RPGButton>
      </div>

      {goals.length === 0 ? (
        <RPGPanel>
          <div className={styles.emptyState}>
            No goals yet. Create your first goal to begin your adventure!
          </div>
        </RPGPanel>
      ) : (
        <div className={styles.goalsContainer}>
          {sortedGoals.map((goal) => {
            const stats = getGoalStats(goal);
            const isExpanded = expandedGoals.has(goal.id);
            const isCompleted = goal.status === 'completed';

            return (
              <div
                key={goal.id}
                className={`${styles.goalCard} ${isCompleted ? styles.goalCompleted : ''}`}
              >
                <div
                  className={styles.goalHeader}
                  onClick={() => toggleGoal(goal.id)}
                >
                  <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                    ▶
                  </span>
                  <span className={styles.goalDomainIcon}>{goal.domain_icon}</span>
                  <div className={styles.goalInfo}>
                    <span className={styles.goalTitle}>{goal.title}</span>
                    <div className={styles.goalStats}>
                      <span className={styles.goalStatItem}>
                        {stats.completedQuests}/{stats.totalQuests} quests
                      </span>
                      <span className={styles.goalStatItem}>
                        {stats.completedSteps}/{stats.totalSteps} steps
                      </span>
                      {stats.missedSteps > 0 && (
                        <span className={`${styles.goalStatItem} ${styles.missed}`}>
                          {stats.missedSteps} missed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.goalProgress}>
                    <div className={styles.goalProgressBar}>
                      <div
                        className={styles.goalProgressFill}
                        style={{ width: `${stats.progressPercent}%` }}
                      />
                    </div>
                    <span className={styles.goalProgressText}>{stats.progressPercent}%</span>
                  </div>
                  <div className={styles.goalActions} onClick={(e) => e.stopPropagation()}>
                    <RPGButton
                      size="small"
                      variant="primary"
                      onClick={() => setShowQuestForm(goal.id)}
                    >
                      +
                    </RPGButton>
                    <RPGButton
                      size="small"
                      variant="danger"
                      onClick={() => onDeleteGoal(goal.id)}
                    >
                      ×
                    </RPGButton>
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.goalContent}>
                    {goal.quests.length === 0 ? (
                      <div className={styles.emptyStateSmall}>
                        No quests yet. Click + to add one.
                      </div>
                    ) : (
                      <div className={styles.questsGrid}>
                        {goal.quests.map((quest) => (
                          <QuestCard
                            key={quest.id}
                            quest={quest}
                            compact
                            onCreateStep={onCreateStep}
                            onCompleteStep={onCompleteStep}
                            onUncompleteStep={onUncompleteStep}
                            onMissStep={onMissStep}
                            onUnmissStep={onUnmissStep}
                            onDeleteStep={onDeleteStep}
                            onDeleteQuest={onDeleteQuest}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Goal Modal */}
      <RPGModal
        open={showGoalForm}
        onClose={() => setShowGoalForm(false)}
        title="New Goal"
        actions={
          <>
            <RPGButton onClick={() => setShowGoalForm(false)}>Cancel</RPGButton>
            <RPGButton variant="primary" onClick={handleCreateGoal}>
              Create Goal
            </RPGButton>
          </>
        }
      >
        <div className={styles.formGrid}>
          <RPGSelect label="Domain" value={goalDomain} onChange={(e) => setGoalDomain(Number(e.target.value))}>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.icon} {d.name}
              </option>
            ))}
          </RPGSelect>
          <RPGInput
            label="Goal Title"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="e.g., Get in shape"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateGoal()}
          />
          <RPGTextarea
            label="Description (optional)"
            value={goalDesc}
            onChange={(e) => setGoalDesc(e.target.value)}
            placeholder="Describe your goal..."
          />
        </div>
      </RPGModal>

      {/* New Quest Modal */}
      <RPGModal
        open={showQuestForm !== null}
        onClose={() => setShowQuestForm(null)}
        title="New Quest"
        actions={
          <>
            <RPGButton onClick={() => setShowQuestForm(null)}>Cancel</RPGButton>
            <RPGButton variant="primary" onClick={handleCreateQuest}>
              Create Quest
            </RPGButton>
          </>
        }
      >
        <div className={styles.formGrid}>
          <RPGInput
            label="Quest Title"
            value={questTitle}
            onChange={(e) => setQuestTitle(e.target.value)}
            placeholder="e.g., Run 5K"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateQuest()}
          />
          <RPGTextarea
            label="Description (optional)"
            value={questDesc}
            onChange={(e) => setQuestDesc(e.target.value)}
            placeholder="Describe this quest..."
          />
          <RPGSelect label="Priority" value={questPriority} onChange={(e) => setQuestPriority(e.target.value)}>
            <option value="normal">Normal</option>
            <option value="important">Important (1.5x XP)</option>
            <option value="legendary">Legendary (2x XP)</option>
          </RPGSelect>
        </div>
      </RPGModal>
    </div>
  );
}
