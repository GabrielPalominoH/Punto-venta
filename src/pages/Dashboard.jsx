import { useNavigate } from "react-router-dom";
import { db } from "../utils/db";

export default function Dashboard() {
  const navigate = useNavigate();
  const products = db.getProducts();
  const sales = db.getSales();
  const orders = db.getOrders();
  const activities = db.getActivities().slice(0, 4);

  const todayStr = new Date().toLocaleDateString("es-PE");
  const todaySales = sales.filter((sale) => sale.date && sale.date.includes(todayStr));
  const totalTodaySales = todaySales.reduce((sum, sale) => sum + sale.total, 0);

  const dailyGoal = 15000;
  const percentCompleted = Math.min(100, Math.round((totalTodaySales / dailyGoal) * 100));

  const criticalProduct = products.reduce((lowest, current) => {
    if (!lowest) return current;
    return current.stock < lowest.stock ? current : lowest;
  }, null);

  const lowStockCount = products.filter((p) => p.stock <= db.getLowStockThreshold()).length;
  const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="w-full sm:w-auto">
          <h3 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">Hola, Carlos</h3>
          <p className="text-sm sm:text-base text-on-surface-variant">Bienvenido al centro de mando de Marlin Poseidon para hoy.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-outline-variant/30 rounded-xl p-4 sm:p-6 flex flex-col justify-between">
          <div className="mb-4">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">VENTAS DEL DÍA</span>
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                S/ {totalTodaySales.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-secondary font-bold text-sm sm:text-lg flex items-center">
                <span className="material-symbols-outlined text-lg sm:text-xl">trending_up</span>
                +{percentCompleted}% de la meta
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm sm:text-xl font-bold text-on-surface-variant uppercase tracking-wide">
              <span>Meta Diaria: S/ {dailyGoal.toLocaleString("en-US")}</span>
              <span>{percentCompleted}% Completado</span>
            </div>
            <div className="w-full bg-surface-container h-3 sm:h-4 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full transition-all duration-1000" style={{ width: `${percentCompleted}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-outline-variant/30 rounded-xl p-4 sm:p-6 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div className="bg-error-container/10 p-2 sm:p-3 rounded-lg text-error group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-error-container text-on-error-container px-2 sm:px-3 py-1 rounded-full">
              {lowStockCount} PRODUCTOS
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-sm sm:text-base text-on-surface-variant">Stock Crítico</h4>
            <span className="text-lg sm:text-2xl font-bold text-primary truncate block" title={criticalProduct ? `${criticalProduct.name} (${criticalProduct.stock} uds)` : "Todo en orden"}>
              {criticalProduct ? `${criticalProduct.name} (${criticalProduct.stock} uds)` : "Ninguno (Stock óptimo)"}
            </span>
          </div>
        </div>
        <div className="bg-white border border-outline-variant/30 rounded-xl p-4 sm:p-6 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div className="bg-secondary-container/10 p-2 sm:p-3 rounded-lg text-secondary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">local_shipping</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-secondary-container/20 text-on-secondary-container px-2 sm:px-3 py-1 rounded-full">
              {pendingOrdersCount} PENDIENTES
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-sm sm:text-base text-on-surface-variant">Pedidos por Enviar</h4>
            <span className="text-lg sm:text-2xl font-bold text-primary">
              {pendingOrdersCount > 0 ? `${pendingOrdersCount} pedidos por verificar` : "Sin pedidos pendientes"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 sm:pb-12">
        <div className="bg-white border border-outline-variant/30 rounded-xl flex flex-col">
          <div className="p-4 sm:p-6 border-b border-outline-variant/20 flex justify-between items-center">
            <h4 className="text-base sm:text-lg font-semibold text-primary">Actividad Reciente</h4>
            <button className="text-secondary text-xs font-bold uppercase tracking-wider hover:underline">VER TODO</button>
          </div>
          <div className="divide-y divide-outline-variant/20 overflow-y-auto max-h-[400px]" style={{ scrollbarWidth: "none" }}>
            {activities.map((a, i) => (
              <div key={i} className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4 hover:bg-surface-container-low transition-colors">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${a.iconBg}`}>
                  <span className="material-symbols-outlined text-base sm:text-lg">{a.icon}</span>
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm sm:text-base text-primary" dangerouslySetInnerHTML={{ __html: a.text }} />
                  <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider">{a.meta}</span>
                </div>
                {a.amount && (
                  <div className="text-right shrink-0">
                    <span className={`text-xs sm:text-sm font-bold ${a.amountClass}`}>{a.amount}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-high/40 border border-outline-variant/30 rounded-xl p-4 sm:p-6 flex flex-col flex-1">
            <h4 className="text-base sm:text-lg font-semibold text-primary mb-4">Acciones Rápidas</h4>
            <div className="flex flex-col items-center justify-center flex-1 gap-5 sm:gap-8">
              <div className="flex flex-col sm:flex-row justify-center gap-5 sm:gap-8 w-full max-w-[728px]">
                <button onClick={() => navigate("/inventario", { state: { openAddModal: true } })} className="flex flex-col items-center justify-center gap-1 bg-white border border-outline-variant/20 rounded-lg hover:border-secondary hover:text-secondary transition-all shrink-0 w-full sm:w-[340px] h-[100px] sm:h-[140px]">
                  <span className="material-symbols-outlined text-4xl sm:text-5xl">add_box</span>
                  <span className="text-[11px] sm:text-[13px] font-bold uppercase tracking-wider leading-tight text-center">NUEVO<br/>PRODUCTO</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-1 bg-white border border-outline-variant/20 rounded-lg hover:border-secondary hover:text-secondary transition-all shrink-0 w-full sm:w-[340px] h-[100px] sm:h-[140px]">
                  <span className="material-symbols-outlined text-4xl sm:text-5xl">file_download</span>
                  <span className="text-[11px] sm:text-[13px] font-bold uppercase tracking-wider leading-tight text-center">EXPORTAR<br/>REPORTE</span>
                </button>
              </div>
              <button className="flex items-center justify-center gap-1.5 bg-white border border-outline-variant/20 rounded-lg hover:border-secondary hover:text-secondary transition-all shrink-0 mx-auto w-full max-w-[728px] h-[100px] sm:h-[140px]">
                <span className="material-symbols-outlined text-4xl sm:text-5xl">support_agent</span>
                <span className="text-[14px] sm:text-[16px] font-bold uppercase tracking-wider">SOPORTE MARLIN</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
