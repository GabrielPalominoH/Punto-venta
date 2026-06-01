import { useState, useRef, useEffect } from "react";

export default function Combobox({ value, onChange, options, placeholder = "Seleccionar", disabled, className = "" }) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const ref = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) { setFocusIdx(-1); return }
    setFocusIdx(options.findIndex((o) => o === value));
  }, [open, options, value]);

  useEffect(() => {
    if (!listRef.current || focusIdx < 0) return;
    const el = listRef.current.children[focusIdx];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [focusIdx]);

  const select = (opt) => {
    onChange(opt);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { setOpen(false); return }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); setFocusIdx(0); return }
      setFocusIdx((prev) => (prev < options.length - 1 ? prev + 1 : 0));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); setFocusIdx(options.length - 1); return }
      setFocusIdx((prev) => (prev > 0 ? prev - 1 : options.length - 1));
    }
    if (e.key === "Enter" && open && focusIdx >= 0) {
      e.preventDefault();
      select(options[focusIdx]);
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={`w-full flex items-center justify-between gap-2 bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-3 pr-3 text-sm transition-all ${
          !disabled ? "cursor-pointer hover:border-secondary/40 focus:ring-2 focus:ring-secondary/20 focus:border-secondary" : "opacity-50 cursor-not-allowed"
        } ${value ? "text-primary" : "text-on-surface-variant"}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <span className={`material-symbols-outlined text-outline text-lg transition-transform ${open ? "rotate-180" : ""}`}>expand_more</span>
      </button>
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 left-0 right-0 mt-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl overflow-hidden animate-[comboboxIn_0.15s_ease-out] origin-top max-h-56 overflow-y-auto"
        >
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-on-surface-variant text-center">Sin opciones</div>
          ) : (
            options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => select(opt)}
                onMouseEnter={() => setFocusIdx(i)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                  opt === value
                    ? "bg-secondary/10 text-secondary font-bold"
                    : focusIdx === i
                    ? "bg-surface-container text-primary"
                    : "text-primary hover:bg-surface-container"
                }`}
              >
                {opt === value && (
                  <span className="material-symbols-outlined text-secondary text-lg">check</span>
                )}
                <span className={opt === value ? "" : "pl-8"}>{opt}</span>
              </button>
            ))
          )}
        </div>
      )}
      <style>{`
        @keyframes comboboxIn {
          from { transform: translateY(-4px) scale(0.97); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
