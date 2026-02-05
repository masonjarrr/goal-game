import { useState } from 'react';
import { RoutineWithSteps, RoutineStepWithStatus, RoutineType } from '../../types/routine';
import { RPGPanel } from '../ui/RPGPanel';
import { RPGButton } from '../ui/RPGButton';
import { RPGModal } from '../ui/RPGModal';
import { RPGInput, RPGTextarea, RPGSelect } from '../ui/RPGInput';
import styles from '../../styles/components/routines.module.css';

interface RoutinePanelProps {
  routines: RoutineWithSteps[];
  loading?: boolean;
  onCreateRoutine: (name: string, type: RoutineType, description: string, bonusXp: number) => void;
  onDeleteRoutine: (routineId: number) => void;
  onStartRoutine: (routineId: number) => void;
  onCompleteStep: (routineId: number, stepId: number) => void;
  onSkipStep: (routineId: number, stepId: number) => void;
  onAddStep: (routineId: number, title: string, description: string, linkedBuffId: number | null, durationMinutes: number, isOptional: boolean) => void;
  onDeleteStep: (stepId: number) => void;
  getStepsWithStatus: (routineId: number) => RoutineStepWithStatus[];
}

export function RoutinePanel({
  routines,
  loading,
  onCreateRoutine,
  onDeleteRoutine,
  onStartRoutine,
  onCompleteStep,
  onSkipStep,
  onAddStep,
  onDeleteStep,
  getStepsWithStatus,
}: RoutinePanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<number | null>(null);

  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<RoutineType>('morning');
  const [formDesc, setFormDesc] = useState('');
  const [formBonusXp, setFormBonusXp] = useState(25);

  const resetForm = () => {
    setFormName('');
    setFormType('morning');
    setFormDesc('');
    setFormBonusXp(25);
  };

  const handleCreate = () => {
    if (!formName.trim()) return;
    onCreateRoutine(formName.trim(), formType, formDesc.trim(), formBonusXp);
    resetForm();
    setShowCreateForm(false);
  };

  const morningRoutines = routines.filter(r => r.type === 'morning');
  const eveningRoutines = routines.filter(r => r.type === 'evening');
  const customRoutines = routines.filter(r => r.type === 'custom');

  if (loading) {
    return (
      <RPGPanel header="Routines">
        <div className={styles.emptyState}>Loading routines...</div>
      </RPGPanel>
    );
  }

  return (
    <div className={styles.routinePanel}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <RPGButton variant="primary" onClick={() => { resetForm(); setShowCreateForm(true); }}>
          + New Routine
        </RPGButton>
      </div>

      {routines.length === 0 ? (
        <RPGPanel header="Routines">
          <div className={styles.emptyState}>
            No routines yet. Create your first morning or evening routine!
          </div>
        </RPGPanel>
      ) : (
        <>
          {morningRoutines.length > 0 && (
            <RPGPanel header="Morning Routines">
              <div className={styles.routineGrid}>
                {morningRoutines.map((routine) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    stepsWithStatus={getStepsWithStatus(routine.id)}
                    onStart={() => onStartRoutine(routine.id)}
                    onCompleteStep={(stepId) => onCompleteStep(routine.id, stepId)}
                    onSkipStep={(stepId) => onSkipStep(routine.id, stepId)}
                    onEdit={() => setEditingRoutineId(routine.id)}
                    onDelete={() => onDeleteRoutine(routine.id)}
                  />
                ))}
              </div>
            </RPGPanel>
          )}

          {eveningRoutines.length > 0 && (
            <RPGPanel header="Evening Routines">
              <div className={styles.routineGrid}>
                {eveningRoutines.map((routine) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    stepsWithStatus={getStepsWithStatus(routine.id)}
                    onStart={() => onStartRoutine(routine.id)}
                    onCompleteStep={(stepId) => onCompleteStep(routine.id, stepId)}
                    onSkipStep={(stepId) => onSkipStep(routine.id, stepId)}
                    onEdit={() => setEditingRoutineId(routine.id)}
                    onDelete={() => onDeleteRoutine(routine.id)}
                  />
                ))}
              </div>
            </RPGPanel>
          )}

          {customRoutines.length > 0 && (
            <RPGPanel header="Custom Routines">
              <div className={styles.routineGrid}>
                {customRoutines.map((routine) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    stepsWithStatus={getStepsWithStatus(routine.id)}
                    onStart={() => onStartRoutine(routine.id)}
                    onCompleteStep={(stepId) => onCompleteStep(routine.id, stepId)}
                    onSkipStep={(stepId) => onSkipStep(routine.id, stepId)}
                    onEdit={() => setEditingRoutineId(routine.id)}
                    onDelete={() => onDeleteRoutine(routine.id)}
                  />
                ))}
              </div>
            </RPGPanel>
          )}
        </>
      )}

      {/* Create Routine Modal */}
      <RPGModal
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create Routine"
        actions={
          <>
            <RPGButton onClick={() => setShowCreateForm(false)}>Cancel</RPGButton>
            <RPGButton variant="primary" onClick={handleCreate}>Create</RPGButton>
          </>
        }
      >
        <div className={styles.formSection}>
          <RPGInput label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Morning Power-Up" />
          <div className={styles.formRow}>
            <RPGSelect label="Type" value={formType} onChange={(e) => setFormType(e.target.value as RoutineType)}>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="custom">Custom</option>
            </RPGSelect>
            <RPGInput label="Bonus XP" type="number" value={formBonusXp} onChange={(e) => setFormBonusXp(Number(e.target.value))} min={0} max={200} />
          </div>
          <RPGTextarea label="Description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Describe this routine..." />
        </div>
      </RPGModal>

      {/* Edit Routine Modal */}
      {editingRoutineId && (
        <RoutineEditor
          routine={routines.find(r => r.id === editingRoutineId)!}
          onClose={() => setEditingRoutineId(null)}
          onAddStep={onAddStep}
          onDeleteStep={onDeleteStep}
        />
      )}
    </div>
  );
}

