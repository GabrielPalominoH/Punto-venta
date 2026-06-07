import { useState } from "react";
import { db } from "../utils/db";

const tabs = [
  { id: "general", icon: "person", label: "General" },
  { id: "seguridad", icon: "lock", label: "Seguridad" },
  { id: "apariencia", icon: "palette", label: "Apariencia" },
  { id: "personalizacion", icon: "brand_awareness", label: "Personalización" },
  { id: "categorias", icon: "category", label: "Categorías" },
  { id: "notificaciones", icon: "notifications", label: "Notificaciones" },
];

const logoIcons = [
  "storefront", "store", "shopping_cart", "point_of_sale",
  "inventory_2", "dashboard", "receipt_long", "payments",
  "group", "settings", "history", "category",
  "admin_panel_settings", "business", "travel_explore",
  "directions_boat", "anchor", "waves", "sailing",
  "kayaking", "compass_calibration",
];

const presetColors = [
  "#00687a", "#0d9488", "#2563eb", "#7c3aed", "#db2777",
  "#dc2626", "#ea580c", "#d97706", "#65a30d", "#000000",
];

export default function ConfigModal({ onClose, onBrandingChange }) {
  const [activeTab, setActiveTab] = useState("general");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("marlin_theme") === "dark" || document.documentElement.classList.contains("dark")
  );
  const [categories, setCategories] = useState(() => db.getCategories());
  const [branding, setBranding] = useState(() => db.getBranding());
  const [newCategory, setNewCategory] = useState("");
  const [editingCat, setEditingCat] = useState(null);
  const [editCatValue, setEditCatValue] = useState("");

  const toggleTheme = (isDark) => {
    const root = document.documentElement;
    root.classList.add("theme-transitioning");
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    setDarkMode(isDark);
    localStorage.setItem("marlin_theme", isDark ? "dark" : "light");
    setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 300);
  };

  const saveBranding = (updated) => {
    setBranding(updated);
    db.saveBranding(updated);
    if (onBrandingChange) onBrandingChange(updated);
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
                    className={`relative p-4 sm:p-5 border-2 rounded-xl flex flex-col items-center gap-3 transition-all hover:scale-[1.02] ${
                      !darkMode
                        ? "border-secondary bg-secondary/10 ring-2 ring-secondary/30 shadow-md"
                        : "border-outline-variant bg-surface-container-low"
                    }`}
                  >
                    {!darkMode && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    )}
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
                    className={`relative p-4 sm:p-5 border-2 rounded-xl flex flex-col items-center gap-3 transition-all hover:scale-[1.02] ${
                      darkMode
                        ? "border-secondary bg-secondary/20 ring-2 ring-secondary/40 shadow-md"
                        : "border-outline-variant"
                    }`}
                  >
                    {darkMode && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    )}
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

            {activeTab === "personalizacion" && (
              <section className="space-y-3 sm:space-y-4">
                <h3 className="text-[10px] sm:text-xs font-bold text-outline uppercase tracking-wider mb-3 sm:mb-4">Logo del Sistema</h3>

                <div className="pt-1">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Tipo de Logo</h4>
                  <div className="flex gap-2 mb-4">
                    {["icon", "url", "image"].map((type) => (
                      <button
                        key={type}
                        onClick={() => saveBranding({ ...branding, logoType: type })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          branding.logoType === type
                            ? "bg-secondary text-on-secondary border-secondary"
                            : "border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {type === "icon" ? "Icono" : type === "url" ? "URL" : "Imagen"}
                      </button>
                    ))}
                  </div>

                  {branding.logoType === "icon" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: branding.logoColor }}
                        >
                          <span className="material-symbols-outlined text-white text-lg">{branding.logoIcon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-on-surface">Vista previa</p>
                          <p className="text-[10px] text-outline">Selecciona un icono y color</p>
                        </div>
                        <label className="relative w-8 h-8 rounded-full border border-outline-variant overflow-hidden cursor-pointer shrink-0">
                          <input
                            type="color"
                            value={branding.logoColor}
                            onChange={(e) => saveBranding({ ...branding, logoColor: e.target.value })}
                            className="absolute inset-0 w-full h-full cursor-pointer border-0 p-0"
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {presetColors.map((c) => (
                          <button
                            key={c}
                            onClick={() => saveBranding({ ...branding, logoColor: c })}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              branding.logoColor === c ? "border-secondary scale-110" : "border-transparent"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] font-semibold text-outline uppercase tracking-wider mt-3 mb-1.5">Iconos</p>
                      <div className="flex flex-wrap gap-1.5">
                        {logoIcons.map((icon) => (
                          <button
                            key={icon}
                            onClick={() => saveBranding({ ...branding, logoIcon: icon })}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                              branding.logoIcon === icon
                                ? "bg-secondary text-on-secondary ring-2 ring-secondary"
                                : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">{icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {branding.logoType === "url" && (
                    <div className="space-y-2">
                      <input
                        value={branding.logoUrl}
                        onChange={(e) => saveBranding({ ...branding, logoUrl: e.target.value })}
                        placeholder="https://ejemplo.com/logo.png"
                        className="w-full px-3 sm:px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                      />
                      {branding.logoUrl && (
                        <div className="w-16 h-16 rounded-lg border border-outline-variant overflow-hidden bg-surface-container-high flex items-center justify-center">
                          <img
                            src={branding.logoUrl}
                            alt="Logo preview"
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => { e.target.style.display = "none"; e.target.parentElement.innerHTML = '<span class="material-symbols-outlined text-outline">broken_image</span>'; }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {branding.logoType === "image" && (
                    <div className="space-y-2">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low cursor-pointer hover:bg-surface-container-high transition-all text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-lg">upload</span>
                        {branding.logoImage ? "Cambiar imagen" : "Subir imagen"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              saveBranding({ ...branding, logoImage: ev.target?.result });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {branding.logoImage && (
                        <div className="w-16 h-16 rounded-lg border border-outline-variant overflow-hidden bg-surface-container-high flex items-center justify-center">
                          <img
                            src={branding.logoImage}
                            alt="Logo preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                      {branding.logoImage && (
                        <button
                          onClick={() => saveBranding({ ...branding, logoImage: "" })}
                          className="text-xs text-error hover:underline"
                        >
                          Eliminar imagen
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}


            {activeTab === "categorias" && (
              <section className="space-y-3 sm:space-y-4">
                <h3 className="text-[10px] sm:text-xs font-bold text-outline uppercase tracking-wider mb-3 sm:mb-4">Gestión de Categorías</h3>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nueva categoría..."
                    className="flex-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCategory.trim()) {
                        const updated = [...categories, newCategory.trim()];
                        setCategories(updated);
                        db.saveCategories(updated);
                        setNewCategory("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (!newCategory.trim()) return;
                      const updated = [...categories, newCategory.trim()];
                      setCategories(updated);
                      db.saveCategories(updated);
                      setNewCategory("");
                    }}
                    className="px-4 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-bold hover:opacity-90 transition-all shrink-0"
                  >
                    Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat} className="flex items-center justify-between p-3 bg-surface-container rounded-xl border border-outline-variant">
                      {editingCat === cat ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            value={editCatValue}
                            onChange={(e) => setEditCatValue(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm focus:ring-2 focus:ring-secondary/20 outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && editCatValue.trim()) {
                                const updated = categories.map((c) => c === cat ? editCatValue.trim() : c);
                                setCategories(updated);
                                db.saveCategories(updated);
                                setEditingCat(null);
                              }
                              if (e.key === "Escape") setEditingCat(null);
                            }}
                          />
                          <button
                            onClick={() => {
                              if (!editCatValue.trim()) return;
                              const updated = categories.map((c) => c === cat ? editCatValue.trim() : c);
                              setCategories(updated);
                              db.saveCategories(updated);
                              setEditingCat(null);
                            }}
                            className="p-1.5 text-secondary hover:bg-surface-container-low rounded-lg"
                          >
                            <span className="material-symbols-outlined text-lg">check</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-outline text-lg">category</span>
                            <span className="text-sm font-semibold text-primary">{cat}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setEditingCat(cat); setEditCatValue(cat); }}
                              className="p-1.5 text-outline hover:text-secondary hover:bg-surface-container-low rounded-lg"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => {
                                if (categories.length <= 1) return;
                                const updated = categories.filter((c) => c !== cat);
                                setCategories(updated);
                                db.saveCategories(updated);
                              }}
                              className="p-1.5 text-outline hover:text-error hover:bg-surface-container-low rounded-lg"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
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
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-outline rounded-full peer peer-checked:bg-secondary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm after:border after:border-outline-variant peer-checked:after:translate-x-5 peer-checked:after:border-secondary peer-checked:after:bg-on-secondary"></div>
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
