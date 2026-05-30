import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = login(email, password);
    if (ok) {
      navigate("/", { replace: true });
    } else {
      setError("Credenciales inválidas. Intente nuevamente.");
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full bg-surface">
      <section className="hidden lg:flex lg:w-1/2 relative bg-[#0b1c30] overflow-hidden">
        <img
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-sXH0zaCTX59zAF5s81kU34MEaDlslXy0gb4luvT3i140XG7tPH03-od-Y4z4RL_RtXZVySnOlRlKdYJJRzrm-Nx74CvD_lOlSO5W0EalnL4sg1IEcpJJb2PpTPAowe9Z613snwsbot6hhho--gL9Lk6Jyt-TgMamm11dKNkIt0dAGbhehqAwooIXqdwZe06mp6xVVikXyzhX0PTC35rvEF2o0i9Z39W_IAeRwg6tecd7nFG_lf4cF8Uu0unve8pDFVjFJCzn0cg"
          alt="Fishing equipment"
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full text-white">
          <div>
            <h1 className="text-[32px] font-bold tracking-tighter text-[#acedff]">Marlin Poseidon</h1>
            <p className="text-lg font-semibold opacity-80 mt-1">Professional Technical Tackle Purveyor</p>
          </div>
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-[#4cd7f6] fill">verified</span>
              <span className="text-[12px] font-bold uppercase tracking-widest text-[#4cd7f6]">Enterprise Secure Access</span>
            </div>
            <p className="text-base leading-relaxed text-slate-300">
              Gestionando la precisión del inventario náutico con tecnología de vanguardia para los especialistas más
              exigentes del sector.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 p-6">
          <span className="material-symbols-outlined text-[120px] opacity-10 text-white select-none">sailing</span>
        </div>
      </section>

      <section className="w-full lg:w-1/2 flex flex-col justify-center items-center relative">
        <div className="lg:hidden mb-8 text-center">
          <h1 className="text-[32px] font-bold tracking-tighter text-[#00687a]">Marlin Poseidon</h1>
          <p className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">Technical Tackle Purveyor</p>
        </div>

        <div className="w-full max-w-[440px] px-6">
          <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-xl shadow-sm">
            <header className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-on-surface">Iniciar Sesión</h2>
              <p className="text-sm text-on-surface-variant mt-1">Acceso al sistema de gestión de inventario y pedidos.</p>
            </header>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="email">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-lg text-base focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all placeholder:text-outline-variant"
                    placeholder="nombre@marlinposeidon.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <label className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="password">
                    Contraseña
                  </label>
                  <a href="#" className="text-[12px] font-semibold text-secondary hover:underline transition-all">
                    ¿Olvidó su contraseña?
                  </a>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors">
                    lock
                  </span>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-lg text-base focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all placeholder:text-outline-variant"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
                  />
                  <span className="text-sm text-on-surface-variant group-hover:text-on-surface">Recordar sesión</span>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm font-semibold text-error bg-error-container/50 px-4 py-2.5 rounded-lg">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary hover:bg-[#005262] text-white font-semibold text-base py-2.5 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <footer className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-4 text-on-surface-variant">
              <a href="#" className="text-[12px] font-bold uppercase tracking-widest hover:text-primary transition-colors">
                Soporte Técnico
              </a>
              <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
              <a href="#" className="text-[12px] font-bold uppercase tracking-widest hover:text-primary transition-colors">
                Privacidad
              </a>
              <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
              <a href="#" className="text-[12px] font-bold uppercase tracking-widest hover:text-primary transition-colors">
                Términos
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-outline">verified_user</span>
              <p className="text-[12px] font-bold uppercase tracking-widest text-outline">Marlin Poseidon &copy; 2024</p>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
