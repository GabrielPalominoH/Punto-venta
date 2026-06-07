# Marlin Poseidon — Punto de Venta

Sistema de gestión de punto de venta, inventario y administración para **Marlin Poseidon**, una tienda especializada en equipos de pesca deportiva y tackle profesional.

## Tecnologías

- **React 19** + **Vite 8**
- **Tailwind CSS v4**
- **React Router v7**
- **localStorage** como base de datos local
- **html2canvas** + **jsPDF** para generación de PDFs

## Funcionalidades

### Dashboard
- Resumen de ventas del día con barra de progreso vs. meta diaria
- Tarjetas de stock crítico, productos con stock bajo y pedidos pendientes
- Timeline de actividad del sistema
- Botón para agregar productos directamente desde el dashboard

### Punto de Venta (POS)
- Catálogo de productos con filtro por categorías y búsqueda por nombre/código
- Escaneo de código de barras
- Carrito de compras con ajuste de cantidades
- Métodos de pago: Efectivo y Yape/Plin
- Generación de boleta electrónica con diseño profesional
- Descarga de comprobante en PDF
- Badges de estado de stock (agotado, bajo según umbral configurable)

### Inventario
- Tabla de productos con selección y panel de detalles
- Edición inline de productos (imagen, nombre, marca, categoría, precio, stock, características)
- Tarjetas resumen de productos agotados y con stock bajo
- Modal de nuevo producto con formulario completo y carga de imagen
- Umbral de stock bajo configurable globalmente desde Ajustes
- Modal de stock con scroll a la fila seleccionada en la tabla

### Verificación de Pagos
- Tabla de pedidos con filtro por estado (pendientes, aprobados, rechazados)
- Resumen de conteo por estado
- Acciones de aprobar/rechazar por pedido
- Columnas de ancho fijo para evitar saltos de layout

### Historial de Ventas
- Listado completo de ventas con búsqueda y filtro por método de pago
- Métricas del día (total, transacciones, ticket promedio, método dominante)
- Modal de detalle de venta individual
- Paginación

### Usuarios
- Lista de usuarios del sistema con roles (Admin, Operador, Inventario)
- Timeline de actividad del sistema

### Auditoría
- Registro de actividades paginado (10 por página)
- Filtros: búsqueda de texto, rango de fechas, responsable
- Navegación entre páginas con números y elipsis

### Ajustes del Sistema
- **General**: Foto de perfil
- **Seguridad**: Cambio de contraseña
- **Apariencia**: Tema claro/oscuro con animación suave
- **Personalización**: Logo del sistema (icono, URL o imagen), color y vista previa
- **Inventario**: Umbral de stock bajo configurable
- **Notificaciones**: Preferencias de alertas con toggles

### Autenticación
- Login simulado con usuarios de prueba
- Protección de rutas vía contexto de autenticación
- Sesión persistente en localStorage

## Instalación

```bash
npm install
npm run dev
```

## Credenciales de Prueba

| Email | Contraseña | Rol |
|---|---|---|
| admin@marlinposeidon.com | admin123 | Store Manager |
| vendedor@marlinposeidon.com | vendedor123 | Vendedor |

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run preview` | Previsualiza build de producción |
| `npm run lint` | Ejecuta ESLint |

## Estructura del Proyecto

```
src/
├── components/
│   ├── Combobox.jsx      — Dropdown personalizado con búsqueda y teclado
│   ├── ConfigModal.jsx   — Modal de configuración del sistema (6 pestañas)
│   └── Layout.jsx        — Layout principal con sidebar y header
├── context/
│   └── AuthContext.jsx    — Contexto de autenticación
├── pages/
│   ├── Dashboard.jsx      — Página principal con resumen
│   ├── Inventario.jsx     — Gestión de productos
│   ├── Pagos.jsx          — Verificación de pedidos
│   ├── PuntoVenta.jsx     — Punto de venta (POS)
│   ├── Usuarios.jsx       — Gestión de usuarios
│   ├── HistorialVentas.jsx— Historial de transacciones
│   ├── Auditoria.jsx      — Registro de actividades del sistema
│   └── Login.jsx          — Pantalla de inicio de sesión
├── utils/
│   └── db.js              — Capa de persistencia en localStorage
├── index.css              — Estilos globales, temas y overrides de modo oscuro
├── App.css                — Helpers de layout para paneles de filtros
├── App.jsx                — Configuración de rutas
└── main.jsx               — Punto de entrada
```
