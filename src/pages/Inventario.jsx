import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [stockModalType, setStockModalType] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (showMobilePanel) {
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [showMobilePanel]);

  useEffect(() => {
    if (highlightedId && !stockModalType) {
      const id = highlightedId;
      setTimeout(() => {
        const els = document.querySelectorAll(`[id="product-row-${id}"]`);
        for (const el of els) {
          if (el.offsetParent !== null) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            break;
          }
        }
      }, 100);
      const timer = setTimeout(() => setHighlightedId(null), 2100);
      return () => clearTimeout(timer);
    }
  }, [highlightedId, stockModalType]);
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
    if (showAddModal || stockModalType || showMobilePanel) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [showAddModal, stockModalType, showMobilePanel]);

  const lowStockThreshold = db.getLowStockThreshold();
  const outOfStock = products.filter((p) => p.stock === 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold);
  const inStock = products.filter((p) => p.stock > lowStockThreshold);
  const filteredProducts = products.filter((p) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [p.name, p.brand, p.category, p.code]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term));
  });

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

  const getMobileStockBadge = (stock) => {
    if (stock === 0) return "bg-error/10 text-error border-error/20";
    if (stock <= lowStockThreshold) return "bg-amber-100 text-amber-stock border-amber-200";
    return "bg-secondary/10 text-secondary border-secondary/20";
  };

  const getMobileStockLabel = (stock) => {
    if (stock === 0) return "AGOTADO";
    if (stock <= lowStockThreshold) return `${stock} STOCK BAJO`;
    return `${stock} EN STOCK`;
  };

  return (
    <div className="space-y-6 @container">
      {/* Mobile stock summary cards */}
      <div className="@md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide flex gap-6 py-2">
        <button
          onClick={() => setStockModalType("agotado")}
          className="min-w-[160px] bg-surface-container-lowest border border-error/20 p-6 rounded-xl shadow-sm text-left"
        >
          <span className="text-xs font-bold tracking-wider text-error uppercase mb-1 block">Agotado</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-primary">{outOfStock.length}</span>
            <span className="text-sm text-on-surface-variant">items</span>
          </div>
          <div className="mt-2 w-full bg-error/10 h-1 rounded-full overflow-hidden">
            <div className="bg-error h-full w-full"></div>
          </div>
        </button>
        <button
          onClick={() => setStockModalType("stock_bajo")}
          className="min-w-[160px] bg-surface-container-lowest border border-amber-200 p-6 rounded-xl shadow-sm text-left"
        >
          <span className="text-xs font-bold tracking-wider text-amber-stock uppercase mb-1 block">Stock Bajo</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-primary">{lowStock.length}</span>
            <span className="text-sm text-on-surface-variant">items</span>
          </div>
          <div className="mt-2 w-full bg-amber-100 h-1 rounded-full overflow-hidden">
            <div className="bg-amber-stock h-full w-2/3"></div>
          </div>
        </button>
        <div className="min-w-[160px] bg-surface-container-lowest border border-secondary/20 p-6 rounded-xl shadow-sm">
          <span className="text-xs font-bold tracking-wider text-secondary uppercase mb-1 block">En Stock</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-primary">{inStock.length}</span>
            <span className="text-sm text-on-surface-variant">items</span>
          </div>
          <div className="mt-2 w-full bg-secondary/10 h-1 rounded-full overflow-hidden">
            <div className="bg-secondary h-full w-full"></div>
          </div>
        </div>
      </div>

      {/* Mobile search + actions */}
      <div className="@md:hidden space-y-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-sm"
            placeholder="Buscar productos..."
            type="text"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 bg-secondary text-on-secondary font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            Nuevo Producto
          </button>
          <button className="p-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface-variant active:bg-surface-container">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </div>

      {/* Mobile product list */}
      <section className="@md:hidden space-y-3 pb-24">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">Inventario Reciente</h2>
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            id={`product-row-${p.id}`}
            onClick={() => { if (editing) setEditing(false); setSelected(p); setMenuOpenId(null); setShowMobilePanel(true); }}
            className={`bg-surface-container-lowest border rounded-xl p-3 flex gap-4 active:bg-surface-container-low transition-all duration-300 ${highlightedId === p.id ? "border-secondary ring-2 ring-secondary/30 shadow-md" : "border-outline-variant"}`}
          >
            <img
              src={p.image}
              alt={p.name}
              className="w-20 h-20 bg-surface-container rounded-lg object-cover shrink-0"
              onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            />
            <div className="w-20 h-20 bg-surface-container rounded-lg items-center justify-center text-sm font-bold text-on-surface-variant hidden shrink-0">
              {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base text-primary leading-tight line-clamp-2">{p.name}</h3>
                  <span className="text-secondary font-bold text-sm whitespace-nowrap">S/ {p.price.toFixed(2)}</span>
                </div>
                <p className="text-sm text-on-surface-variant truncate">{p.brand} · {p.category}</p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getMobileStockBadge(p.stock)}`}>
                  {getMobileStockLabel(p.stock)}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-on-surface-variant bg-surface-container-lowest border border-outline-variant rounded-xl">
            <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
            <p className="font-semibold">No hay productos para esta búsqueda</p>
          </div>
        )}
      </section>

      {/* Desktop header */}
      <div className="hidden @md:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Gestión de Inventario</h2>
          <p className="text-sm sm:text-base text-on-surface-variant">Supervise existencias, actualice atributos y gestione su catálogo de pesca.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-secondary text-on-secondary px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0">
          <span className="material-symbols-outlined">add</span>
          Agregar Nuevo Producto
        </button>
      </div>

      {/* Desktop stock summary cards */}
      <div className="hidden @md:grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Desktop table + detail panel */}
      <div className="hidden @md:flex flex-col @md:flex-row gap-6 items-start">
        <div className={`w-full transition-all duration-300 ease-in-out ${editing ? "@md:w-2/3" : "w-full"}`}>
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
                {filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    id={`product-row-${p.id}`}
                    onClick={() => { if (editing) setEditing(false); setSelected(p); setMenuOpenId(null); }}
                    className={`transition-all duration-200 cursor-pointer ${
                      selected.id === p.id
                        ? "bg-secondary/5 ring-2 ring-secondary/50 scale-[1.01] rounded-lg"
                        : "hover:bg-surface-container-low"
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
                      <div className="relative inline-flex">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                            setMenuOpenId(menuOpenId === p.id ? null : p.id);
                          }}
                          className="text-outline hover:text-secondary transition-colors p-1 rounded hover:bg-surface-container-high"
                          title="Acciones"
                        >
                          <span className="material-symbols-outlined text-lg">more_vert</span>
                        </button>
                        {menuOpenId === p.id && createPortal(
                          <div ref={menuRef} className="bg-white border border-outline-variant rounded-lg shadow-xl min-w-[140px] py-1" style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 50 }} onClick={(e) => e.stopPropagation()}>
                            <button
                      onClick={(e) => { e.stopPropagation(); startEditing(p); }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                              Editar
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteTargetId(p.id); setShowDeleteModal(true); }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-error/10 transition-colors text-left"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                              Eliminar
                            </button>
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
            <div className="bg-surface-container-low p-4 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-sm text-on-surface-variant">Mostrando {filteredProducts.length} de {products.length} productos</p>
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
          className={`hidden @md:block transition-all duration-300 ease-in-out overflow-hidden ${
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
            setDeleteTargetId={setDeleteTargetId}
            setShowDeleteModal={setShowDeleteModal}
          />
        </div>
      </div>

      {/* Mobile detail panel (bottom sheet) — uses viewport lg since it's fixed overlay */}
      {showMobilePanel && (
        <div className={`fixed inset-0 z-50 flex items-end lg:hidden transition-opacity duration-300 ${animateIn ? "opacity-100" : "opacity-0"}`}>
          <div className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${animateIn ? "opacity-100" : "opacity-0"}`} onClick={() => setShowMobilePanel(false)} />
          <div className={`relative bg-white rounded-t-2xl shadow-xl w-full max-h-[80vh] overflow-y-auto pb-6 transition-transform duration-300 ease-out ${animateIn ? "translate-y-0" : "translate-y-full"}`}>
            <div className="sticky top-0 bg-white pt-4 pb-2 px-4 border-b border-outline-variant flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="font-semibold text-lg text-primary">Detalles del Producto</h3>
              <div className="flex items-center gap-1">
                {!editing && (
                  <button onClick={() => { setEditing(true); }} className="p-2 text-secondary hover:bg-surface-container-low rounded-lg">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                )}
                <button onClick={() => setShowMobilePanel(false)} className="p-2 hover:bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
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
                setDeleteTargetId={setDeleteTargetId}
                setShowDeleteModal={setShowDeleteModal}
                mobile
              />
            </div>
          </div>
        </div>
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
                  onClick={() => { setSelected(p); setHighlightedId(p.id); setStockModalType(null); }}
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

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-xl border border-outline-variant shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-error">delete</span>
              </div>
              <h3 className="font-bold text-lg text-primary mb-2">Eliminar Producto</h3>
              <p className="text-sm text-on-surface-variant">¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.</p>
            </div>
            <div className="p-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-bright">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-bold hover:bg-surface-container-low transition-colors">
                Cancelar
              </button>
              <button onClick={() => { deleteProduct(deleteTargetId); setShowDeleteModal(false); setShowMobilePanel(false); }} className="px-4 py-2 rounded-lg bg-error text-on-error text-sm font-bold hover:opacity-90 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-base">delete</span>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailPanel({ selected, editing, draft, setEditing, updateDraft, saveEditing, cancelEditing, handleImageUpload, getStockColor, setDeleteTargetId, setShowDeleteModal, mobile }) {
  const caractRef = useRef(null);
  useEffect(() => {
    if (editing && caractRef.current) {
      caractRef.current.style.height = "auto";
      caractRef.current.style.height = caractRef.current.scrollHeight + "px";
    }
  }, [editing, draft.caracteristicas]);
  return (
    <div className={`w-full ${mobile ? "" : "@md:w-[420px]"} bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden`}>
      {!mobile && (
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
      )}
      {mobile && editing && (
        <div className="p-4 border-b border-outline-variant flex items-center justify-end gap-2">
          <button onClick={cancelEditing} className="text-xs font-bold text-outline uppercase hover:underline px-3 py-1 border border-outline-variant rounded-lg">Cancelar</button>
          <button onClick={saveEditing} className="text-xs font-bold text-on-secondary uppercase hover:underline px-3 py-1 bg-secondary rounded-lg">Guardar</button>
        </div>
      )}
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
            ref={caractRef}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-primary resize-none focus:ring-2 focus:ring-secondary/20 overflow-hidden"
            rows={editing ? 1 : 3}
            readOnly={!editing}
            value={editing ? draft.caracteristicas || "" : selected.caracteristicas || ""}
            onChange={(e) => {
              updateDraft("caracteristicas", e.target.value);
              if (editing) { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }
            }}
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
        <button type="button" onClick={() => { setDeleteTargetId(selected.id); setShowDeleteModal(true); }} className="w-full bg-error/10 text-error py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-error/20 transition-all mt-2">
          <span className="material-symbols-outlined">delete</span>
        </button>
      </form>
    </div>
  );
}
