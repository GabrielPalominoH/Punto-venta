import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { db } from "../utils/db";

export default function Usuarios() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(() => db.getUsers());
  const [menuOpen, setMenuOpen] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);

  const roles = ["Admin", "Operador", "Inventario"];

  useEffect(() => {
    db.saveUsers(users);
  }, [users]);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(null);
        setRoleTarget(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleEnabled = (username) => {
    setUsers((prev) => prev.map((u) => u.username === username ? { ...u, enabled: !u.enabled } : u));
    setMenuOpen(null);
  };

  const changeRole = (username, role) => {
    setUsers((prev) => prev.map((u) => u.username === username ? { ...u, role } : u));
    setRoleTarget(null);
    setMenuOpen(null);
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleStyle = (role) => {
    switch (role) {
      case "Admin":
        return "bg-secondary/10 text-secondary border border-secondary/20";
      case "Operador":
        return "bg-[#0b1c30]/10 text-[#0b1c30] border border-[#0b1c30]/20";
      default:
        return "bg-gray-100 text-on-surface-variant border border-gray-200";
    }
  };

  const avatarStyle = (initials) => {
    if (initials === "CM" || initials === "EV") return "bg-secondary/20 text-secondary";
    if (initials === "AL" || initials === "MS") return "bg-[#0b1c30]/20 text-[#0b1c30]";
    return "bg-surface-container-high text-on-surface-variant";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div className="w-full sm:w-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Gestión de Usuarios</h2>
          <p className="text-sm sm:text-base text-on-surface-variant">Administra el acceso del personal y monitorea la actividad del sistema.</p>
        </div>
        <button className="bg-secondary text-on-secondary px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold flex items-center gap-2 shadow-md hover:opacity-90 transition-all active:scale-95 shrink-0">
          <span className="material-symbols-outlined">person_add</span>
          Añadir Usuario
        </button>
      </div>

              <div className="grid grid-cols-1 gap-6">
        <section className="col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
            <div className="px-4 py-4 border-b border-outline-variant bg-surface-bright flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-auto sm:min-w-[240px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  placeholder="Buscar usuarios..."
                />
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">filter_list</span>
                </button>
                <button className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">download</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Username</th>
                    <th className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Rol</th>
                    <th className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Último Acceso</th>
                    <th className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filtered.map((u) => (
                    <tr key={u.username} className={`transition-colors group ${u.enabled === false ? "opacity-60" : "hover:bg-surface-container-low/50"}`}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${avatarStyle(u.initials)} flex items-center justify-center font-bold shrink-0`}>
                            {u.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-primary truncate">{u.name}</p>
                            <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-on-surface">{u.username}</td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter ${roleStyle(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-bold flex items-center gap-1 ${u.enabled === false ? "text-rose-stock" : "text-green-600"}`}>
                          <span className={`w-2 h-2 rounded-full ${u.enabled === false ? "bg-rose-stock" : "bg-green-500"}`}></span>
                          {u.enabled === false ? "Deshabilitado" : "Activo"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant whitespace-nowrap">{u.lastAccess}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative inline-flex">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              setMenuOpen(menuOpen === u.username ? null : u.username);
                              setRoleTarget(null);
                            }}
                            className="p-2 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-surface-container-high transition-all rounded-lg"
                          >
                            <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
                          </button>
                          {menuOpen === u.username && createPortal(
                            <div ref={menuRef} className="bg-white border border-outline-variant rounded-lg shadow-xl min-w-[180px] py-1" style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 100 }} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleEnabled(u.username); }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                              >
                                <span className="material-symbols-outlined text-base">{u.enabled === false ? "check_circle" : "cancel"}</span>
                                {u.enabled === false ? "Habilitar" : "Deshabilitar"}
                              </button>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setRoleTarget(roleTarget === u.username ? null : u.username); }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                                >
                                  <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                                  Cambiar Rol
                                </button>
                                {roleTarget === u.username && (
                                  <div className="ml-4 border-t border-outline-variant pt-1 pb-1">
                                    {roles.filter((r) => r !== u.role).map((r) => (
                                      <button
                                        key={r}
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); changeRole(u.username, r); }}
                                        className="w-full flex items-center gap-2 px-4 py-1.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                                      >
                                        <span className={`w-2 h-2 rounded-full ${r === "Admin" ? "bg-secondary" : r === "Operador" ? "bg-[#0b1c30]" : "bg-gray-500"}`}></span>
                                        {r}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>,
                            document.body
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-4 bg-white border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-sm text-on-surface-variant">Mostrando {filtered.length} de {users.length} usuarios</span>
              <div className="flex gap-2">
                <button className="p-1 border border-outline-variant rounded hover:bg-surface-container transition-colors disabled:opacity-30">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="p-1 border border-outline-variant rounded hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
          </section>
      </div>
    </div>
  );
}
