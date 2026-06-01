// Utilidad de Base de Datos Local en localStorage para Marlin Poseidon

const PRODUCTS_KEY = "marlin_db_products";
const SALES_KEY = "marlin_db_sales";
const ORDERS_KEY = "marlin_db_orders";
const USERS_KEY = "marlin_db_users";
const ACTIVITIES_KEY = "marlin_db_activities";
const LOW_STOCK_THRESHOLD_KEY = "marlin_low_stock_threshold";
const CATEGORIES_KEY = "marlin_db_categories";

const initialCategories = ["Motores", "Electrónica", "Equipamiento", "Anzuelos", "Cañas", "Carretes", "Señuelos", "Hilos"];

const initialProducts = [
  { id: 1, name: "Penn Battle III 6000", brand: "Penn", category: "Carretes", price: 189.99, stock: 10, minStock: 5, code: "CAR-001", image: "https://picsum.photos/seed/product1/200/200", caracteristicas: "Carrete giratorio de 6000 con 5 rodamientos, ratio 5.2:1, capacidad 200m/30lb", modalidad: "Spinning" },
  { id: 2, name: "Shimano Teramar Southeast", brand: "Shimano", category: "Cañas", price: 215.00, stock: 42, minStock: 10, code: "CAN-003", image: "https://picsum.photos/seed/product2/200/200", caracteristicas: "Caña de 12ft, acción pesada, guías de acero inoxidable, blank de grafito", modalidad: "Surfcasting" },
  { id: 3, name: "Rapala X-Rap Saltwater", brand: "Rapala", category: "Señuelos", price: 18.50, stock: 12, minStock: 15, code: "SEN-001", image: "https://picsum.photos/seed/product3/200/200", caracteristicas: "Señuelo de 14cm, flotante, color azul/plateado, triple anzuelo", modalidad: "Jigging" },
  { id: 4, name: "Seaguar Blue Label 30lb", brand: "Seaguar", category: "Hilos", price: 29.99, stock: 115, minStock: 20, code: "HIL-001", image: "https://picsum.photos/seed/product4/200/200", caracteristicas: "Fluorocarbono 30lb, 100m, diámetro 0.52mm, transparente", modalidad: "Spinning" },
  { id: 5, name: "Carrete Shimano Stella 4000", brand: "Shimano", category: "Carretes", price: 599.99, stock: 0, minStock: 5, code: "CAR-002", image: "https://picsum.photos/seed/product5/200/200", caracteristicas: "Carrete premium 4000, 12 rodamientos, cuerpo de magnesio, ratio 5.8:1", modalidad: "Spinning ligero" },
  { id: 6, name: "Anzuelos Mustang 4/0", brand: "Mustang", category: "Anzuelos", price: 8.99, stock: 5, minStock: 50, code: "ANZ-003", image: "https://picsum.photos/seed/product6/200/200", caracteristicas: "Anzuelo acero carbono 4/0, paquete 25 unidades, ojo recto", modalidad: "Surfcasting" },
  { id: 7, name: "Señuelo Yo-Zuri Darter", brand: "Yo-Zuri", category: "Señuelos", price: 22.99, stock: 8, minStock: 10, code: "SEN-002", image: "https://picsum.photos/seed/product7/200/200", caracteristicas: "Darter 12cm, 45g, acción natatoria errática, 3D holográfico", modalidad: "Jigging" },
  { id: 8, name: "Línea PowerPro 65lb", brand: "PowerPro", category: "Hilos", price: 34.99, stock: 67, minStock: 15, code: "HIL-002", image: "https://picsum.photos/seed/product8/200/200", caracteristicas: "Trenzado 65lb, 150yds, color verde, diámetro 0.38mm", modalidad: "Spinning" },
  { id: 9, name: "Mercury 5HP FourStroke", brand: "Mercury", category: "Motores", price: 4200.00, stock: 12, minStock: 3, code: "MOT-001", image: "https://picsum.photos/seed/motor1/200/200", caracteristicas: "Motor fuera de borda 5HP de 4 tiempos, eje corto, silencioso y eficiente", modalidad: "Spinning" },
  { id: 10, name: "Garmin Striker Vivid 7cv", brand: "Garmin", category: "Electrónica", price: 1850.00, stock: 5, minStock: 2, code: "ELE-001", image: "https://picsum.photos/seed/elec1/200/200", caracteristicas: "Sonda de pesca GPS de 7 pulgadas con transductor GT20-TM y paletas de colores vívidos", modalidad: "Spinning" },
  { id: 11, name: "Penn International VI", brand: "Penn", category: "Equipamiento", price: 720.00, stock: 24, minStock: 5, code: "EQU-001", image: "https://picsum.photos/seed/equip1/200/200", caracteristicas: "Carrete de curricán de dos velocidades, cuerpo y placas laterales de aluminio mecanizado", modalidad: "Surfcasting" },
  { id: 12, name: "Chaleco Salvavidas Pro", brand: "Poseidon", category: "Equipamiento", price: 450.00, stock: 2, minStock: 5, code: "EQU-002", image: "https://picsum.photos/seed/equip2/200/200", caracteristicas: "Chaleco salvavidas de alta visibilidad, homologado, con silbato y cintas reflectantes", modalidad: "Spinning" },
  { id: 13, name: "Anzuelos Mustang Paq.", brand: "Mustang", category: "Anzuelos", price: 28.00, stock: 50, minStock: 20, code: "ANZ-001", image: "https://picsum.photos/seed/anz1/200/200", caracteristicas: "Paquete de anzuelos premium para pesca pesada, alta resistencia a la corrosión", modalidad: "Surfcasting" },
  { id: 14, name: "Caña Shimano Talavera", brand: "Shimano", category: "Cañas", price: 380.00, stock: 8, minStock: 4, code: "CAN-001", image: "https://picsum.photos/seed/rod1/200/200", caracteristicas: "Caña para jigging y curricán ligero, guías de óxido de aluminio Fuji", modalidad: "Surfcasting" },
  { id: 15, name: "GPS Garmin GPSMAP 922", brand: "Garmin", category: "Electrónica", price: 3200.00, stock: 3, minStock: 2, code: "ELE-002", image: "https://picsum.photos/seed/elec2/200/200", caracteristicas: "Pantalla táctil de 9 pulgadas para navegación marítima con conectividad inalámbrica y red", modalidad: "Spinning" },
  { id: 16, name: "Motor Suzuki 9.9HP", brand: "Suzuki", category: "Motores", price: 5600.00, stock: 7, minStock: 2, code: "MOT-002", image: "https://picsum.photos/seed/motor2/200/200", caracteristicas: "Motor fuera de borda 9.9HP inyección electrónica de combustible sin batería, eje largo", modalidad: "Spinning" },
  { id: 17, name: "Carrete Shimano Stella", brand: "Shimano", category: "Equipamiento", price: 2600.00, stock: 4, minStock: 2, code: "EQU-003", image: "https://picsum.photos/seed/equip3/200/200", caracteristicas: "Carrete giratorio de agua salada de alta gama con arrastre impermeable y cuerpo Hagane", modalidad: "Spinning ligero" },
  { id: 18, name: "Señuelo Yo-Zuri Hydro Minnow", brand: "Yo-Zuri", category: "Señuelos", price: 45.00, stock: 30, minStock: 10, code: "SEN-003", image: "https://picsum.photos/seed/lure2/200/200", caracteristicas: "Señuelo tipo Minnow de larga distancia, acción de balanceo firme", modalidad: "Jigging" },
  { id: 19, name: "Rodillero Profesional", brand: "Poseidon", category: "Equipamiento", price: 120.00, stock: 15, minStock: 5, code: "EQU-004", image: "https://picsum.photos/seed/equip4/200/200", caracteristicas: "Rodilleras ergonómicas acojinadas para mayor comodidad a bordo", modalidad: "Spinning" },
  { id: 20, name: "Línea PowerPro Braided", brand: "PowerPro", category: "Hilos", price: 65.00, stock: 20, minStock: 5, code: "HIL-003", image: "https://picsum.photos/seed/line2/200/200", caracteristicas: "Línea trenzada de alta resistencia, 65lb, color verde musgo, 150 yardas", modalidad: "Spinning" }
];

