import { useState } from 'react';
import { QuestWithSteps } from '../../types/quest';
import { RPGCheckbox } from '../ui/RPGCheckbox';
import { RPGButton } from '../ui/RPGButton';
import { RPGInput, RPGSelect } from '../ui/RPGInput';
import styles from '../../styles/components/quests.module.css';

interface QuestCardProps {
  quest: QuestWithSteps;
  compact?: boolean;
  onCreateStep: (questId: number, title: string, priority?: string) => void;
  onCompleteStep: (stepId: number, questId: number, priority: string) => void;
  onUncompleteStep: (stepId: number) => void;
  onMissStep: (stepId: number) => void;
  onUnmissStep: (stepId: number) => void;
  onDeleteStep: (stepId: number) => void;
  onDeleteQuest: (questId: number) => void;
}

export function QuestCard({
  quest,
  compact = false,
  onCreateStep,
  onCompleteStep,
  onUncompleteStep,
  onMissStep,
  onUnmissStep,
  onDeleteStep,
  onDeleteQuest,
}: QuestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepPriority, setNewStepPriority] = useState('normal');

  const completedSteps = quest.steps.filter((s) => s.status === 'completed').length;
  const missedSteps = quest.steps.filter((s) => s.status === 'missed').length;
  const totalSteps = quest.steps.length;
  const isCompleted = quest.status === 'completed';
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const handleAddStep = () => {
    if (!newStepTitle.trim()) return;
    onCreateStep(quest.id, newStepTitle.trim(), newStepPriority);
    setNewStepTitle('');
    setNewStepPriority('normal');
  };

  const priorityColor = (p: string) =>
    p === 'legendary' ? 'var(--priority-legendary)' : p === 'important' ? 'var(--priority-important)' : 'var(--priority-normal)';

  return (
    <div className={`${styles.questCard} ${isCompleted ? styles.questCompleted : ''} ${compact ? styles.questCardCompact : ''}`}>
      <div className={styles.questCardHeader} onClick={() => setExpanded(!expanded)}>
        <div className={`${styles.questPriority} ${styles[quest.priority]}`} />
        <div className={styles.questHeaderContent}>
          <span className={styles.questTitle}>{quest.title}</span>
          {compact && (
            <div className={styles.questProgressInline}>
              <div className={styles.questProgressBarSmall}>
                <div
                  className={styles.questProgressFillSmall}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className={styles.questProgressTextSmall}>
                {completedSteps}/{totalSteps}
                {missedSteps > 0 && <span className={styles.missedCount}> ({missedSteps} ✗)</span>}
              </span>
            </div>
          )}
        </div>
        {!compact && (
          <span className={styles.questMeta}>
            <span className={styles.questStepCount}>
              {completedSteps}/{totalSteps}
            </span>
          </span>
        )}
        <div className={styles.questActions} onClick={(e) => e.stopPropagation()}>
          <RPGButton size="small" variant="danger" onClick={() => onDeleteQuest(quest.id)}>
            ×
          </RPGButton>
        </div>
        <span className={`${styles.expandIcon} ${expanded ? styles.expanded : ''}`}>▶</span>
      </div>

      {expanded && (
        <div className={styles.stepsSection}>
          <div className={styles.stepsList}>
            {quest.steps.map((step) => {
              const isMissed = step.status === 'missed';
              const stepCompleted = step.status === 'completed';
              const isPending = step.status === 'pending';

              return (
                <div key={step.id} className={`${styles.stepItem} ${isMissed ? styles.stepMissed : ''} ${compact ? styles.stepItemCompact : ''}`}>
                  <div
                    className={styles.stepPriorityDot}
                    style={{ background: priorityColor(step.priority) }}
                  />
                  {isMissed ? (
                    <span className={styles.missedLabel} onClick={() => onUnmissStep(step.id)}>
                      <span className={styles.missedIcon}>✗</span>
                      <span className={styles.missedText}>{step.title}</span>
                    </span>
                  ) : (
                    <RPGCheckbox
                      checked={stepCompleted}
                      onChange={(checked) => {
                        if (checked) {
                          onCompleteStep(step.id, quest.id, step.priority);
                        } else {
                          onUncompleteStep(step.id);
                        }
                      }}
                      label={step.title}
                    />
                  )}
                  <div className={styles.stepActions}>
                    {isPending && (
                      <RPGButton
                        size="small"
                        variant="ghost"
                        onClick={() => onMissStep(step.id)}
                        title="Mark as missed"
                        className={styles.missBtn}
                      >
                        ✗
                      </RPGButton>
                    )}
                    <RPGButton size="small" variant="danger" onClick={() => onDeleteStep(step.id)}>
                      ×
                    </RPGButton>
                  </div>
                </div>
              );
            })}
          </div>

          {!isCompleted && (
            <div className={`${styles.addStepRow} ${compact ? styles.addStepRowCompact : ''}`}>
              <div className={styles.addStepInput}>
                <RPGInput
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  placeholder="Add a step..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                />
              </div>
              {!compact && (
                <RPGSelect value={newStepPriority} onChange={(e) => setNewStepPriority(e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="legendary">Legendary</option>
                </RPGSelect>
              )}
              <RPGButton variant="primary" onClick={handleAddStep}>
                +
              </RPGButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
