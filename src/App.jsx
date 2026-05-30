import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import Pagos from "./pages/Pagos";
import PuntoVenta from "./pages/PuntoVenta";
import Usuarios from "./pages/Usuarios";
import HistorialVentas from "./pages/HistorialVentas";
import Login from "./pages/Login";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/pagos" element={<Pagos />} />
        <Route path="/punto-venta" element={<PuntoVenta />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/historial-ventas" element={<HistorialVentas />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