const initialOrders = [
  { id: "#MP-89241", client: "Julián Rodríguez", initials: "JR", type: "Delivery", amount: 1240.0, status: "pending", date: "Hoy, 10:05 AM" },
  { id: "#MP-89242", client: "María López", initials: "ML", type: "Pickup", amount: 450.5, status: "pending", date: "Hoy, 09:30 AM" },
  { id: "#MP-89243", client: "Roberto Sánchez", initials: "RS", type: "Delivery", amount: 2890.0, status: "pending", date: "Hoy, 08:15 AM" },
  { id: "#MP-89244", client: "Ana Alva", initials: "AA", type: "Pickup", amount: 75.0, status: "pending", date: "Ayer, 17:40 PM" },
  { id: "#MP-89245", client: "Pedro Castillo", initials: "PC", type: "Delivery", amount: 3200.0, status: "approved", date: "Ayer, 15:20 PM" },
  { id: "#MP-89246", client: "Lucía Fernández", initials: "LF", type: "Pickup", amount: 890.0, status: "rejected", date: "Ayer, 11:10 AM" },
  { id: "#MP-89247", client: "Diego Ramos", initials: "DR", type: "Delivery", amount: 1560.0, status: "pending", date: "Ayer, 09:05 AM" },
  { id: "#MP-89248", client: "Sofía Torres", initials: "ST", type: "Pickup", amount: 234.99, status: "pending", date: "27 May, 16:30 PM" },
];

