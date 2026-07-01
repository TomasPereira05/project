import type { TrainingSchedule } from "../api";

const weekdays = [1, 2, 3, 4, 5, 6, 7];
const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function overlaps(left: TrainingSchedule, right: TrainingSchedule) {
  return toMinutes(left.startTime) < toMinutes(right.endTime) && toMinutes(left.endTime) > toMinutes(right.startTime);
}

function colorIndex(schedule: TrainingSchedule) {
  return schedule.teamCategoryId % 5;
}

function buildHourMarks(schedules: TrainingSchedule[]) {
  const starts = schedules.map((schedule) => toMinutes(schedule.startTime));
  const ends = schedules.map((schedule) => toMinutes(schedule.endTime));
  const min = starts.length ? Math.min(...starts) : 18 * 60;
  const max = ends.length ? Math.max(...ends) : 22 * 60;
  const startHour = Math.max(7, Math.floor(min / 60));
  const endHour = Math.min(24, Math.ceil(max / 60));
  return Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);
}

type TrainingScheduleBoardProps = {
  schedules: TrainingSchedule[];
  dayLabel: (weekday: number) => string;
  compact?: boolean;
  onSelect?: (schedule: TrainingSchedule) => void;
};

export function TrainingScheduleBoard({ compact = false, dayLabel, onSelect, schedules }: TrainingScheduleBoardProps) {
  const visibleSchedules = compact ? schedules.filter((schedule) => schedule.active) : schedules;
  const hours = buildHourMarks(visibleSchedules);
  const startMinutes = hours[0] * 60;
  const endMinutes = hours[hours.length - 1] * 60;
  const totalMinutes = Math.max(60, endMinutes - startMinutes);

  return (
    <div className={compact ? "admin-schedule-board admin-schedule-board-compact" : "admin-schedule-board"}>
      <div className="admin-schedule-body">
        <div className="admin-schedule-hours">
          <div className="admin-schedule-corner" />
          <div className="admin-schedule-hours-track">
            {hours.map((hour, index) => {
              const top = (index / Math.max(1, hours.length - 1)) * 100;
              const transform = index === 0 ? "translateY(0)" : index === hours.length - 1 ? "translateY(-100%)" : "translateY(-50%)";

              return (
                <span key={hour} style={{ top: `${top}%`, transform }}>
                  {String(hour).padStart(2, "0")}:00
                </span>
              );
            })}
          </div>
        </div>

        <div className="admin-schedule-grid" style={{ ["--schedule-hour-count" as string]: hours.length - 1 }}>
          {weekdays.map((weekday) => {
            const daySchedules = visibleSchedules.filter((schedule) => schedule.weekday === weekday);

            return (
              <section className="admin-schedule-day" key={weekday}>
                <div className="admin-schedule-day-label">{dayLabel(weekday)}</div>
                <div className="admin-schedule-day-track">
                  {hours.map((hour, index) => (
                    <span
                      className="admin-schedule-hour-line"
                      key={hour}
                      style={{ top: `${(index / Math.max(1, hours.length - 1)) * 100}%` }}
                    />
                  ))}
                  {daySchedules.map((schedule) => {
                    const concurrentSchedules = daySchedules
                      .filter((candidate) => overlaps(schedule, candidate))
                      .sort((left, right) => left.startTime.localeCompare(right.startTime) || left.trainingScheduleId - right.trainingScheduleId);
                    const columnCount = Math.min(3, Math.max(1, concurrentSchedules.length));
                    const columnIndex = Math.max(0, concurrentSchedules.findIndex((candidate) => candidate.trainingScheduleId === schedule.trainingScheduleId)) % columnCount;
                    const top = clamp(((toMinutes(schedule.startTime) - startMinutes) / totalMinutes) * 100, 0, 100);
                    const height = clamp(((toMinutes(schedule.endTime) - toMinutes(schedule.startTime)) / totalMinutes) * 100, 5, 100 - top);

                    return (
                      <button
                        className={`admin-schedule-block admin-schedule-block-${colorIndex(schedule)}${schedule.active ? "" : " admin-schedule-block-inactive"}`}
                        key={schedule.trainingScheduleId}
                        onClick={() => onSelect?.(schedule)}
                        style={{
                          height: `${height}%`,
                          left: `calc(${(columnIndex * 100) / columnCount}% + 0.5rem)`,
                          right: "auto",
                          top: `${top}%`,
                          width: `calc(${100 / columnCount}% - 0.75rem)`,
                        }}
                        type="button"
                      >
                        <strong>{schedule.teamLabel}</strong>
                        <span>{schedule.startTime} - {schedule.endTime}</span>
                        <small>
                          {schedule.fieldName}
                          {schedule.fieldZone ? ` · ${schedule.fieldZone}` : ""}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { weekdays, dayKeys };