function RoutineCard({
  routine,
  stepsWithStatus,
  onStart,
  onCompleteStep,
  onSkipStep,
  onEdit,
  onDelete,
}: {
  routine: RoutineWithSteps;
  stepsWithStatus: RoutineStepWithStatus[];
  onStart: () => void;
  onCompleteStep: (stepId: number) => void;
  onSkipStep: (stepId: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isStarted = routine.todayLog !== undefined;
  const isCompleted = routine.todayLog?.is_completed || false;
  const completedCount = stepsWithStatus.filter(s => s.is_completed).length;
  const totalCount = stepsWithStatus.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={`${styles.routineCard} ${styles[routine.type]} ${isCompleted ? styles.completed : ''}`}>
      <div className={styles.routineHeader}>
        <div className={styles.routineInfo}>
          <div className={styles.routineName}>{routine.name}</div>
          <span className={`${styles.routineType} ${styles[routine.type]}`}>
            {routine.type === 'morning' ? '🌅' : routine.type === 'evening' ? '🌙' : '📋'} {routine.type}
          </span>
        </div>
        {routine.streak && routine.streak.current_streak > 0 && (
          <div className={styles.routineStreak}>
            🔥 {routine.streak.current_streak} day{routine.streak.current_streak !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {routine.description && <div className={styles.routineDesc}>{routine.description}</div>}

      {isStarted && (
        <div className={styles.routineProgress}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressText}>{completedCount}/{totalCount}</span>
        </div>
      )}

      {isStarted && stepsWithStatus.length > 0 && (
        <div className={styles.stepsList}>
          {stepsWithStatus.map((step) => (
            <div
              key={step.id}
              className={`${styles.stepItem} ${step.is_completed ? styles.completed : ''} ${step.skipped ? styles.skipped : ''} ${step.is_optional ? styles.optional : ''}`}
            >
              <div
                className={`${styles.stepCheckbox} ${step.is_completed ? styles.checked : ''}`}
                onClick={() => !step.is_completed && !step.skipped && !isCompleted && onCompleteStep(step.id)}
              >
                {step.is_completed && '✓'}
              </div>
              <div className={styles.stepInfo}>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepMeta}>
                  <span className={styles.stepDuration}>⏱️ {step.duration_minutes}m</span>
                  {step.is_optional && <span className={styles.optionalBadge}>Optional</span>}
                </div>
              </div>
              {!step.is_completed && !step.skipped && !isCompleted && step.is_optional && (
                <RPGButton size="small" variant="ghost" onClick={() => onSkipStep(step.id)}>
                  Skip
                </RPGButton>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={styles.routineActions}>
        {!isStarted && routine.steps.length > 0 && (
          <RPGButton variant="primary" onClick={onStart}>
            Start Routine
          </RPGButton>
        )}
        {isCompleted && (
          <span style={{ color: 'var(--buff-color)', fontFamily: 'var(--font-heading)' }}>
            ✓ Completed Today (+{routine.todayLog?.xp_earned || routine.bonus_xp} XP)
          </span>
        )}
        <div style={{ flex: 1 }} />
        <RPGButton size="small" variant="ghost" onClick={onEdit}>
          Edit
        </RPGButton>
        <RPGButton size="small" variant="danger" onClick={onDelete}>
          Delete
        </RPGButton>
      </div>
    </div>
  );
}

function RoutineEditor({
  routine,
  onClose,
  onAddStep,
  onDeleteStep,
}: {
  routine: RoutineWithSteps;
  onClose: () => void;
  onAddStep: (routineId: number, title: string, description: string, linkedBuffId: number | null, durationMinutes: number, isOptional: boolean) => void;
  onDeleteStep: (stepId: number) => void;
}) {
  const [stepTitle, setStepTitle] = useState('');
  const [stepDesc, setStepDesc] = useState('');
  const [stepDuration, setStepDuration] = useState(5);
  const [stepOptional, setStepOptional] = useState(false);

  const handleAddStep = () => {
    if (!stepTitle.trim()) return;
    onAddStep(routine.id, stepTitle.trim(), stepDesc.trim(), null, stepDuration, stepOptional);
    setStepTitle('');
    setStepDesc('');
    setStepDuration(5);
    setStepOptional(false);
  };

  return (
    <RPGModal
      open={true}
      onClose={onClose}
      title={`Edit: ${routine.name}`}
      actions={<RPGButton onClick={onClose}>Done</RPGButton>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className={styles.formSection}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--text-gold)' }}>Add Step</h4>
          <RPGInput label="Step Title" value={stepTitle} onChange={(e) => setStepTitle(e.target.value)} placeholder="e.g., Drink water" />
          <div className={styles.formRow}>
            <RPGInput label="Duration (min)" type="number" value={stepDuration} onChange={(e) => setStepDuration(Number(e.target.value))} min={1} max={120} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
              <input type="checkbox" checked={stepOptional} onChange={(e) => setStepOptional(e.target.checked)} />
              <label>Optional</label>
            </div>
          </div>
          <RPGButton variant="primary" onClick={handleAddStep}>Add Step</RPGButton>
        </div>

        {routine.steps.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 12px', color: 'var(--text-gold)' }}>Current Steps</h4>
            <div className={styles.stepsList}>
              {routine.steps.map((step, index) => (
                <div key={step.id} className={`${styles.stepItem} ${step.is_optional ? styles.optional : ''}`}>
                  <span style={{ color: 'var(--text-dim)', minWidth: 24 }}>{index + 1}.</span>
                  <div className={styles.stepInfo}>
                    <div className={styles.stepTitle}>{step.title}</div>
                    <div className={styles.stepMeta}>
                      <span className={styles.stepDuration}>⏱️ {step.duration_minutes}m</span>
                      {step.is_optional && <span className={styles.optionalBadge}>Optional</span>}
                    </div>
                  </div>
                  <RPGButton size="small" variant="danger" onClick={() => onDeleteStep(step.id)}>
                    Remove
                  </RPGButton>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RPGModal>
  );
}
