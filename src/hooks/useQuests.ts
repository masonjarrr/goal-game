import { useState, useCallback, useEffect } from 'react';
import { GoalWithQuests } from '../types/quest';
import { Domain } from '../types/common';
import * as questRepo from '../db/repositories/questRepo';
import { XP_PER_STEP, XP_QUEST_COMPLETE, XP_GOAL_COMPLETE } from '../utils/constants';

interface UseQuestsOptions {
  grantXP: (amount: number, reason: string, sourceType: string, sourceId?: number) => Promise<any>;
  onStepComplete?: () => void;
  onQuestComplete?: () => void;
  onGoalComplete?: () => void;
}

export function useQuests({ grantXP, onStepComplete, onQuestComplete, onGoalComplete }: UseQuestsOptions) {
  const [goals, setGoals] = useState<GoalWithQuests[]>([]);
  const [domains] = useState<Domain[]>(() => questRepo.getDomains());
  const [filterDomain, setFilterDomain] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>('active');

  const refresh = useCallback(() => {
    setGoals(questRepo.getGoalsWithQuests(filterDomain, filterStatus));
  }, [filterDomain, filterStatus]);

  // Auto-refresh when filters change
  useEffect(() => {
    refresh();
  }, [refresh]);

  const createGoal = useCallback(
    async (domainId: number, title: string, description?: string) => {
      await questRepo.createGoal(domainId, title, description);
      refresh();
    },
    [refresh]
  );

  const createQuest = useCallback(
    async (goalId: number, title: string, description?: string, priority?: string) => {
      await questRepo.createQuest(goalId, title, description, priority);
      refresh();
    },
    [refresh]
  );

  const createStep = useCallback(
    async (questId: number, title: string, priority?: string) => {
      await questRepo.createStep(questId, title, priority);
      refresh();
    },
    [refresh]
  );

  const completeStep = useCallback(
    async (stepId: number, questId: number, priority: string) => {
      await questRepo.completeStep(stepId);
      const xp = XP_PER_STEP[priority] || 10;
      await grantXP(xp, `Completed step`, 'step', stepId);

      // Notify daily quest tracker
      if (onStepComplete) {
        onStepComplete();
      }

      // Check if quest is now complete (all steps done)
      const steps = questRepo.getSteps(questId);
      const allDone = steps.every((s) => s.status === 'completed');
      if (allDone && steps.length > 0) {
        await questRepo.updateQuestStatus(questId, 'completed');
        await grantXP(XP_QUEST_COMPLETE, `Completed quest`, 'quest', questId);

        // Notify quest completion
        if (onQuestComplete) {
          onQuestComplete();
        }

        // Check if goal is complete (all quests done)
        const quest = questRepo.getQuestWithSteps(questId);
        if (quest) {
          const goalQuests = questRepo.getQuests(quest.goal_id);
          const allQuestsDone = goalQuests.every((q) => q.status === 'completed');
          if (allQuestsDone) {
            await questRepo.updateGoalStatus(quest.goal_id, 'completed');
            await grantXP(XP_GOAL_COMPLETE, `Completed goal`, 'goal', quest.goal_id);

            // Notify goal completion
            if (onGoalComplete) {
              onGoalComplete();
            }
          }
        }
      }

      refresh();
    },
    [refresh, grantXP, onStepComplete, onQuestComplete, onGoalComplete]
  );

  const uncompleteStep = useCallback(
    async (stepId: number) => {
      await questRepo.uncompleteStep(stepId);
      refresh();
    },
    [refresh]
  );

  const deleteStep = useCallback(
    async (stepId: number) => {
      await questRepo.deleteStep(stepId);
      refresh();
    },
    [refresh]
  );

  const deleteQuest = useCallback(
    async (questId: number) => {
      await questRepo.deleteQuest(questId);
      refresh();
    },
    [refresh]
  );

  const deleteGoal = useCallback(
    async (goalId: number) => {
      await questRepo.deleteGoal(goalId);
      refresh();
    },
    [refresh]
  );

  return {
    goals,
    domains,
    filterDomain,
    filterStatus,
    setFilterDomain,
    setFilterStatus,
    refresh,
    createGoal,
    createQuest,
    createStep,
    completeStep,
    uncompleteStep,
    deleteStep,
    deleteQuest,
    deleteGoal,
  };
}
