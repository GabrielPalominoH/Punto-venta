import { useState, useMemo, useRef, useCallback } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
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
  const pdfRef = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPDF = useCallback(async () => {
    if (!detailSale) return;
    setPdfLoading(true);
    try {
      const el = pdfRef.current;
      if (!el) return;
      el.style.display = "block";
      await new Promise((r) => setTimeout(r, 100));
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      });
      el.style.display = "none";
      const imgData = canvas.toDataURL("image/png");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pw = 210;
      const ph = (canvas.height / canvas.width) * pw;
      doc.addImage(imgData, "PNG", 0, 0, pw, ph, undefined, "FAST");
      if (ph > 297) {
        let top = 297;
        while (top < ph) {
          doc.addPage();
          doc.addImage(imgData, "PNG", 0, -top, pw, ph, undefined, "FAST");
          top += 297;
        }
      }
      doc.save(`${detailSale.id}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
    }
    setPdfLoading(false);
  }, [detailSale]);

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
              <div className="relative">
                <select
                  value={filterMethod}
                  onChange={(e) => { setFilterMethod(e.target.value); setPage(1); }}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg text-sm py-2.5 pl-3 pr-10 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Todos los métodos</option>
                  {Object.entries(paymentLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-lg">expand_more</span>
              </div>
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
        <>
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-4 sm:py-8" onClick={() => setDetailSale(null)}>
            <div className="animate-[scaleIn_0.2s_ease-out] w-full max-w-[500px] mx-3 sm:mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white border border-[#c6c6cd] shadow-sm rounded-xl overflow-hidden" data-keep-white={true}>
                <div className="p-4 sm:p-6 border-b border-[#c6c6cd] bg-[#fcf8fa] flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex flex-col">
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#00687a", textTransform: "uppercase" }}>Documento Electrónico</span>
                    <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", color: "#000", marginTop: 4 }}>
                      Boleta de Venta
                    </h2>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#45464d", marginTop: 2 }}>R.U.C. 20601234567</p>
                  </div>
                  <div style={{ background: "#57dffe", border: "1px solid rgba(0,104,122,0.2)", borderRadius: 8, padding: "12px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#006172" }}>NÚMERO DE BOLETA</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 600, color: "#001f26", marginTop: 2 }}>{detailSale.id}</span>
                  </div>
                </div>

                <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#c6c6cd]">
                  <div className="space-y-2">
                    <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", textTransform: "uppercase" }}>Datos del Cliente</h3>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#00687a" }}>person</span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 600, color: "#1b1b1d" }}>{detailSale.customer || "Consumidor Final"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#00687a" }}>payments</span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#45464d" }}>{paymentLabels[detailSale.payment]?.label || "Efectivo"}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", textTransform: "uppercase" }}>Fecha de Emisión</h3>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#00687a" }}>calendar_today</span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 600, color: "#1b1b1d" }}>
                        {(() => { const p = detailSale.date?.split(", ") || []; return p[0] || detailSale.date })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#76777d" }}>schedule</span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#45464d" }}>
                        {(() => { const p = detailSale.date?.split(", ") || []; return p[1] || "" })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr style={{ background: "#f0edef" }}>
                        <th className="px-4 py-2" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd" }}>Descripción</th>
                        <th className="px-4 py-2 text-center" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd" }}>Cant.</th>
                        <th className="px-4 py-2 text-right" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd" }}>Unitario</th>
                        <th className="px-4 py-2 text-right" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody style={{ borderBottom: "1px solid #c6c6cd" }}>
                      {detailSale.items?.map((item, i) => (
                        <tr key={i} className="hover:bg-[#f6f3f5]" style={i % 2 ? { background: "#f6f3f5" } : {}}>
                          <td className="px-4 py-3">
                            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 600, color: "#1b1b1d" }}>{item.name}</p>
                          </td>
                          <td className="px-4 py-3 text-center" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#1b1b1d" }}>{item.qty}</td>
                          <td className="px-4 py-3 text-right" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#1b1b1d" }}>S/ {formatPrice(item.price)}</td>
                          <td className="px-4 py-3 text-right" style={{ fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 600, color: "#00687a" }}>S/ {formatPrice(item.price * item.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-6 bg-[#fcf8fa] flex justify-end border-t border-[#c6c6cd]">
                  <div style={{ width: 300 }} className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#45464d" }}>Subtotal</span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#1b1b1d" }}>S/ {formatPrice(detailSale.total)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-[#c6c6cd]">
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 700, color: "#000", textTransform: "uppercase", letterSpacing: "-0.01em" }}>Total a Pagar</span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 24, fontWeight: 700, color: "#00687a" }}>S/ {formatPrice(detailSale.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 text-center border-t border-[#c6c6cd] bg-white space-y-2" data-keep-white={true}>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 700, color: "#00687a", fontStyle: "italic" }}>¡Gracias por su compra!</p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#76777d" }}>Marlin Poseidon - Expertos en Pesca Deportiva &amp; Tackle Profesional</p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setDetailSale(null)}
                  className="flex-1 bg-white border border-outline-variant text-on-surface font-bold py-3 rounded-lg hover:bg-surface-container-highest transition-all text-sm"
                >
                  Cerrar
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={pdfLoading}
                  className="flex-1 bg-[#00687a] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">
                    {pdfLoading ? "hourglass_top" : "download"}
                  </span>
                  {pdfLoading ? "Generando..." : "Descargar PDF"}
                </button>
              </div>
            </div>
          </div>

          {/* Hidden A4 receipt for PDF capture */}
          <div
            ref={pdfRef}
            style={{
              position: "fixed",
              left: "-9999px",
              top: 0,
              width: 750,
              background: "#fff",
              fontFamily: "Inter, sans-serif",
              zIndex: -1,
              display: "none",
            }}
          >
            <div style={{ border: "1px solid #c6c6cd", overflow: "hidden" }}>
              <div style={{ padding: "20px 28px", borderBottom: "1px solid #c6c6cd", background: "#fcf8fa", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#00687a", textTransform: "uppercase" }}>Documento Electrónico</span>
                  <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", color: "#000", marginTop: 2 }}>Boleta de Venta</h2>
                  <p style={{ fontSize: 10, color: "#45464d", marginTop: 1 }}>R.U.C. 20601234567</p>
                </div>
                <div style={{ background: "#57dffe", border: "1px solid rgba(0,104,122,0.2)", borderRadius: 6, padding: "8px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#006172" }}>NÚMERO DE BOLETA</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#001f26", marginTop: 1 }}>{detailSale.id}</span>
                </div>
              </div>
              <div style={{ padding: "16px 28px", borderBottom: "1px solid #c6c6cd", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", textTransform: "uppercase", marginBottom: 6 }}>Datos del Cliente</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, color: "#00687a" }}>●</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b1d" }}>{detailSale.customer || "Consumidor Final"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, color: "#00687a" }}>●</span>
                    <span style={{ fontSize: 10, color: "#45464d" }}>{paymentLabels[detailSale.payment]?.label || "Efectivo"}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <h3 style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", textTransform: "uppercase", marginBottom: 6 }}>Fecha de Emisión</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, color: "#00687a" }}>●</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b1d" }}>
                      {(() => { const p = detailSale.date?.split(", ") || []; return p[0] || detailSale.date })()}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 14, color: "#76777d" }}>●</span>
                    <span style={{ fontSize: 10, color: "#45464d" }}>
                      {(() => { const p = detailSale.date?.split(", ") || []; return p[1] || "" })()}
                    </span>
                  </div>
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f0edef" }}>
                    <th style={{ padding: "8px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd" }}>Descripción</th>
                    <th style={{ padding: "8px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd", textAlign: "center" }}>Cant.</th>
                    <th style={{ padding: "8px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd", textAlign: "right" }}>Unitario</th>
                    <th style={{ padding: "8px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd", textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody style={{ borderBottom: "1px solid #c6c6cd" }}>
                  {detailSale.items?.map((item, i) => (
                    <tr key={i} style={i % 2 ? { background: "#f6f3f5" } : {}}>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#1b1b1d" }}>{item.name}</span>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontSize: 10, color: "#1b1b1d" }}>{item.qty}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: "#1b1b1d" }}>S/ {formatPrice(item.price)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#00687a" }}>S/ {formatPrice(item.price * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: "16px 28px", background: "#fcf8fa", borderTop: "1px solid #c6c6cd", display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: 300 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                    <span style={{ fontSize: 10, color: "#45464d" }}>Subtotal</span>
                    <span style={{ fontSize: 10, color: "#1b1b1d" }}>S/ {formatPrice(detailSale.total)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid #c6c6cd" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#000", textTransform: "uppercase", letterSpacing: "-0.01em" }}>Total a Pagar</span>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#00687a" }}>S/ {formatPrice(detailSale.total)}</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: "16px 28px", textAlign: "center", borderTop: "1px solid #c6c6cd", background: "#fff" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#00687a", fontStyle: "italic", margin: "0 0 4px" }}>¡Gracias por su compra!</p>
                <p style={{ fontSize: 10, color: "#76777d", margin: 0 }}>Marlin Poseidon - Expertos en Pesca Deportiva &amp; Tackle Profesional</p>
              </div>
            </div>
          </div>
        </>
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
