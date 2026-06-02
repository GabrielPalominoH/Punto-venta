import { useState, useRef, useEffect } from "react";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"
];
const DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

function getCalendarGrid(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const grid = [];
  let day = 1;
  for (let i = 0; i < 6; i++) {
    const row = [];
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < first) {
        row.push(null);
      } else if (day > total) {
        row.push(null);
      } else {
        row.push(day);
        day++;
      }
    }
    grid.push(row);
    if (day > total) break;
  }
  return grid;
}

export default function DatePicker({ value, onChange, min, max, className = "", placeholder = "Seleccionar fecha" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : today.getMonth());

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const grid = getCalendarGrid(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const select = (day) => {
    const d = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (onChange) onChange(d);
    setOpen(false);
  };

  const display = parsed
    ? parsed.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">calendar_today</span>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`audit-filter-control w-full flex items-center justify-between gap-2 bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-3 text-sm transition-all cursor-pointer hover:border-secondary/40 focus:ring-2 focus:ring-secondary/20 focus:border-secondary ${
          value ? "text-primary" : "text-on-surface-variant"
        }`}
      >
        <span className="truncate">{display || placeholder}</span>
        <span className={`material-symbols-outlined text-outline text-lg transition-transform ${open ? "rotate-180" : ""}`}>date_range</span>
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl overflow-hidden animate-[comboboxIn_0.15s_ease-out] origin-top p-3">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <span className="text-sm font-semibold text-primary">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] text-on-surface-variant font-semibold py-1">{d}</div>
            ))}
          </div>

          {grid.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7">
              {row.map((day, ci) => {
                if (!day) return <div key={ci} />;
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = dateStr === value;
                const isToday = dateStr === todayStr;
                const isDisabled = (min && dateStr < min) || (max && dateStr > max);
                return (
                  <button
                    key={ci}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => select(day)}
                    className={`w-9 h-9 rounded-lg text-sm transition-colors mx-auto flex items-center justify-center ${
                      isSelected
                        ? "bg-secondary text-on-secondary font-bold"
                        : isToday
                        ? "text-secondary font-bold"
                        : "text-primary hover:bg-surface-container"
                    } ${isDisabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