const initialUsers = [
  { name: "Carlos Méndez", email: "carlos.m@marlin.com", username: "cmendez_admin", role: "Admin", lastAccess: "Hoy, 09:15 AM", initials: "CM", roleColor: "secondary", enabled: true },
  { name: "Ana López", email: "ana.lopez@marlin.com", username: "alopez_pos", role: "Operador", lastAccess: "Ayer, 18:42 PM", initials: "AL", roleColor: "tertiary", enabled: true },
  { name: "Jorge Ruiz", email: "jruiz_inv@marlin.com", username: "jruiz_stock", role: "Inventario", lastAccess: "05 Oct, 11:30 AM", initials: "JR", roleColor: "neutral", enabled: true },
  { name: "Elena Vargas", email: "evargas@marlin.com", username: "elena_v", role: "Admin", lastAccess: "Hace 2 horas", initials: "EV", roleColor: "secondary", enabled: true },
  { name: "Marco Sosa", email: "m_sosa@marlin.com", username: "m_sosa", role: "Operador", lastAccess: "Hace 30 min", initials: "MS", roleColor: "tertiary", enabled: true },
];

const initialActivities = [
  { id: 1, icon: "verified", iconBg: "bg-secondary-container/20 text-secondary", text: "Pago verificado por <strong>Carlos M.</strong>", meta: "Pedido #MP-89245 · Hace 5 min", amount: "S/ 3,200.00", amountClass: "text-primary", date: new Date().toISOString() },
  { id: 2, icon: "edit_square", iconBg: "bg-surface-container-high text-on-surface-variant", text: "Stock actualizado por <strong>Sistema</strong>", meta: "Carrete Shimano Stella 4000 · Hace 12 min", amount: "-1 unidades", amountClass: "text-error", date: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
  { id: 3, icon: "add_shopping_cart", iconBg: "bg-secondary-container/20 text-secondary", text: "Nueva venta en mostrador por <strong>Carlos M.</strong>", meta: "Boleta #9405 · Hace 1 h", amount: "S/ 1,230.00", amountClass: "text-primary", date: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  { id: 4, icon: "person_add", iconBg: "bg-surface-container-high text-on-surface-variant", text: "Nuevo usuario registrado: <strong>Lucía G.</strong>", meta: "Rol: Vendedor · Hace 2 h", amount: "", amountClass: "", date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
];

const initialSales = [
  { id: "BOLETA-29-05-2026-0001", items: [{ name: "Mercury 5HP FourStroke", qty: 2, price: 4200 }], total: 8400, payment: "cash", customer: "Juan Pérez", date: new Date().toLocaleString("es-PE") },
  { id: "BOLETA-29-05-2026-0002", items: [{ name: "Garmin Striker Vivid 7cv", qty: 2, price: 1850 }], total: 3700, payment: "yape", customer: "Marina Supply", date: new Date().toLocaleString("es-PE") },
  { id: "BOLETA-29-05-2026-0003", items: [{ name: "Rapala X-Rap Saltwater", qty: 10, price: 18.5 }], total: 185, payment: "yape", customer: "Consumidor Final", date: new Date().toLocaleString("es-PE") }
];

// Helper functions for LocalStorage access
const getStored = (key, fallback) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error parsing localStorage key ${key}`, e);
    return fallback;
  }
};

const saveStored = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
  // PRODUCTS
  getProducts: () => getStored(PRODUCTS_KEY, initialProducts),
  saveProducts: (products) => saveStored(PRODUCTS_KEY, products),
  
  // SALES (Transactions made at Point of Sale)
  getSales: () => {
    const data = localStorage.getItem(SALES_KEY);
    if (!data || data === "[]") {
      localStorage.setItem(SALES_KEY, JSON.stringify(initialSales));
      return initialSales;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return initialSales;
    }
  },
  saveSales: (sales) => saveStored(SALES_KEY, sales),
  
  // ORDERS (Delivery/pickup verifications in Pagos)
  getOrders: () => getStored(ORDERS_KEY, initialOrders),
  saveOrders: (orders) => saveStored(ORDERS_KEY, orders),
  
  // USERS
  getUsers: () => getStored(USERS_KEY, initialUsers),
  saveUsers: (users) => saveStored(USERS_KEY, users),
  
  // ACTIVITIES (Audit Logs)
  getActivities: () => getStored(ACTIVITIES_KEY, initialActivities),
  saveActivities: (activities) => saveStored(ACTIVITIES_KEY, activities),
  
  addActivity: (icon, iconBg, text, meta, amount = "", amountClass = "") => {
    const activities = db.getActivities();
    const newActivity = {
      id: Date.now(),
      icon,
      iconBg,
      text,
      meta,
      amount,
      amountClass,
      date: new Date().toISOString()
    };
    db.saveActivities([newActivity, ...activities].slice(0, 50)); // Cap at 50 activities
  },

  // LOW STOCK THRESHOLD (global setting)
  getLowStockThreshold: () => parseInt(localStorage.getItem(LOW_STOCK_THRESHOLD_KEY) || "5", 10),
  saveLowStockThreshold: (value) => localStorage.setItem(LOW_STOCK_THRESHOLD_KEY, String(value)),

  // CATEGORIES
  getCategories: () => getStored(CATEGORIES_KEY, initialCategories),
  saveCategories: (categories) => saveStored(CATEGORIES_KEY, categories),
};
