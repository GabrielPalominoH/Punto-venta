import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { db } from "../utils/db";

export default function Inventario() {
  const location = useLocation();
  const [products, setProducts] = useState(() => db.getProducts());
  const [selected, setSelected] = useState(() => {
    const list = db.getProducts();
    return list[0] || { id: -1, name: "Sin productos", brand: "-", category: "-", price: 0, stock: 0, minStock: 0, modalidad: "", caracteristicas: "", image: "" };
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => {
    const list = db.getProducts();
    return list[0] ? { ...list[0] } : { id: -1, name: "Sin productos", brand: "-", category: "-", price: 0, stock: 0, minStock: 0, modalidad: "", caracteristicas: "", image: "" };
  });
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRef = useRef(null);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [stockModalType, setStockModalType] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", brand: "", category: "", price: 0, stock: 0, minStock: 0,
    modalidad: "Spinning", caracteristicas: "", image: ""
  });

  const updateNewProduct = (field, value) => {
    setNewProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddProduct = () => {
    if (!newProduct.name.trim()) return;
    const maxId = Math.max(...products.map((p) => p.id), 0);
    const product = {
      ...newProduct,
      id: maxId + 1,
      code: `PRD-${String(maxId + 1).padStart(3, "0")}`,
      image: newProduct.image || `https://picsum.photos/seed/product${Date.now()}/200/200`
    };
    setProducts((prev) => [...prev, product]);
    setShowAddModal(false);
    setNewProduct({ name: "", brand: "", category: "", price: 0, stock: 0, minStock: 0, modalidad: "Spinning", caracteristicas: "", image: "" });
    db.addActivity(
      "add_shopping_cart",
      "bg-secondary-container/20 text-secondary",
      `Producto <strong>${product.name}</strong> agregado por <strong>Carlos M.</strong>`,
      `Stock: ${product.stock} uds · S/ ${product.price.toFixed(2)}`
    );
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpenId(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    db.saveProducts(products);
  }, [products]);

  useEffect(() => {
    if (location.state?.openAddModal) {
      setShowAddModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (showAddModal || stockModalType) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [showAddModal, stockModalType]);

  const lowStockThreshold = db.getLowStockThreshold();
  const outOfStock = products.filter((p) => p.stock === 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl !== "string") return;
      setProducts((prev) => prev.map((p) => (p.id === selected.id ? { ...p, image: dataUrl } : p)));
      setSelected((prev) => ({ ...prev, image: dataUrl }));
      db.addActivity(
        "edit_square",
        "bg-surface-container-high text-on-surface-variant",
        `Imagen de <strong>${selected.name}</strong> actualizada por <strong>Carlos M.</strong>`,
        `Marca: ${selected.brand}`
      );
    };
    reader.readAsDataURL(file);
  };

  const startEditing = (product) => {
    setDraft({ ...product });
    setSelected(product);
    setEditing(true);
    setMenuOpenId(null);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveEditing = () => {
    setProducts((prev) => prev.map((p) => (p.id === draft.id ? { ...draft } : p)));
    setSelected({ ...draft });
    setEditing(false);
    db.addActivity(
      "edit_square",
      "bg-surface-container-high text-on-surface-variant",
      `Producto <strong>${draft.name}</strong> actualizado por <strong>Carlos M.</strong>`,
      `Stock: ${draft.stock} uds · S/ ${draft.price.toFixed(2)}`
    );
  };

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const deleteProduct = (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    const target = products.find((p) => p.id === id);
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (selected.id === id) {
        const fallback = next[0] || { id: -1, name: "Sin productos", brand: "-", category: "-", price: 0, stock: 0, minStock: 0, modalidad: "", caracteristicas: "", image: "" };
        setSelected(fallback);
        setDraft(fallback);
      }
      return next;
    });
    if (editing) setEditing(false);
    if (target) {
      db.addActivity(
        "delete",
        "bg-error/10 text-error",
        `Producto <strong>${target.name}</strong> eliminado por <strong>Carlos M.</strong>`,
        `Marca: ${target.brand}`
      );
    }
  };

  const getStockBadge = (stock) => {
    if (stock === 0)
      return <span className="bg-rose-100 text-rose-stock text-xs font-bold px-3 py-1 rounded-full">{stock}</span>;
    if (stock <= lowStockThreshold)
      return <span className="bg-amber-100 text-amber-stock text-xs font-bold px-3 py-1 rounded-full">{stock}</span>;
    return <span className="bg-secondary/10 text-secondary text-xs font-bold px-3 py-1 rounded-full">{stock}</span>;
  };

  const getStockColor = (stock) => {
    if (stock === 0) return "text-rose-stock";
    if (stock <= lowStockThreshold) return "text-amber-stock";
    return "text-secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Gestión de Inventario</h2>
          <p className="text-sm sm:text-base text-on-surface-variant">Supervise existencias, actualice atributos y gestione su catálogo de pesca.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-secondary text-on-secondary px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0">
          <span className="material-symbols-outlined">add</span>
          Agregar Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setStockModalType("agotado")}
          className="p-4 rounded-xl flex items-center gap-4 border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-all text-left cursor-pointer"
        >
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-rose-100 text-rose-stock">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#e11d48" }}>Agotado</h4>
            <p className="font-semibold text-primary truncate text-lg">{outOfStock.length} productos</p>
            <p className="text-sm text-on-surface-variant">Requieren pedido inmediato</p>
          </div>
          <span className="material-symbols-outlined text-outline">chevron_right</span>
        </button>
        <button
          onClick={() => setStockModalType("stock_bajo")}
          className="p-4 rounded-xl flex items-center gap-4 border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all text-left cursor-pointer"
        >
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 text-amber-stock">
            <span className="material-symbols-outlined">running_with_errors</span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#d97706" }}>Stock Bajo</h4>
            <p className="font-semibold text-primary truncate text-lg">{lowStock.length} productos</p>
            <p className="text-sm text-on-surface-variant">Por debajo del umbral ({lowStockThreshold} uds)</p>
          </div>
          <span className="material-symbols-outlined text-outline">chevron_right</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className={`w-full transition-all duration-300 ease-in-out ${editing ? "lg:w-2/3" : "w-full"}`}>
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] table-fixed border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="text-left py-4 px-4 text-xs font-bold text-outline uppercase tracking-wider w-[35%]">Producto</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-outline uppercase tracking-wider w-[15%]">Marca</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-outline uppercase tracking-wider w-[15%]">Categoría</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-outline uppercase tracking-wider w-[12%]">Precio</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-outline uppercase tracking-wider w-[13%]">Stock</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-outline uppercase tracking-wider w-[10%]">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    id={`product-row-${p.id}`}
                    onClick={() => { if (editing) setEditing(false); setSelected(p); setMenuOpenId(null); if (window.innerWidth < 1024) setShowMobilePanel(true); }}
                    className={`transition-all duration-200 cursor-pointer ${
                      selected.id === p.id
                        ? "bg-secondary/5 ring-2 ring-secondary/50 scale-[1.01] rounded-lg"
                        : "hover:bg-slate-50"
                    } ${p.id % 2 === 0 && selected.id !== p.id ? "bg-slate-50/50" : ""}`}
                    style={selected.id === p.id ? { transformOrigin: "left center", boxShadow: "0 0 0 2px rgba(6,182,212,0.5), 0 2px 8px rgba(6,182,212,0.12)" } : undefined}
                  >
                      <td className="py-4 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg border border-outline-variant object-cover shrink-0"
                          onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                        />
                        <div className="w-10 h-10 bg-surface-container-high rounded-lg border border-outline-variant items-center justify-center text-sm font-bold text-on-surface-variant hidden shrink-0">
                          {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm text-primary truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-on-surface-variant">{p.brand}</td>
                    <td className="py-4 px-4 text-sm text-on-surface-variant">{p.category}</td>
                    <td className="py-4 px-4 font-bold text-primary whitespace-nowrap">S/ {p.price.toFixed(2)}</td>
                    <td className="py-4 px-4">{getStockBadge(p.stock)}</td>
                    <td className="py-4 px-4 text-center relative">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === p.id ? null : p.id); }}
                        className="text-outline hover:text-secondary transition-colors p-1 rounded hover:bg-slate-100"
                        title="Acciones"
                      >
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>
                      {menuOpenId === p.id && (
                        <div ref={menuRef} className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-white border border-outline-variant rounded-lg shadow-xl z-20 min-w-[140px] py-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEditing(p); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-slate-50 transition-colors text-left"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                            Editar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="bg-surface-container-low p-4 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-sm text-on-surface-variant">Mostrando {products.length} de {products.length} productos</p>
              <div className="flex gap-2">
                {["chevron_left", "1", "2", "3", "chevron_right"].map((item, i) =>
                  item === "1" ? (
                    <button key={i} className="w-8 h-8 rounded border border-outline-variant bg-white shadow-sm flex items-center justify-center font-bold text-secondary text-sm">
                      {item}
                    </button>
                  ) : item.includes("chevron") ? (
                    <button key={i} className="w-8 h-8 rounded border border-outline-variant flex items-center justify-center hover:bg-white transition-colors">
                      <span className="material-symbols-outlined text-lg">{item}</span>
                    </button>
                  ) : (
                    <button key={i} className="w-8 h-8 rounded border border-outline-variant flex items-center justify-center hover:bg-white transition-colors text-sm">
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop detail panel */}
        <div
          className={`hidden lg:block transition-all duration-300 ease-in-out overflow-hidden ${
            editing ? "max-w-[420px] opacity-100" : "max-w-0 opacity-0"
          }`}
        >
          <DetailPanel
            selected={selected}
            editing={editing}
            draft={draft}
            setEditing={setEditing}
            updateDraft={updateDraft}
            saveEditing={saveEditing}
            cancelEditing={cancelEditing}
            handleImageUpload={handleImageUpload}
            getStockColor={getStockColor}
          />
        </div>
      </div>

      {/* Mobile detail panel (bottom sheet) */}
      {showMobilePanel && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowMobilePanel(false)} />
          <div className="relative bg-white rounded-t-2xl shadow-xl w-full max-h-[80vh] overflow-y-auto pb-6">
            <div className="sticky top-0 bg-white pt-4 pb-2 px-4 border-b border-outline-variant flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="font-semibold text-lg text-primary">Detalles del Producto</h3>
              <button onClick={() => setShowMobilePanel(false)} className="p-2 hover:bg-surface-container-low rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4">
              <DetailPanel
                selected={selected}
                editing={editing}
                draft={draft}
                setEditing={setEditing}
                updateDraft={updateDraft}
                saveEditing={saveEditing}
                cancelEditing={cancelEditing}
                handleImageUpload={handleImageUpload}
                getStockColor={getStockColor}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile edit button (always visible when a product is selected) */}
      {!editing && selected.id !== -1 && (
        <button
          onClick={() => { setEditing(true); if (window.innerWidth >= 1024) {} else setShowMobilePanel(true); }}
          className="fixed bottom-6 right-6 lg:hidden bg-secondary text-on-secondary w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30 hover:opacity-90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">edit</span>
        </button>
      )}

      {stockModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setStockModalType(null)}>
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl border border-outline-variant shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
              <h3 className="font-semibold text-lg text-primary">
                {stockModalType === "agotado" ? "Productos Agotados" : "Stock Bajo"}
              </h3>
              <button onClick={() => setStockModalType(null)} className="p-1.5 text-outline hover:text-error transition-colors rounded-lg hover:bg-surface-container-low">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-outline-variant">
              {(stockModalType === "agotado" ? outOfStock : lowStock).map((p) => (
                <div
                  key={p.id}
                  onClick={() => { setSelected(p); setStockModalType(null); if (window.innerWidth < 1024) setShowMobilePanel(true); setTimeout(() => document.getElementById(`product-row-${p.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100); }}
                  className="p-4 flex items-center gap-3 hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-10 h-10 rounded-lg border border-outline-variant object-cover shrink-0"
                    onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                  />
                  <div className="w-10 h-10 bg-surface-container-high rounded-lg border border-outline-variant items-center justify-center text-sm font-bold text-on-surface-variant hidden shrink-0">
                    {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-primary truncate">{p.name}</p>
                    <p className="text-xs text-on-surface-variant">{p.brand} · {p.category}</p>
                  </div>
                  <span className={`text-sm font-bold whitespace-nowrap ${p.stock === 0 ? "text-rose-stock" : "text-amber-stock"}`}>
                    {p.stock} {p.stock === 1 ? "unidad" : "unidades"}
                  </span>
                </div>
              ))}
              {(stockModalType === "agotado" ? outOfStock : lowStock).length === 0 && (
                <div className="p-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                  <p className="font-semibold">No hay productos {stockModalType === "agotado" ? "agotados" : "con stock bajo"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-surface-container-lowest w-full max-w-lg max-h-[85vh] rounded-xl border border-outline-variant shadow-xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-bright shrink-0">
              <h3 className="font-semibold text-lg text-primary">Nuevo Producto</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-outline hover:text-error transition-colors rounded-lg hover:bg-surface-container-low">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase">Nombre del Producto</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary focus:ring-2 focus:ring-secondary/20"
                  value={newProduct.name}
                  onChange={(e) => updateNewProduct("name", e.target.value)}
                  placeholder="Ej: Caña Shimano Talavera"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-outline uppercase">Marca</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary focus:ring-2 focus:ring-secondary/20"
                    value={newProduct.brand}
                    onChange={(e) => updateNewProduct("brand", e.target.value)}
                    placeholder="Ej: Shimano"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-outline uppercase">Categoría</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary focus:ring-2 focus:ring-secondary/20"
                    value={newProduct.category}
                    onChange={(e) => updateNewProduct("category", e.target.value)}
                    placeholder="Ej: Cañas"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-outline uppercase">Precio (S/)</label>
                  <input
                    type="number" step="0.01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary focus:ring-2 focus:ring-secondary/20"
                    value={newProduct.price === "" ? "" : newProduct.price}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateNewProduct("price", v === "" ? "" : parseFloat(v));
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-outline uppercase">Stock Inicial</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary focus:ring-2 focus:ring-secondary/20"
                    value={newProduct.stock === "" ? "" : newProduct.stock}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateNewProduct("stock", v === "" ? "" : parseInt(v));
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase">Características</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary resize-y focus:ring-2 focus:ring-secondary/20 min-h-[80px]"
                  rows={4}
                  value={newProduct.caracteristicas}
                  onChange={(e) => updateNewProduct("caracteristicas", e.target.value)}
                  placeholder="Describe las características del producto..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase">Modalidad de Caña</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary focus:ring-2 focus:ring-secondary/20"
                  value={newProduct.modalidad}
                  onChange={(e) => updateNewProduct("modalidad", e.target.value)}
                >
                  <option value="Spinning">Spinning</option>
                  <option value="Surfcasting">Surfcasting</option>
                  <option value="Jigging">Jigging</option>
                  <option value="Spinning ligero">Spinning ligero</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-outline uppercase">Stock Mínimo</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary focus:ring-2 focus:ring-secondary/20"
                    value={newProduct.minStock === "" ? "" : newProduct.minStock}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateNewProduct("minStock", v === "" ? "" : parseInt(v));
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-outline uppercase">Imagen</label>
                  <div className="flex items-center gap-3">
                    <div className="relative group shrink-0">
                      <img
                        src={newProduct.image || "https://picsum.photos/seed/default/200/200"}
                        alt="Preview"
                        className="w-14 h-14 rounded-lg border border-outline-variant object-cover"
                        onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                      />
                      <div className="w-14 h-14 rounded-lg border border-outline-variant bg-surface-container-high items-center justify-center text-lg font-bold text-on-surface-variant hidden">
                        <span className="material-symbols-outlined">image</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById("addProductImageInput").click()}
                        className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                      </button>
                      <input
                        id="addProductImageInput"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result;
                            if (typeof dataUrl === "string") updateNewProduct("image", dataUrl);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-on-surface-variant">Toca para <br />seleccionar</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-bright shrink-0">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-bold hover:bg-surface-container-low transition-colors">
                Cancelar
              </button>
              <button onClick={handleAddProduct} className="px-4 py-2 rounded-lg bg-secondary text-on-secondary text-sm font-bold hover:opacity-90 transition-colors">
                Guardar Producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailPanel({ selected, editing, draft, setEditing, updateDraft, saveEditing, cancelEditing, handleImageUpload, getStockColor }) {
  return (
    <div className="w-full lg:w-[420px] bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-outline-variant flex items-center justify-between">
        <h3 className="font-semibold text-lg text-primary">Detalles del Producto</h3>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={cancelEditing} className="text-xs font-bold text-outline uppercase hover:underline px-3 py-1 border border-outline-variant rounded-lg">Cancelar</button>
              <button onClick={saveEditing} className="text-xs font-bold text-on-secondary uppercase hover:underline px-3 py-1 bg-secondary rounded-lg">Guardar</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="text-secondary text-xs font-bold uppercase hover:underline">Editar</button>
          )}
        </div>
      </div>
      <form className="p-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="flex justify-center">
          <div className="relative group">
            <img
              src={editing ? draft.image : selected.image}
              alt={selected.name}
              className="w-32 h-32 rounded-xl border border-outline-variant object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                const fallback = e.target.nextSibling;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <div className="w-32 h-32 rounded-xl border border-outline-variant bg-surface-container-high items-center justify-center text-lg font-bold text-on-surface-variant hidden">
              {selected.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("imageInput").click()}
              className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">photo_camera</span>
            </button>
            <input id="imageInput" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-outline uppercase">Nombre del Producto</label>
          <input
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary focus:ring-2 focus:ring-secondary/20"
            readOnly={!editing}
            value={editing ? draft.name : selected.name}
            onChange={(e) => updateDraft("name", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-outline uppercase">Marca</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary focus:ring-2 focus:ring-secondary/20"
              readOnly={!editing}
              value={editing ? draft.brand : selected.brand}
              onChange={(e) => updateDraft("brand", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-outline uppercase">Categoría</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary focus:ring-2 focus:ring-secondary/20"
              readOnly={!editing}
              value={editing ? draft.category : selected.category}
              onChange={(e) => updateDraft("category", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-outline uppercase">Precio (S/)</label>
            <input
              type="number" step="0.01"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary focus:ring-2 focus:ring-secondary/20"
              readOnly={!editing}
              value={editing ? (draft.price === "" ? "" : draft.price) : selected.price}
              onChange={(e) => {
                const v = e.target.value;
                updateDraft("price", v === "" ? "" : parseFloat(v));
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-outline uppercase">Stock Actual</label>
            <input
              type="number"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary focus:ring-2 focus:ring-secondary/20"
              readOnly={!editing}
              value={editing ? (draft.stock === "" ? "" : draft.stock) : selected.stock}
              onChange={(e) => {
                const v = e.target.value;
                updateDraft("stock", v === "" ? "" : parseInt(v));
              }}
            />
          </div>
        </div>
        <div className="pt-3 border-t border-outline-variant">
          <h4 className="text-xs font-bold text-outline uppercase tracking-wider mb-3">Características</h4>
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary resize-none focus:ring-2 focus:ring-secondary/20"
            rows={3}
            readOnly={!editing}
            value={editing ? draft.caracteristicas || "" : selected.caracteristicas || ""}
            onChange={(e) => updateDraft("caracteristicas", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-outline uppercase">Modalidad de Caña</label>
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary focus:ring-2 focus:ring-secondary/20"
            disabled={!editing}
            value={editing ? draft.modalidad || "" : selected.modalidad || ""}
            onChange={(e) => updateDraft("modalidad", e.target.value)}
          >
            <option value="Spinning">Spinning</option>
            <option value="Surfcasting">Surfcasting</option>
            <option value="Jigging">Jigging</option>
            <option value="Spinning ligero">Spinning ligero</option>
          </select>
        </div>
        <div className="pt-3 border-t border-outline-variant">
          <h4 className="text-xs font-bold text-outline uppercase tracking-wider mb-3">Logística</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container rounded-lg p-3">
              <p className="text-[10px] font-bold text-outline uppercase">Stock Mín.</p>
              {editing ? (
                <input
                  type="number"
                  className="w-full bg-white border border-slate-200 rounded-lg p-1 text-lg font-bold text-primary mt-1 focus:ring-2 focus:ring-secondary/20"
                  value={draft.minStock === "" ? "" : draft.minStock}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateDraft("minStock", v === "" ? "" : parseInt(v));
                  }}
                />
              ) : (
                <p className="text-2xl font-bold text-primary">{selected.minStock}</p>
              )}
            </div>
            <div className="bg-surface-container rounded-lg p-3">
              <p className="text-[10px] font-bold text-outline uppercase">En Stock</p>
              {editing ? (
                <input
                  type="number"
                  className="w-full bg-white border border-slate-200 rounded-lg p-1 text-lg font-bold mt-1 focus:ring-2 focus:ring-secondary/20"
                  style={{ color: draft.stock === 0 ? "#e11d48" : draft.stock <= draft.minStock ? "#d97706" : "#00687a" }}
                  value={draft.stock === "" ? "" : draft.stock}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateDraft("stock", v === "" ? "" : parseInt(v));
                  }}
                />
              ) : (
                <p className={`text-2xl font-bold ${getStockColor(selected.stock)}`}>{selected.stock}</p>
              )}
            </div>
          </div>
        </div>
        <button type="button" className="w-full bg-teal-brand text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-all mt-2">
          <span className="material-symbols-outlined">shopping_cart_checkout</span>
          Ordenar Reabastecimiento
        </button>
      </form>
    </div>
  );
}
