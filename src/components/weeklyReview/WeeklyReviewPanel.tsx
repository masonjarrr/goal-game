import { useState, useEffect } from 'react';
import { WeeklyReview, WeeklySummaryData, WEEKLY_REVIEW_XP } from '../../types/weeklyReview';
import { RPGPanel } from '../ui/RPGPanel';
import { RPGButton } from '../ui/RPGButton';
import styles from '../../styles/components/weekly-review.module.css';

interface WeeklyReviewPanelProps {
  currentReview: WeeklyReview | null;
  loading?: boolean;
  onGenerateSummary: () => Promise<{ summary: WeeklySummaryData; review: WeeklyReview }>;
  onUpdateContent: (wins: string, challenges: string, priorities: string[], notes: string) => void;
  onCompleteReview: () => void;
  getSummaryFromReview: (review: WeeklyReview) => WeeklySummaryData;
  getPrioritiesFromReview: (review: WeeklyReview) => string[];
  getWeekStart: () => string;
}

export function WeeklyReviewPanel({
  currentReview,
  loading,
  onGenerateSummary,
  onUpdateContent,
  onCompleteReview,
  getSummaryFromReview,
  getPrioritiesFromReview,
  getWeekStart,
}: WeeklyReviewPanelProps) {
  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [priorities, setPriorities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [summaryData, setSummaryData] = useState<WeeklySummaryData | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (currentReview) {
      setWins(currentReview.wins);
      setChallenges(currentReview.challenges);
      setPriorities(getPrioritiesFromReview(currentReview));
      setNotes(currentReview.notes);
      setSummaryData(getSummaryFromReview(currentReview));
    }
  }, [currentReview, getSummaryFromReview, getPrioritiesFromReview]);

  const handleGenerate = async () => {
    setGenerating(true);
    const { summary } = await onGenerateSummary();
    setSummaryData(summary);
    setGenerating(false);
  };

  const handleAddPriority = () => {
    if (!newPriority.trim() || priorities.length >= 5) return;
    const updated = [...priorities, newPriority.trim()];
    setPriorities(updated);
    setNewPriority('');
    onUpdateContent(wins, challenges, updated, notes);
  };

  const handleRemovePriority = (index: number) => {
    const updated = priorities.filter((_, i) => i !== index);
    setPriorities(updated);
    onUpdateContent(wins, challenges, updated, notes);
  };

  const handleSave = () => {
    onUpdateContent(wins, challenges, priorities, notes);
  };

  const handleComplete = () => {
    handleSave();
    onCompleteReview();
  };

  const formatWeekRange = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  if (loading) {
    return (
      <RPGPanel header="Weekly Review">
        <div className={styles.emptyState}>Loading...</div>
      </RPGPanel>
    );
  }

  if (!currentReview && !summaryData) {
    return (
      <RPGPanel header="Weekly Review" glow>
        <div className={styles.weeklyReviewPanel}>
          <div className={styles.weekHeader}>
            <span className={styles.weekTitle}>This Week&apos;s Review</span>
            <span className={styles.weekDates}>{formatWeekRange(getWeekStart())}</span>
          </div>
          <div className={styles.emptyState}>
            <p>Generate your weekly summary to review your progress!</p>
            <RPGButton
              variant="primary"
              onClick={handleGenerate}
              disabled={generating}
              style={{ marginTop: 16 }}
            >
              {generating ? 'Generating...' : 'Generate Summary'}
            </RPGButton>
          </div>
        </div>
      </RPGPanel>
    );
  }

  const isCompleted = currentReview?.is_completed;

  return (
    <RPGPanel header="Weekly Review" glow>
      <div className={styles.weeklyReviewPanel}>
        <div className={styles.weekHeader}>
          <span className={styles.weekTitle}>Week of {currentReview?.week_start || getWeekStart()}</span>
          <span className={styles.weekDates}>
            {formatWeekRange(currentReview?.week_start || getWeekStart())}
          </span>
        </div>

        {isCompleted && (
          <div className={styles.completedBanner}>
            <span className={styles.completedIcon}>✓</span>
            Review Completed (+{currentReview?.xp_earned || WEEKLY_REVIEW_XP} XP)
          </div>
        )}

        {/* Summary Stats */}
        {summaryData && (
          <div className={styles.summaryGrid}>
            <SummaryCard icon="📋" value={summaryData.steps_completed} label="Steps" />
            <SummaryCard icon="✅" value={summaryData.quests_completed} label="Quests" />
            <SummaryCard icon="🎯" value={summaryData.goals_completed} label="Goals" highlight />
            <SummaryCard icon="💪" value={summaryData.buffs_activated} label="Buffs" />
            <SummaryCard icon="⭐" value={summaryData.xp_earned} label="XP Earned" highlight />
            <SummaryCard icon="🐉" value={summaryData.boss_damage_dealt} label="Boss Dmg" />
            <SummaryCard icon="🎯" value={summaryData.focus_sessions} label="Focus" />
            <SummaryCard icon="📅" value={summaryData.routines_completed} label="Routines" />
          </div>
        )}

        {/* Reflection Section */}
        <div className={styles.reflectionSection}>
          <div className={styles.reflectionField}>
            <label className={styles.reflectionLabel}>
              <span className={styles.reflectionIcon}>🏆</span>
              Wins This Week
            </label>
            <textarea
              className={styles.reflectionTextarea}
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              onBlur={handleSave}
              placeholder="What went well? What are you proud of?"
              disabled={isCompleted}
            />
          </div>

          <div className={styles.reflectionField}>
            <label className={styles.reflectionLabel}>
              <span className={styles.reflectionIcon}>🤔</span>
              Challenges & Learnings
            </label>
            <textarea
              className={styles.reflectionTextarea}
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              onBlur={handleSave}
              placeholder="What was difficult? What did you learn?"
              disabled={isCompleted}
            />
          </div>

          <div className={styles.reflectionField}>
            <label className={styles.reflectionLabel}>
              <span className={styles.reflectionIcon}>🎯</span>
              Priorities for Next Week (up to 5)
            </label>
            <div className={styles.prioritiesSection}>
              {!isCompleted && priorities.length < 5 && (
                <div className={styles.priorityInput}>
                  <input
                    type="text"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    placeholder="Add a priority..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPriority()}
                  />
                  <RPGButton size="small" onClick={handleAddPriority}>Add</RPGButton>
                </div>
              )}
              {priorities.length > 0 && (
                <div className={styles.priorityList}>
                  {priorities.map((priority, index) => (
                    <div key={index} className={styles.priorityItem}>
                      <span className={styles.priorityNumber}>{index + 1}.</span>
                      <span className={styles.priorityText}>{priority}</span>
                      {!isCompleted && (
                        <button
                          className={styles.removeBtn}
                          onClick={() => handleRemovePriority(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.reflectionField}>
            <label className={styles.reflectionLabel}>
              <span className={styles.reflectionIcon}>📝</span>
              Additional Notes
            </label>
            <textarea
              className={styles.reflectionTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSave}
              placeholder="Any other thoughts or notes..."
              disabled={isCompleted}
            />
          </div>
        </div>

        {!isCompleted && (
          <div className={styles.actions}>
            <RPGButton variant="ghost" onClick={handleGenerate} disabled={generating}>
              Refresh Summary
            </RPGButton>
            <RPGButton variant="primary" onClick={handleComplete}>
              Complete Review (+{WEEKLY_REVIEW_XP} XP)
            </RPGButton>
          </div>
        )}
      </div>
    </RPGPanel>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  highlight,
}: {
  icon: string;
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={`${styles.summaryCard} ${highlight ? styles.highlight : ''}`}>
      <span className={styles.summaryIcon}>{icon}</span>
      <span className={styles.summaryValue}>{value}</span>
      <span className={styles.summaryLabel}>{label}</span>
    </div>
  );
}
