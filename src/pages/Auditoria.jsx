import { useState, useMemo } from "react";
import { db } from "../utils/db";

export default function Auditoria() {
  const [activities] = useState(() => db.getActivities());
  const [search, setSearch] = useState("");

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
    return list;
  }, [activities, search]);

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

      <section className="bg-white border border-outline-variant rounded-xl shadow-sm">
        <div className="p-4 border-b border-outline-variant">
          <div className="relative max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
              placeholder="Buscar en auditoría..."
            />
          </div>
        </div>
        <div className="divide-y divide-outline-variant">
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 block">history</span>
              <p className="font-semibold">No hay registros de auditoría</p>
              <p className="text-sm">Las actividades del sistema aparecerán aquí.</p>
            </div>
          ) : (
            filtered.map((item) => (
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
      </section>
    </div>
  );
}
