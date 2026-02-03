import { useState } from 'react';
import { QuestWithSteps } from '../../types/quest';
import { RPGCheckbox } from '../ui/RPGCheckbox';
import { RPGButton } from '../ui/RPGButton';
import { RPGInput, RPGSelect } from '../ui/RPGInput';
import styles from '../../styles/components/quests.module.css';

interface QuestCardProps {
  quest: QuestWithSteps;
  onCreateStep: (questId: number, title: string, priority?: string) => void;
  onCompleteStep: (stepId: number, questId: number, priority: string) => void;
  onUncompleteStep: (stepId: number) => void;
  onDeleteStep: (stepId: number) => void;
  onDeleteQuest: (questId: number) => void;
}

export function QuestCard({
  quest,
  onCreateStep,
  onCompleteStep,
  onUncompleteStep,
  onDeleteStep,
  onDeleteQuest,
}: QuestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepPriority, setNewStepPriority] = useState('normal');

  const completedSteps = quest.steps.filter((s) => s.status === 'completed').length;
  const totalSteps = quest.steps.length;
  const isCompleted = quest.status === 'completed';

  const handleAddStep = () => {
    if (!newStepTitle.trim()) return;
    onCreateStep(quest.id, newStepTitle.trim(), newStepPriority);
    setNewStepTitle('');
    setNewStepPriority('normal');
  };

  const priorityColor = (p: string) =>
    p === 'legendary' ? 'var(--priority-legendary)' : p === 'important' ? 'var(--priority-important)' : 'var(--priority-normal)';

  return (
    <div className={`${styles.questCard} ${isCompleted ? styles.questCompleted : ''}`}>
      <div className={styles.questCardHeader} onClick={() => setExpanded(!expanded)}>
        <div
          className={`${styles.questPriority} ${styles[quest.priority]}`}
        />
        <span className={styles.questTitle}>{quest.title}</span>
        <span className={styles.questMeta}>
          <span className={styles.questStepCount}>
            {completedSteps}/{totalSteps}
          </span>
          <RPGButton size="small" variant="danger" onClick={(e) => { e.stopPropagation(); onDeleteQuest(quest.id); }}>
            ×
          </RPGButton>
        </span>
        <span className={`${styles.expandIcon} ${expanded ? styles.expanded : ''}`}>▶</span>
      </div>

      {expanded && (
        <div className={styles.stepsSection}>
          <div className={styles.stepsList}>
            {quest.steps.map((step) => (
              <div key={step.id} className={styles.stepItem}>
                <div
                  className={styles.stepPriorityDot}
                  style={{ background: priorityColor(step.priority) }}
                />
                <RPGCheckbox
                  checked={step.status === 'completed'}
                  onChange={(checked) => {
                    if (checked) {
                      onCompleteStep(step.id, quest.id, step.priority);
                    } else {
                      onUncompleteStep(step.id);
                    }
                  }}
                  label={step.title}
                />
                <div className={styles.stepActions}>
                  <RPGButton size="small" variant="danger" onClick={() => onDeleteStep(step.id)}>
                    ×
                  </RPGButton>
                </div>
              </div>
            ))}
          </div>

          {!isCompleted && (
            <div className={styles.addStepRow}>
              <div className={styles.addStepInput}>
                <RPGInput
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  placeholder="Add a step..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                />
              </div>
              <RPGSelect value={newStepPriority} onChange={(e) => setNewStepPriority(e.target.value)}>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="legendary">Legendary</option>
              </RPGSelect>
              <RPGButton variant="primary" onClick={handleAddStep}>
                Add
              </RPGButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
