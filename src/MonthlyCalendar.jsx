import "./MonthlyCalendar.css";
import { useMemo, useState, useEffect } from "react";
import { t, getLang } from "./i18n";

/*
====================================================
UTILS
====================================================
*/

const toDayKey = (date) =>
  date.toLocaleDateString("en-CA");

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const start = new Date(firstDay);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  const end = new Date(lastDay);
  end.setDate(end.getDate() + (7 - ((end.getDay() + 6) % 7) - 1));

  const days = [];
  const cur = new Date(start);

  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  return days;
}

const isToday = (date) =>
  date.toDateString() === new Date().toDateString();



/*
====================================================
COMPONENT
====================================================
*/

export default function MonthlyCalendar({ reminders, onDaySelect, today }) {

const safeToday = today ?? new Date();

const getInitialMonth = () => {
  if (reminders.length === 0) {
    return new Date(
      safeToday.getFullYear(),
      safeToday.getMonth(),
      1
    );
  }

  const first = new Date(reminders[0].remind_at);
  return new Date(
    first.getFullYear(),
    first.getMonth(),
    1
  );
};


  const [currentMonth, setCurrentMonth] = useState(getInitialMonth);
  const [selectedDay, setSelectedDay] = useState(null);
  const [direction, setDirection] = useState(null);
  const [pendingMonth, setPendingMonth] = useState(null);

  // giorni con promemoria
  const daysWithReminders = useMemo(() => {
    const set = new Set();
    reminders.forEach((r) => {
      set.add(toDayKey(new Date(r.remind_at)));
    });
    return set;
  }, [reminders]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days = getMonthGrid(year, month);
  const lang = localStorage.getItem("lang") || getLang() || "it";

  // 👉 quando viene impostata una direzione, cambia mese nel frame successivo
  useEffect(() => {
    if (!pendingMonth) return;

    const t = setTimeout(() => {
      setCurrentMonth(pendingMonth);
      setPendingMonth(null);
    }, 20); // un frame circa

    return () => clearTimeout(t);
  }, [pendingMonth]);

  // reset animazione
  useEffect(() => {
    if (!direction) return;

    const t = setTimeout(() => {
      setDirection(null);
    }, 350);

    return () => clearTimeout(t);
  }, [direction]);

  return (
    <div className="monthly-calendar">
      <div className="calendar-header">
<button
  onClick={() => {
    navigator.vibrate?.(30);
    setDirection("prev");
    setPendingMonth(new Date(year, month - 1, 1));
  }}
>
  ◀
</button>

<strong>
  {currentMonth.toLocaleDateString(lang, {
    month: "long",
    year: "numeric"
  })}
</strong>

<button
  onClick={() => {
    navigator.vibrate?.(30);
    setDirection("next");
    setPendingMonth(new Date(year, month + 1, 1));
  }}
>
  ▶
</button>

      </div>

      <div className={`calendar-viewport ${direction ? `slide-${direction}` : ""}`}>
        <div className="calendar-grid">
          {[t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat"), t("sun")]
.map((d) => (
            <div key={d} className="calendar-weekday">
              {d}
            </div>
          ))}

          {days.map((day) => {
  const key = toDayKey(day);
  const isCurrentMonth = day.getMonth() === month;
  const hasReminder = daysWithReminders.has(key);
  const isTodayDay = isToday(day);

  return (
    <div
      key={key}
      className={`calendar-day
        ${isCurrentMonth ? "" : "outside"}
        ${selectedDay === key ? "selected" : ""}
        ${isTodayDay ? "today" : ""}
      `}
      aria-current={isTodayDay ? "date" : undefined}
      onClick={() => {
        if (!hasReminder) return;
        navigator.vibrate?.(15);
        setSelectedDay(key);
        onDaySelect?.(key);
      }}
    >
      <span className="day-number">{day.getDate()}</span>
      {hasReminder && <span className="day-dot">●</span>}
    </div>
  );
})}

        </div>
      </div>
    </div>
  );
}
