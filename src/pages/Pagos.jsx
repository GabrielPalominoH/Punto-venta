import { useState, useEffect } from "react";
import { db } from "../utils/db";

export default function Pagos() {
  const [data, setData] = useState(() => db.getOrders());
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    db.saveOrders(data);
  }, [data]);

  const filtered = data.filter((o) => {
    if (filter === "all") return true;
    return o.status === filter;
  });

  const handleApprove = (id) => {
    setData((prev) => prev.map((o) => (o.id === id ? { ...o, status: "approved" } : o)));
    const target = data.find((o) => o.id === id);
    if (target) {
      db.addActivity(
        "verified",
        "bg-secondary-container/20 text-secondary",
        `Pago verificado por <strong>Carlos M.</strong>`,
        `Pedido ${id} · Hace un momento`,
        `S/ ${target.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        "text-primary"
      );
    }
  };

  const handleReject = (id) => {
    setData((prev) => prev.map((o) => (o.id === id ? { ...o, status: "rejected" } : o)));
    const target = data.find((o) => o.id === id);
    if (target) {
      db.addActivity(
        "cancel",
        "bg-error/10 text-error",
        `Pago rechazado por <strong>Carlos M.</strong>`,
        `Pedido ${id} · Hace un momento`,
        `S/ ${target.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        "text-error"
      );
    }
  };

  const pending = data.filter((o) => o.status === "pending").length;
  const approved = data.filter((o) => o.status === "approved").length;
  const rejected = data.filter((o) => o.status === "rejected").length;

  const typeStyle = (type) =>
    type === "Delivery"
      ? "bg-secondary/10 text-secondary border border-secondary/20"
      : "bg-primary/10 text-primary border border-primary/20";

  const statusStyle = (status) => {
    switch (status) {
      case "approved":
        return { dot: "bg-secondary", text: "text-secondary", bg: "bg-secondary/10", label: "Aprobado" };
      case "rejected":
        return { dot: "bg-error", text: "text-error", bg: "bg-error/10", label: "Rechazado" };
      default:
        return { dot: "bg-amber-stock", text: "text-amber-stock", bg: "bg-amber-stock/10", label: "Pendiente" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-stock/10 border border-amber-stock/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-stock shrink-0">warning</span>
          <p className="font-semibold text-amber-stock text-sm sm:text-base">Recordatorio: Revisión masiva programada a las 5:00 PM</p>
        </div>
        <button className="text-amber-stock hover:underline text-xs font-bold uppercase shrink-0">Ver Detalles</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-outline-variant p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Pendientes</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-primary">{pending}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-container-high rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-outline fill">pending_actions</span>
          </div>
        </div>
        <div className="bg-white border border-outline-variant p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider">Aprobados (24H)</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-secondary">{approved}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-secondary fill">check_circle</span>
          </div>
        </div>
        <div className="bg-white border border-outline-variant p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider">Rechazados</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-error">{rejected}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-error/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-error fill">cancel</span>
          </div>
        </div>
        <div className="bg-white border border-outline-variant p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tiempo Promedio</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-primary">14m</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-container-high rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-outline fill">timer</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "Todos" },
              { key: "pending", label: "Pendientes" },
              { key: "approved", label: "Aprobados" },
              { key: "rejected", label: "Rechazados" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  filter === f.key
                    ? "bg-secondary text-on-secondary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-lg text-xs font-bold hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filtrar
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-lg text-xs font-bold hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-sm">download</span>
              Exportar
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <colgroup>
              <col style={{ width: "12%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th style={{ width: "12%" }} className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">ID Pedido</th>
                <th style={{ width: "25%" }} className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cliente</th>
                <th style={{ width: "15%" }} className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipo Entrega</th>
                <th style={{ width: "13%" }} className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Monto Total</th>
                <th style={{ width: "15%" }} className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Estado</th>
                <th style={{ width: "20%" }} className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((o) => {
                const st = statusStyle(o.status);
                return (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-bold truncate">{o.id}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-xs font-bold shrink-0">
                          {o.initials}
                        </div>
                        <span className="text-sm font-medium truncate">{o.client}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${typeStyle(o.type)}`}>
                        <span className="material-symbols-outlined text-sm">
                          {o.type === "Delivery" ? "local_shipping" : "store"}
                        </span>
                        {o.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold whitespace-nowrap truncate">S/ {o.amount.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {o.status === "pending" ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleApprove(o.id)} className="p-2 rounded-lg bg-secondary text-on-secondary hover:opacity-90 transition-colors shadow-sm" title="Aprobar">
                            <span className="material-symbols-outlined">check</span>
                          </button>
                          <button onClick={() => handleReject(o.id)} className="p-2 rounded-lg border border-outline-variant text-error hover:bg-error/10 transition-colors" title="Rechazar">
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <span className="material-symbols-outlined text-outline">remove_red_eye</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-on-surface-variant">
            Mostrando {filtered.length} de {data.length} resultados
          </p>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container transition-colors disabled:opacity-50">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-secondary text-on-secondary font-bold text-xs">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container text-xs transition-colors">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container text-xs transition-colors">3</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
