import { useState, useMemo } from "react";
import { db } from "../utils/db";
import Combobox from "../components/Combobox";
import DatePicker from "../components/DatePicker";

function extractPerson(text) {
  const m = text.match(/<strong>([^<]+)<\/strong>/g);
  if (!m) return "";
  return m[m.length - 1].replace(/<\/?strong>/g, "");
}

export default function Auditoria() {
  const [activities] = useState(() => db.getActivities());
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [person, setPerson] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const personList = useMemo(() => {
    const names = new Set();
    activities.forEach((a) => {
      const p = extractPerson(a.text);
      if (p) names.add(p);
    });
    return ["Todos", ...Array.from(names).sort()];
  }, [activities]);

  const filtered = useMemo(() => {
    let list = activities;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.text?.toLowerCase().includes(q) ||
          a.meta?.toLowerCase().includes(q) ||
          a.amount?.toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      list = list.filter((a) => new Date(a.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((a) => new Date(a.date) <= to);
    }
    if (person && person !== "Todos") {
      list = list.filter((a) => extractPerson(a.text) === person);
    }
    return list;
  }, [activities, search, dateFrom, dateTo, person]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const safePage = Math.min(page, Math.max(totalPages, 1));
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">Registro de Auditoría</h2>
          <p className="text-sm sm:text-base text-on-surface-variant">
            Historial detallado de todas las operaciones y cambios realizados en el sistema.
          </p>
        </div>
      </div>

      <section className="audit-filter-panel bg-white border border-outline-variant rounded-xl shadow-sm">
        <div className="p-4 border-b border-outline-variant">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="audit-filter-control w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-3 text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                placeholder="Buscar en auditoría..."
              />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Desde</label>
              <DatePicker
                value={dateFrom}
                max={dateTo || today}
                onChange={(v) => {
                  setDateFrom(v); setPage(1);
                  if (dateTo && v > dateTo) setDateTo("");
                }}
                placeholder="Desde"
              />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Hasta</label>
              <DatePicker
                value={dateTo}
                min={dateFrom || undefined}
                max={today}
                onChange={(v) => { setDateTo(v); setPage(1); }}
                placeholder="Hasta"
              />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Responsable</label>
              <Combobox
                value={person}
                onChange={(v) => { setPerson(v); setPage(1); }}
                options={personList}
                placeholder="Todos"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-outline-variant">
          {paginated.length === 0 ? (
            <div className="px-6 py-16 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 block">history</span>
              <p className="font-semibold">No hay registros de auditoría</p>
              <p className="text-sm">Las actividades del sistema aparecerán aquí.</p>
            </div>
          ) : (
            paginated.map((item) => (
              <div key={item.id} className="flex items-start gap-4 px-4 sm:px-6 py-4 hover:bg-surface-container-low transition-colors">
                <div className={`w-10 h-10 rounded-full ${item.iconBg.includes("text") ? item.iconBg : `${item.iconBg} text-on-secondary`} flex items-center justify-center shrink-0 shadow-sm`}>
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="font-semibold text-sm text-primary leading-snug" dangerouslySetInnerHTML={{ __html: item.text }} />
                  <p className="text-xs text-on-surface-variant mt-0.5">{item.meta}</p>
                  {item.amount && (
                    <div className="inline-block mt-1.5 px-2.5 py-1 rounded-lg border border-outline-variant/30 text-xs bg-surface-container-low text-on-surface-variant">
                      Monto: {item.amount}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-outline shrink-0 pt-1.5">
                  {item.date ? new Date(item.date).toLocaleString("es-PE") : ""}
                </span>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm text-on-surface-variant">
              Mostrando {(safePage - 1) * PER_PAGE + 1}&ndash;{Math.min(safePage * PER_PAGE, filtered.length)} de {filtered.length} registros
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container text-primary"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-on-surface-variant select-none">&hellip;</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === safePage
                          ? "bg-secondary text-on-secondary"
                          : "hover:bg-surface-container text-primary"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container text-primary"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
