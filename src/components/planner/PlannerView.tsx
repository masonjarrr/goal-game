import { useState } from 'react';
import { PlannerEvent, PlannerView as PlannerViewType } from '../../types/planner';
import { ReminderOption } from '../../types/notification';
import { formatDate, formatTime, getWeekDates, getMonthDates, getMonthName, today } from '../../utils/dates';
import { RPGPanel } from '../ui/RPGPanel';
import { RPGButton } from '../ui/RPGButton';
import { RPGCheckbox } from '../ui/RPGCheckbox';
import { RPGModal } from '../ui/RPGModal';
import { RPGInput, RPGTextarea } from '../ui/RPGInput';
import { ReminderPicker } from '../notifications/ReminderPicker';
import styles from '../../styles/components/planner.module.css';

interface PlannerViewProps {
  view: PlannerViewType;
  setView: (v: PlannerViewType) => void;
  currentDate: string;
  events: PlannerEvent[];
  onNavigate: (dir: number) => void;
  onGoToToday: () => void;
  onCreate: (
    title: string,
    date: string,
    description?: string,
    startTime?: string | null,
    endTime?: string | null,
    questId?: number | null,
    stepId?: number | null,
    reminderMinutes?: ReminderOption
  ) => void;
  notificationsEnabled?: boolean;
  defaultReminderMinutes?: number;
  onComplete: (id: number) => void;
  onUncomplete: (id: number) => void;
  onDelete: (id: number) => void;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6AM to 9PM

export function PlannerViewComponent({
  view,
  setView,
  currentDate,
  events,
  onNavigate,
  onGoToToday,
  onCreate,
  onComplete,
  onUncomplete,
  onDelete,
  notificationsEnabled = false,
  defaultReminderMinutes = 15,
}: PlannerViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(currentDate);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formReminder, setFormReminder] = useState<ReminderOption>(
    notificationsEnabled ? defaultReminderMinutes as ReminderOption : null
  );

  const handleCreate = () => {
    if (!formTitle.trim()) return;
    onCreate(
      formTitle.trim(),
      formDate,
      formDesc.trim(),
      formStartTime || null,
      formEndTime || null,
      null,
      null,
      formStartTime ? formReminder : null // Only include reminder if event has a start time
    );
    setFormTitle('');
    setFormDesc('');
    setFormStartTime('');
    setFormEndTime('');
    setFormReminder(notificationsEnabled ? defaultReminderMinutes as ReminderOption : null);
    setShowForm(false);
  };

  const openFormForDate = (date: string) => {
    setFormDate(date);
    setShowForm(true);
  };

  const d = new Date(currentDate + 'T00:00:00');

  let dateLabel = '';
  if (view === 'day') dateLabel = formatDate(currentDate);
  else if (view === 'week') {
    const wd = getWeekDates(currentDate);
    dateLabel = `${formatDate(wd[0])} — ${formatDate(wd[6])}`;
  } else {
    dateLabel = `${getMonthName(d.getMonth())} ${d.getFullYear()}`;
  }

