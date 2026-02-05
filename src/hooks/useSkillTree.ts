import { useState, useCallback, useEffect } from 'react';
import { SkillBranch, SkillNodeWithStatus } from '../types/skillTree';
import * as skillTreeRepo from '../db/repositories/skillTreeRepo';

interface UseSkillTreeOptions {
  totalXP: number;
}

export function useSkillTree({ totalXP }: UseSkillTreeOptions) {
  const [branches, setBranches] = useState<SkillBranch[]>([]);
  const [nodes, setNodes] = useState<SkillNodeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setBranches(skillTreeRepo.getSkillBranches());
    setNodes(skillTreeRepo.getSkillNodesWithStatus());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unlockSkill = useCallback(
    async (nodeId: number) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.unlocked || !node.can_unlock) return false;

      const xpSpent = skillTreeRepo.getTotalXpSpentOnSkills();
      const availableXp = totalXP - xpSpent;

      if (availableXp < node.xp_cost) return false;

      const success = await skillTreeRepo.unlockSkill(nodeId);
      if (success) {
        refresh();
      }
      return success;
    },
    [nodes, totalXP, refresh]
  );

  const getNodesByBranch = useCallback(
    (branchId: number) => {
      return nodes.filter((n) => n.branch_id === branchId);
    },
    [nodes]
  );

  const getUnlockedCount = useCallback(() => {
    return nodes.filter((n) => n.unlocked).length;
  }, [nodes]);

  const getTotalNodes = useCallback(() => {
    return nodes.length;
  }, [nodes]);

  const getStatBonuses = useCallback(() => {
    return skillTreeRepo.getSkillStatBonuses();
  }, []);

  const getAvailableXp = useCallback(() => {
    const xpSpent = skillTreeRepo.getTotalXpSpentOnSkills();
    return totalXP - xpSpent;
  }, [totalXP]);

  const getXpSpent = useCallback(() => {
    return skillTreeRepo.getTotalXpSpentOnSkills();
  }, []);

  return {
    branches,
    nodes,
    loading,
    refresh,
    unlockSkill,
    getNodesByBranch,
    getUnlockedCount,
    getTotalNodes,
    getStatBonuses,
    getAvailableXp,
    getXpSpent,
  };
}
