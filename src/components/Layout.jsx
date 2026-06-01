import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ConfigModal from "./ConfigModal";
import "../App.css";

const navItems = [
  { section: "Principal" },
  { to: "/", icon: "dashboard", label: "Dashboard" },
  { to: "/punto-venta", icon: "point_of_sale", label: "Punto de Venta" },
  { section: "Gestión" },
  { to: "/inventario", icon: "inventory_2", label: "Inventario" },
  { to: "/historial-ventas", icon: "receipt_long", label: "Historial de Ventas" },
  { to: "/pagos", icon: "payments", label: "Verificación de Pagos" },
  { section: "Administración" },
  { to: "/usuarios", icon: "group", label: "Usuarios" },
  { to: "/auditoria", icon: "history", label: "Auditoría" },
];

const notifications = [
  { id: 1, icon: "inventory_2", title: "Stock bajo: Leader Lures", desc: "Quedan 3 unidades", time: "Hace 10 min", urgent: true },
  { id: 2, icon: "payments", title: "Pago pendiente de revisión", desc: "Yape S/ 120.00 — Juan Pérez", time: "Hace 25 min", urgent: true },
  { id: 3, icon: "check_circle", title: "Venta completada", desc: "Boleta BOLETA-28-05-2026-0012", time: "Hace 1 h", urgent: false },
  { id: 4, icon: "group", title: "Nuevo usuario registrado", desc: "Lucía García — Vendedor", time: "Hace 2 h", urgent: false },
  { id: 5, icon: "inventory_2", title: "Stock bajo: Mojarra Jig", desc: "Quedan 2 unidades", time: "Hace 3 h", urgent: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showNotif, setShowNotif] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifSeen, setNotifSeen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const notifRef = useRef(null);
  const sidebarRef = useRef(null);

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "CM";

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (sidebarRef.current && !sidebarRef.current.contains(e.target) && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const urgentCount = notifications.filter((n) => n.urgent).length;
  const searchValue = searchParams.get("q") || "";
  const isSearchablePage = location.pathname === "/punto-venta";

  const handleSearchChange = (value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const sidebar = (
    <aside ref={sidebarRef} className="fixed left-0 top-0 h-screen w-[260px] bg-surface border-r border-outline-variant flex flex-col py-6 px-3 overflow-y-auto z-50">
      <div className="mb-8 px-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
          <span className="material-symbols-outlined text-on-primary fill">sailing</span>
        </div>
        <div>
          <h1 className="text-primary font-bold text-lg tracking-tight leading-tight">Marlin Poseidon</h1>
          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-semibold">Admin Dashboard</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item, i) =>
          item.section ? (
            <p key={item.section} className={`px-3 text-[10px] font-bold text-outline uppercase tracking-widest ${i > 0 ? "mt-5" : "mt-0"}`}>
              {item.section}
            </p>
          ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 text-sm ${
                isActive
                  ? "text-secondary font-bold bg-secondary/10 border-r-4 border-secondary rounded-r-none"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
          )
        )}
      </nav>
      <div className="mt-auto pt-4 border-t border-outline-variant space-y-2">
        <div className="flex items-center gap-3 px-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant bg-surface-container-high flex items-center justify-center text-sm font-bold text-on-surface-variant">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{user?.name}</p>
            <p className="text-xs text-on-surface-variant">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/login", { replace: true }); }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-all"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 w-[260px] z-50 transition-transform duration-300 lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <button onClick={() => setSidebarOpen(false)} className="absolute top-3 right-3 z-[60] p-1.5 hover:bg-surface-container-high rounded-lg transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
        {sidebar}
      </div>

      <div className="flex-1 flex flex-col min-h-screen lg:ml-[260px]">
        <header className="sticky top-0 z-30 h-16 bg-surface border-b border-outline-variant shadow-sm flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-1 sm:gap-3 flex-1 max-w-md">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">menu</span>
            </button>
            <div className={`relative w-full ${showMobileSearch ? "block" : "hidden sm:block"}`}>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                placeholder={isSearchablePage ? "Buscar productos..." : "Buscar..."}
                type="text"
              />
            </div>
            <button onClick={() => setShowMobileSearch(p => !p)} className="sm:hidden p-2 hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">{showMobileSearch ? "close" : "search"}</span>
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 relative" ref={notifRef}>
            <button onClick={() => { setShowNotif((p) => !p); if (!showNotif) setNotifSeen(true); }} className="hover:bg-surface-container-low p-2 rounded-full transition-all hover:scale-110 active:scale-95 relative">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
              {urgentCount > 0 && !notifSeen && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface px-1">
                  {urgentCount}
                </span>
              )}
            </button>
            {showNotif && (
              <div className="fixed sm:absolute top-14 right-2 sm:right-4 w-[calc(100vw-16px)] sm:w-[380px] max-w-[380px] bg-white rounded-xl shadow-xl border border-outline-variant overflow-hidden z-50">
                <div className="px-4 sm:px-5 py-4 border-b border-outline-variant flex items-center justify-between">
                  <h3 className="text-sm font-bold text-on-surface">Notificaciones</h3>
                  <span className="text-xs text-on-surface-variant">{notifSeen ? "0 sin leer" : `${notifications.length} sin leer`}</span>
                </div>
                <div className="max-h-[360px] overflow-y-auto overscroll-contain">
                  {notifications.map((n) => (
                    <div key={n.id} className={`flex items-start gap-3 px-4 sm:px-5 py-3.5 border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors ${n.urgent ? "bg-error/5" : ""}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${n.urgent ? "bg-error/10 text-error" : "bg-secondary/10 text-secondary"}`}>
                        <span className="material-symbols-outlined text-lg">{n.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{n.title}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{n.desc}</p>
                        <p className="text-[11px] text-outline mt-1">{n.time}</p>
                      </div>
                      {n.urgent && <span className="w-2 h-2 rounded-full bg-error shrink-0 mt-1.5"></span>}
                    </div>
                  ))}
                </div>
                <div className="px-4 sm:px-5 py-3 border-t border-outline-variant bg-surface-container-low">
                  <button className="text-xs font-semibold text-secondary w-full text-center hover:underline">
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            )}
            <button onClick={() => setShowConfig(true)} className="hover:bg-surface-container-low hover:scale-110 active:scale-95 p-2 rounded-full transition-all">
              <span className="material-symbols-outlined text-on-surface-variant">settings</span>
            </button>
          </div>
        </header>
        {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
