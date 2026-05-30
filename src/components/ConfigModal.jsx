import { useState } from "react";
import { db } from "../utils/db";

const tabs = [
  { id: "general", icon: "person", label: "General" },
  { id: "seguridad", icon: "lock", label: "Seguridad" },
  { id: "apariencia", icon: "palette", label: "Apariencia" },
  { id: "inventario", icon: "inventory_2", label: "Inventario" },
  { id: "notificaciones", icon: "notifications", label: "Notificaciones" },
];

export default function ConfigModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("general");
  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.classList.contains("dark")
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    () => db.getLowStockThreshold()
  );

  const toggleTheme = (isDark) => {
    const root = document.documentElement;
    root.classList.add("theme-transitioning");
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    setDarkMode(isDark);
    setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(19,27,46,0.4)] backdrop-blur-sm p-4 sm:p-6 lg:p-8" onClick={onClose}>
      <div className="bg-surface-container-lowest w-[896px] h-[680px] rounded-xl overflow-hidden flex flex-col border border-outline-variant shadow-[0_12px_24px_-10px_rgba(0,104,122,0.15)]" onClick={(e) => e.stopPropagation()}>
        <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">account_circle</span>
            <h2 className="text-lg sm:text-xl font-semibold text-primary">Configuración del Sistema</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-outline hover:text-error transition-colors rounded-lg hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <nav className="w-48 sm:w-56 border-r border-outline-variant bg-surface-container-low p-3 sm:p-4 space-y-1 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 sm:px-4 py-2.5 rounded-lg flex items-center gap-2.5 text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-surface-container-highest text-secondary font-bold"
                    : "text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
            {activeTab === "general" && (
              <section>
                <h3 className="text-[10px] sm:text-xs font-bold text-outline uppercase tracking-wider mb-3 sm:mb-4">Foto de Perfil</h3>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 sm:p-5 bg-surface-container rounded-xl border border-outline-variant">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-secondary shadow-md flex items-center justify-center bg-surface-container-high text-2xl font-bold text-on-surface-variant">
                      CM
                    </div>
                    <div className="absolute inset-0 bg-primary/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="material-symbols-outlined text-on-primary text-2xl">photo_camera</span>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3 text-center sm:text-left">
                    <div>
                      <p className="text-base sm:text-lg font-semibold text-primary">Carlos Méndez</p>
                      <p className="text-xs sm:text-sm text-on-surface-variant">Actualiza tu foto para que los colegas te identifiquen.</p>
                    </div>
                    <div className="flex gap-2 justify-center sm:justify-start">
                      <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary text-on-secondary rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
                        Cambiar Foto
                      </button>
                      <button className="px-3 sm:px-4 py-1.5 sm:py-2 border border-outline-variant text-on-surface-variant rounded-lg text-sm font-semibold hover:bg-surface-container-highest transition-all">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "seguridad" && (
              <section className="space-y-3 sm:space-y-4">
                <h3 className="text-[10px] sm:text-xs font-bold text-outline uppercase tracking-wider mb-3 sm:mb-4">Cambiar Contraseña</h3>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-semibold text-on-surface">Contraseña Actual</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-3 sm:px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-semibold text-on-surface">Nueva Contraseña</label>
                      <input
                        type="password"
                        placeholder="Mín. 8 caracteres"
                        className="w-full px-3 sm:px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-semibold text-on-surface">Confirmar Contraseña</label>
                      <input
                        type="password"
                        placeholder="Repite la contraseña"
                        className="w-full px-3 sm:px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button className="px-4 sm:px-6 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm">
                    Actualizar Contraseña
                  </button>
                </div>
              </section>
            )}

            {activeTab === "apariencia" && (
              <section className="space-y-3 sm:space-y-4">
                <h3 className="text-[10px] sm:text-xs font-bold text-outline uppercase tracking-wider mb-3 sm:mb-4">Tema de la Interfaz</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => toggleTheme(false)}
                    className={`p-4 sm:p-5 border-2 rounded-xl flex flex-col items-center gap-3 transition-all hover:scale-[1.02] ${
                      !darkMode
                        ? "border-secondary bg-surface-bright"
                        : "border-outline-variant bg-surface-container-low"
                    }`}
                  >
                    <div className="w-full h-16 sm:h-20 bg-slate-50 border border-slate-200 rounded flex flex-col p-2 gap-1 overflow-hidden">
                      <div className="h-2 w-1/2 bg-slate-200 rounded"></div>
                      <div className="h-full w-full bg-white rounded shadow-sm" data-keep-white={true}></div>
                    </div>
                    <span className="text-sm font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-lg">light_mode</span>
                      Tema Claro
                    </span>
                  </button>
                  <button
                    onClick={() => toggleTheme(true)}
                    className={`p-4 sm:p-5 border-2 rounded-xl flex flex-col items-center gap-3 transition-all hover:scale-[1.02] ${
                      darkMode
                        ? "border-secondary bg-[#1a1a1a]"
                        : "border-outline-variant"
                    }`}
                  >
                    <div className="w-full h-16 sm:h-20 bg-slate-900 border border-slate-800 rounded flex flex-col p-2 gap-1 overflow-hidden">
                      <div className="h-2 w-1/2 bg-slate-700 rounded"></div>
                      <div className="h-full w-full bg-slate-800 rounded shadow-sm"></div>
                    </div>
                    <span className={`text-sm font-bold flex items-center gap-1.5 ${darkMode ? "text-white" : "text-on-surface-variant"}`}>
                      <span className="material-symbols-outlined text-lg">dark_mode</span>
                      Tema Oscuro
                    </span>
                  </button>
                </div>
              </section>
            )}

            {activeTab === "inventario" && (
              <section className="space-y-3 sm:space-y-4">
                <h3 className="text-[10px] sm:text-xs font-bold text-outline uppercase tracking-wider mb-3 sm:mb-4">Alertas de Inventario</h3>
                <div className="p-4 sm:p-5 bg-surface-container rounded-xl border border-outline-variant space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-primary">Umbral de Stock Bajo</label>
                    <p className="text-xs text-on-surface-variant">Define la cantidad mínima de unidades a partir de la cual un producto se marca como "Stock bajo".</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="number" min="0"
                      className="w-28 px-3 sm:px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-center font-bold text-lg"
                      value={lowStockThreshold === "" ? "" : lowStockThreshold}
                      onChange={(e) => {
                        const v = e.target.value;
                        const parsed = v === "" ? "" : parseInt(v, 10);
                        setLowStockThreshold(parsed);
                        if (parsed !== "" && !isNaN(parsed)) {
                          db.saveLowStockThreshold(parsed);
                        }
                      }}
                    />
                    <span className="text-sm text-on-surface-variant">unidades</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="material-symbols-outlined text-amber-stock text-lg">info</span>
                    <p className="text-xs text-amber-stock">Los productos con stock igual o menor a este número se mostrarán con el estado "Stock bajo" en el POS y en el inventario.</p>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "notificaciones" && (
              <section className="space-y-3 sm:space-y-4">
                <h3 className="text-[10px] sm:text-xs font-bold text-outline uppercase tracking-wider mb-3 sm:mb-4">Preferencias de Notificación</h3>
                <div className="space-y-3">
                  {[
                    { id: "stock", label: "Alertas de Stock Bajo", desc: "Notificar cuando un producto llegue al mínimo de inventario" },
                    { id: "ventas", label: "Resumen de Ventas", desc: "Reporte diario de ventas al cierre del día" },
                    { id: "usuarios", label: "Actividad de Usuarios", desc: "Notificar cuando un nuevo usuario se registre o cambie de rol" },
                    { id: "pagos", label: "Verificación de Pagos", desc: "Alertas cuando haya pagos pendientes por revisar" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 bg-surface-container rounded-xl border border-outline-variant">
                      <div>
                        <p className="text-sm font-semibold text-primary">{item.label}</p>
                        <p className="text-xs text-on-surface-variant">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-9 h-5 bg-outline-variant rounded-full peer peer-checked:bg-secondary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <footer className="px-4 sm:px-6 py-2.5 sm:py-3 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
          <p className="text-xs sm:text-sm text-on-surface-variant flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            Última sincronización: Hace 2 minutos
          </p>
          <span className="text-outline text-[10px] sm:text-xs italic">Versión 2.4.1-Nautical</span>
        </footer>
      </div>
    </div>
  );
}
