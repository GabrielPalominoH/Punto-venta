import { useState, useMemo } from "react";
import { db } from "../utils/db";

const paymentLabels = {
  cash: { label: "Efectivo", icon: "payments", color: "text-green-600" },
  yape: { label: "Yape/Plin", icon: "qr_code_2", color: "text-purple-600" },
};

const formatPrice = (n) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function HistorialVentas() {
  const [sales] = useState(() => db.getSales());
  const [filterMethod, setFilterMethod] = useState("all");
  const [search, setSearch] = useState("");
  const [detailSale, setDetailSale] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const todayStr = new Date().toLocaleDateString("es-PE");

  const metrics = useMemo(() => {
    const todaySales = sales.filter((s) => s.date && s.date.includes(todayStr));
    const totalToday = todaySales.reduce((sum, s) => sum + s.total, 0);
    const totalTrans = todaySales.length;
    const avg = totalTrans > 0 ? totalToday / totalTrans : 0;
    const methodCount = {};
    todaySales.forEach((s) => {
      const m = s.payment || "cash";
      methodCount[m] = (methodCount[m] || 0) + 1;
    });
    let dominantMethod = "cash";
    let dominantPct = 0;
    Object.entries(methodCount).forEach(([m, c]) => {
      if (c > dominantPct) {
        dominantPct = c;
        dominantMethod = m;
      }
    });
    const pct = totalTrans > 0 ? Math.round((dominantPct / totalTrans) * 100) : 0;
    return { totalToday, totalTrans, avg, dominantMethod, pct };
  }, [sales, todayStr]);

  const filtered = useMemo(() => {
    let list = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filterMethod !== "all") {
      list = list.filter((s) => s.payment === filterMethod);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.id?.toLowerCase().includes(q) ||
          s.customer?.toLowerCase().includes(q) ||
          s.items?.some((item) => item.name?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [sales, filterMethod, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  useMemo(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">Historial de Ventas</h2>
          <p className="text-sm sm:text-base text-on-surface-variant">
            Visualiza y exporta el registro detallado de todas tus operaciones.
          </p>
        </div>
        <button className="bg-secondary text-on-secondary px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0">
          <span className="material-symbols-outlined text-lg">download</span>
          Exportar Reporte
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-outline-variant rounded-xl p-4 sm:p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              INGRESOS TOTALES (HOY)
            </span>
            <span className="material-symbols-outlined text-secondary">payments</span>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">
              S/ {formatPrice(metrics.totalToday)}
            </p>
            <p className="text-xs sm:text-sm text-secondary font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              Promedio: S/ {formatPrice(metrics.avg)}
            </p>
          </div>
        </div>
        <div className="bg-white border border-outline-variant rounded-xl p-4 sm:p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              TRANSACCIONES
            </span>
            <span className="material-symbols-outlined text-secondary">shopping_cart</span>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">
              {metrics.totalTrans}
            </p>
            <p className="text-xs sm:text-sm text-on-surface-variant italic">
              {metrics.totalTrans > 0
                ? `Promedio: S/ ${formatPrice(metrics.avg)}`
                : "Sin ventas hoy"}
            </p>
          </div>
        </div>
        <div className="bg-white border border-outline-variant rounded-xl p-4 sm:p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              MÉTODO PREDOMINANTE
            </span>
            <span className="material-symbols-outlined text-secondary">credit_card</span>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">
              {paymentLabels[metrics.dominantMethod]?.label || "Efectivo"}
            </p>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {metrics.pct}% de las operaciones
            </p>
          </div>
        </div>
      </div>

      <section className="bg-white border border-outline-variant rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <span className="material-symbols-outlined text-on-surface-variant shrink-0">filter_list</span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1 w-full">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                MÉTODO DE PAGO
              </label>
              <select
                value={filterMethod}
                onChange={(e) => { setFilterMethod(e.target.value); setPage(1); }}
                className="w-full bg-white border border-outline-variant rounded-lg text-sm py-2 px-3 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
              >
                <option value="all">Todos los métodos</option>
                {Object.entries(paymentLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                BUSCAR
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full bg-white border border-outline-variant rounded-lg text-sm py-2 pl-10 pr-3 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  placeholder="Buscar por boleta, cliente o producto..."
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setFilterMethod("all"); setSearch(""); setPage(1); }}
                className="w-full bg-surface-container-high text-on-surface font-semibold text-sm py-2 rounded-lg hover:bg-outline-variant transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider">FECHA Y HORA</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">MONTO (S/)</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider">MÉTODO</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider">CLIENTE</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider">PRODUCTOS</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">ACCIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl mb-2 block">receipt_long</span>
                    <p className="font-semibold">No se encontraron ventas</p>
                    <p className="text-sm">Intente ajustar los filtros o realice una venta en Punto de Venta.</p>
                  </td>
                </tr>
              ) : (
                paged.map((sale, idx) => {
                  const pm = paymentLabels[sale.payment] || paymentLabels.cash;
                  const parts = sale.date?.split(", ") || [];
                  const datePart = parts[0] || sale.date;
                  const timePart = parts[1] || "";
                  const itemCount = sale.items?.length || 0;
                  return (
                    <tr
                      key={sale.id || idx}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary">{datePart}</span>
                          <span className="text-xs text-on-surface-variant">{timePart}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span className="text-sm font-bold text-secondary">
                          S/ {formatPrice(sale.total)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-lg ${pm.color}`}>{pm.icon}</span>
                          <span className="text-sm">{pm.label}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-on-surface-variant">
                        {sale.customer || "Consumidor Final"}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="bg-secondary/10 text-secondary px-2.5 py-1 rounded-full text-xs font-bold">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <button
                          onClick={() => setDetailSale(sale)}
                          className="material-symbols-outlined text-outline hover:text-secondary transition-colors"
                          title="Ver detalle"
                        >
                          visibility
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-surface-container-low border-t border-outline-variant">
          <span className="text-xs sm:text-sm text-on-surface-variant">
            Mostrando {filtered.length === 0 ? 0 : (page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} de {filtered.length} registros
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded-full hover:bg-surface-container-high transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                      page === pageNum
                        ? "bg-secondary text-on-secondary"
                        : "hover:bg-surface-container-high"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded-full hover:bg-surface-container-high transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {detailSale && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-4 sm:py-8" onClick={() => setDetailSale(null)}>
          <div className="animate-[scaleIn_0.2s_ease-out] w-full max-w-[520px] mx-3 sm:mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 sm:p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">DETALLE DE VENTA</span>
                  <h3 className="text-lg font-bold text-primary mt-1">{detailSale.id}</h3>
                </div>
                <button
                  onClick={() => setDetailSale(null)}
                  className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">CLIENTE</span>
                    <p className="text-sm font-semibold text-primary mt-1">{detailSale.customer || "Consumidor Final"}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">FECHA</span>
                    <p className="text-sm font-semibold text-primary mt-1">{detailSale.date}</p>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">MÉTODO DE PAGO</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`material-symbols-outlined ${paymentLabels[detailSale.payment]?.color || "text-green-600"}`}>
                      {paymentLabels[detailSale.payment]?.icon || "payments"}
                    </span>
                    <span className="text-sm font-semibold">
                      {paymentLabels[detailSale.payment]?.label || "Efectivo"}
                    </span>
                  </div>
                </div>
                <div className="border-t border-outline-variant pt-4">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">PRODUCTOS</span>
                  <div className="mt-2 space-y-2">
                    {detailSale.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-outline-variant/50 last:border-b-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold shrink-0">
                            {item.qty}
                          </span>
                          <span className="text-sm font-medium text-primary truncate">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-secondary shrink-0 ml-2">
                          S/ {formatPrice(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-outline-variant pt-4 flex justify-between items-center">
                  <span className="text-base font-bold text-primary">TOTAL</span>
                  <span className="text-xl font-bold text-secondary">
                    S/ {formatPrice(detailSale.total)}
                  </span>
                </div>
              </div>
              <div className="p-4 border-t border-outline-variant bg-surface-container-low flex gap-3">
                <button
                  onClick={() => setDetailSale(null)}
                  className="flex-1 bg-white border border-outline-variant text-on-surface font-bold py-2.5 rounded-lg hover:bg-surface-container-low transition-all text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