  return (
    <div className={styles.planner}>
      <div className={styles.plannerToolbar}>
        <div className={styles.viewTabs}>
          {(['day', 'week', 'month'] as PlannerViewType[]).map((v) => (
            <button
              key={v}
              className={`${styles.viewTab} ${view === v ? styles.viewTabActive : ''}`}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>

        <div className={styles.dateNav}>
          <button className={styles.navArrow} onClick={() => onNavigate(-1)}>←</button>
          <span className={styles.dateLabel}>{dateLabel}</span>
          <button className={styles.navArrow} onClick={() => onNavigate(1)}>→</button>
        </div>

        <RPGButton size="small" variant="ghost" onClick={onGoToToday}>
          Today
        </RPGButton>
        <RPGButton variant="primary" onClick={() => openFormForDate(currentDate)}>
          + Event
        </RPGButton>
      </div>

      <RPGPanel>
        {view === 'day' && (
          <DayView
            date={currentDate}
            events={events}
            onComplete={onComplete}
            onUncomplete={onUncomplete}
            onDelete={onDelete}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onComplete={onComplete}
            onUncomplete={onUncomplete}
            onDelete={onDelete}
            onAddEvent={openFormForDate}
          />
        )}
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onAddEvent={openFormForDate}
          />
        )}
      </RPGPanel>

      {/* Event Form */}
      <RPGModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Event"
        actions={
          <>
            <RPGButton onClick={() => setShowForm(false)}>Cancel</RPGButton>
            <RPGButton variant="primary" onClick={handleCreate}>Create</RPGButton>
          </>
        }
      >
        <div className={styles.formGrid}>
          <RPGInput
            label="Title"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Event title..."
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <RPGInput
            label="Date"
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
          />
          <div className={styles.formRow}>
            <RPGInput
              label="Start Time"
              type="time"
              value={formStartTime}
              onChange={(e) => setFormStartTime(e.target.value)}
            />
            <RPGInput
              label="End Time"
              type="time"
              value={formEndTime}
              onChange={(e) => setFormEndTime(e.target.value)}
            />
          </div>
          <RPGTextarea
            label="Description (optional)"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="Event details..."
          />
          {formStartTime && notificationsEnabled && (
            <ReminderPicker
              value={formReminder}
              onChange={setFormReminder}
            />
          )}
        </div>
      </RPGModal>
    </div>
  );
}

// Day View
function DayView({
  date,
  events,
  onComplete,
  onUncomplete,
  onDelete,
}: {
  date: string;
  events: PlannerEvent[];
  onComplete: (id: number) => void;
  onUncomplete: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const scheduled = events.filter((e) => e.start_time);
  const unscheduled = events.filter((e) => !e.start_time);

  const getEventsForHour = (hour: number) => {
    return scheduled.filter((e) => {
      if (!e.start_time) return false;
      const h = parseInt(e.start_time.split(':')[0], 10);
      return h === hour;
    });
  };

  return (
    <div className={styles.dayView}>
      {HOURS.map((hour) => {
        const hourEvents = getEventsForHour(hour);
        return (
          <div key={hour} className={styles.timeSlot}>
            <span className={styles.timeLabel}>
              {hour % 12 || 12} {hour < 12 ? 'AM' : 'PM'}
            </span>
            <div className={styles.timeEvents}>
              {hourEvents.map((ev) => (
                <EventItem
                  key={ev.id}
                  event={ev}
                  onComplete={onComplete}
                  onUncomplete={onUncomplete}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}

      {unscheduled.length > 0 && (
        <div className={styles.unscheduledSection}>
          <div className={styles.unscheduledLabel}>Unscheduled</div>
          {unscheduled.map((ev) => (
            <EventItem
              key={ev.id}
              event={ev}
              onComplete={onComplete}
              onUncomplete={onUncomplete}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {events.length === 0 && (
        <div className={styles.emptyState}>No events for this day</div>
      )}
    </div>
  );
}

// Week View
function WeekView({
  currentDate,
  events,
  onComplete,
  onUncomplete,
  onDelete,
  onAddEvent,
}: {
  currentDate: string;
  events: PlannerEvent[];
  onComplete: (id: number) => void;
  onUncomplete: (id: number) => void;
  onDelete: (id: number) => void;
  onAddEvent: (date: string) => void;
}) {
  const weekDates = getWeekDates(currentDate);
  const todayStr = today();

  return (
    <div className={styles.weekGrid}>
      {weekDates.map((date, i) => {
        const dayEvents = events.filter((e) => e.date === date);
        const isToday = date === todayStr;
        const dayNum = new Date(date + 'T00:00:00').getDate();

        return (
          <div key={date} className={styles.weekDay}>
            <div className={`${styles.weekDayHeader} ${isToday ? styles.weekDayHeaderToday : ''}`}>
              {DAY_NAMES[i]}
              <span className={styles.weekDayDate}>{dayNum}</span>
            </div>
            <div className={styles.weekDayEvents}>
              {dayEvents.map((ev) => (
                <EventItem
                  key={ev.id}
                  event={ev}
                  small
                  onComplete={onComplete}
                  onUncomplete={onUncomplete}
                  onDelete={onDelete}
                />
              ))}
              <RPGButton size="small" variant="ghost" onClick={() => onAddEvent(date)} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                +
              </RPGButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Month View
function MonthView({
  currentDate,
  events,
  onAddEvent,
}: {
  currentDate: string;
  events: PlannerEvent[];
  onAddEvent: (date: string) => void;
}) {
  const d = new Date(currentDate + 'T00:00:00');
  const weeks = getMonthDates(d.getFullYear(), d.getMonth());
  const todayStr = today();

  return (
    <div>
      <div className={styles.monthGrid}>
        {DAY_NAMES.map((name) => (
          <div key={name} className={styles.monthDayHeader}>{name}</div>
        ))}
        {weeks.flat().map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className={`${styles.monthDay} ${styles.monthDayEmpty}`} />;
          }
          const dayEvents = events.filter((e) => e.date === date);
          const isToday = date === todayStr;
          const dayNum = new Date(date + 'T00:00:00').getDate();

          return (
            <div
              key={date}
              className={`${styles.monthDay} ${isToday ? styles.monthDayToday : ''}`}
              onClick={() => onAddEvent(date)}
            >
              <div className={styles.monthDayNumber}>{dayNum}</div>
              <div className={styles.monthDayEvents}>
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className={`${styles.eventItem} ${styles.eventItemSmall} ${ev.is_completed ? styles.eventItemCompleted : ''}`}
                  >
                    <span className={styles.eventTitle}>{ev.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className={styles.emptyState} style={{ padding: '2px', fontSize: '0.7rem' }}>
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Event Item
function EventItem({
  event,
  small,
  onComplete,
  onUncomplete,
  onDelete,
}: {
  event: PlannerEvent;
  small?: boolean;
  onComplete: (id: number) => void;
  onUncomplete: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className={`${styles.eventItem} ${small ? styles.eventItemSmall : ''} ${event.is_completed ? styles.eventItemCompleted : ''}`}>
      <RPGCheckbox
        checked={event.is_completed}
        onChange={(checked) => (checked ? onComplete(event.id) : onUncomplete(event.id))}
      />
      <span className={styles.eventTitle}>{event.title}</span>
      {event.start_time && !small && (
        <span className={styles.eventTime}>
          {formatTime(event.start_time)}
          {event.end_time && ` - ${formatTime(event.end_time)}`}
        </span>
      )}
      {(event.quest_id || event.step_id) && <span className={styles.eventLinked}>⚔</span>}
      {!small && (
        <div className={styles.eventActions}>
          <RPGButton size="small" variant="danger" onClick={() => onDelete(event.id)}>
            ×
          </RPGButton>
        </div>
      )}
    </div>
  );
}
