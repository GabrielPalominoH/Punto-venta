import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { db } from "../utils/db";

const categories = ["TODOS", "MOTORES", "ELECTRÓNICA", "EQUIPAMIENTO", "ANZUELOS", "CAÑAS", "CARRETES", "SEÑUELOS", "HILOS"];

const paymentMethods = [
  { id: "cash", icon: "payments", label: "Efectivo" },
  { id: "yape", icon: "qr_code_2", label: "Yape/Plin" },
];

const formatPrice = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pad = (n) => String(n).padStart(2, "0");
const today = () => {
  const d = new Date();
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};
const nextReceiptId = () => {
  const key = "marlin_receipt_counter";
  const val = parseInt(localStorage.getItem(key) || "0", 10) + 1;
  localStorage.setItem(key, String(val));
  return `BOLETA-${today()}-${String(val).padStart(4, "0")}`;
};

export default function PuntoVenta() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState(() => db.getProducts());
  const [cart, setCart] = useState([]);
  const [activeCat, setActiveCat] = useState("TODOS");
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [barcode, setBarcode] = useState("");
  const [customer, setCustomer] = useState("");
  const [payment, setPayment] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const barcodeRef = useRef(null);
  const [showMobileCart, setShowMobileCart] = useState(false);

  useEffect(() => {
    db.saveProducts(products);
  }, [products]);

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  const updateSearch = (value) => {
    setSearch(value);
    const nextParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const filtered = products.filter((p) => {
    const catMatch = activeCat === "TODOS" || p.category.toUpperCase() === activeCat;
    const searchMatch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  const cartItemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  useEffect(() => {
    if (showReceipt) setShowMobileCart(false);
  }, [showReceipt]);

  useEffect(() => {
    if (barcode.length >= 6) {
      const found = products.find(
        (p) => p.code.toLowerCase() === barcode.toLowerCase()
      );
      if (found && found.stock > 0) addToCart(found);
      setBarcode("");
      if (barcodeRef.current) barcodeRef.current.focus();
    }
  }, [barcode]);

  const getStock = (id) => {
    const p = products.find((x) => x.id === id);
    return p ? p.stock : 0;
  };

  const getCartQty = (id) => {
    const c = cart.find((x) => x.id === id);
    return c ? c.qty : 0;
  };

  const addToCart = (product) => {
    const available = getStock(product.id);
    const inCart = getCartQty(product.id);
    if (inCart >= available) return;

    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist)
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    const available = getStock(id);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const newQty = item.qty + delta;
          if (newQty > available) return { ...item, qty: available };
          return { ...item, qty: Math.max(1, newQty) };
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id) =>
    setCart((prev) => prev.filter((item) => item.id !== id));

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const receiptRef = useRef(null);
  const pdfRef = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPDF = useCallback(async () => {
    if (!lastSale) return;
    setPdfLoading(true);
    try {
      const el = pdfRef.current;
      if (!el) return;
      el.style.display = "block";
      await new Promise((r) => setTimeout(r, 100));
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      });
      el.style.display = "none";
      const imgData = canvas.toDataURL("image/png");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pw = 210;
      const ph = (canvas.height / canvas.width) * pw;
      doc.addImage(imgData, "PNG", 0, 0, pw, ph, undefined, "FAST");
      if (ph > 297) {
        let top = 297;
        while (top < ph) {
          doc.addPage();
          doc.addImage(imgData, "PNG", 0, -top, pw, ph, undefined, "FAST");
          top += 297;
        }
      }
      doc.save(`${lastSale.id}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
    }
    setPdfLoading(false);
  }, [lastSale]);

  const confirmSale = () => {
    if (cart.length === 0 || !payment) return;

    const saleTotal = total;
    const newSale = {
      id: nextReceiptId(),
      items: [...cart],
      total: saleTotal,
      payment,
      customer: customer || "Consumidor Final",
      date: new Date().toLocaleString("es-PE"),
    };

    setLastSale(newSale);

    setProducts((prev) =>
      prev.map((p) => {
        const sold = cart.find((c) => c.id === p.id);
        return sold ? { ...p, stock: Math.max(0, p.stock - sold.qty) } : p;
      })
    );

    const currentSales = db.getSales();
    db.saveSales([...currentSales, newSale]);

    db.addActivity(
      "add_shopping_cart",
      "bg-secondary-container/20 text-secondary",
      `Venta en mostrador por <strong>Carlos M.</strong>`,
      `Boleta ${newSale.id} · Hace un momento`,
      `S/ ${saleTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      "text-primary"
    );

    setCart([]);
    setPayment(null);
    setShowReceipt(true);
  };

  const lowStockThreshold = db.getLowStockThreshold();

  const StockBadge = ({ stock }) => {
    if (stock === 0)
      return (
        <span className="text-xs font-bold text-rose-stock bg-rose-50 px-2 py-0.5 rounded">
          AGOTADO
        </span>
      );
    if (stock <= lowStockThreshold)
      return (
        <span className="text-xs font-bold text-amber-stock bg-amber-50 px-2 py-0.5 rounded">
          {stock} uds
        </span>
      );
    return (
      <span className="text-xs text-secondary font-bold">{stock} uds</span>
    );
  };

  return (
    <>
      <div className="pos-shell flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] -mx-4 lg:-mx-6 -mb-6 max-w-full">
        <section className="pos-content flex-1 min-w-0 overflow-y-auto p-6 lg:p-6 space-y-4 lg:space-y-6 scrollbar-hide bg-surface lg:bg-surface-container-low pb-36 lg:pb-0">
          <div className="pos-toolbar flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                search
              </span>
              <input
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                className="w-full bg-white border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                placeholder="Buscar productos por nombre o código..."
              />
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2 bg-white border border-outline-variant px-4 py-2 rounded-lg shrink-0">
              <span className="material-symbols-outlined text-secondary text-lg">
                barcode_scanner
              </span>
              <input
                ref={barcodeRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="min-w-0 flex-1 bg-transparent border-none p-0 text-sm focus:ring-0 sm:w-28 outline-none"
                placeholder="Escanear"
              />
            </div>
          </div>

          <div className="pos-categories -mx-6 px-6 lg:mx-0 lg:px-0 flex items-center gap-3 lg:gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`px-6 lg:px-5 py-1 lg:py-2 rounded-full text-xs font-bold tracking-wider whitespace-nowrap active:scale-95 transition-all ${
                  activeCat === cat
                    ? "max-lg:bg-secondary-container max-lg:text-on-secondary-container lg:bg-primary lg:text-on-primary lg:shadow-sm"
                    : "max-lg:bg-surface-variant max-lg:text-on-surface-variant lg:bg-white lg:border lg:border-outline-variant lg:text-on-surface-variant lg:hover:bg-surface-container"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="pos-products grid grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 lg:gap-6">
            {filtered.map((p) => {
              const inCart = getCartQty(p.id);
              const soldOut = p.stock === 0;
              return (
                <div
                  key={p.id}
                  className={`pos-product-card group bg-surface-container-lowest border rounded-xl overflow-hidden transition-all duration-300 flex flex-col ${
                    soldOut
                      ? "border-rose-200 opacity-60"
                      : "border-outline-variant hover:shadow-lg"
                  }`}
                >
                  <div className="max-lg:aspect-square lg:h-44 overflow-hidden relative bg-surface-container-high flex items-center justify-center">
                    {p.image && (p.image.startsWith("http") || p.image.startsWith("data:")) ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = "none";
                          const fallback = e.target.nextSibling;
                          if (fallback) {
                            fallback.classList.remove("hidden");
                            fallback.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                        p.image && (p.image.startsWith("http") || p.image.startsWith("data:")) ? "hidden" : ""
                      } ${
                        soldOut
                          ? "bg-rose-100 text-rose-stock"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {p.image && p.image.length <= 3 ? p.image : p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="lg:hidden absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container/90 text-on-secondary-container">
                      {soldOut ? "AGOTADO" : `${p.stock} uds`}
                    </span>
                    <div className="max-lg:hidden absolute top-3 right-3">
                      <span className="bg-black/50 text-white text-xs font-bold px-2.5 py-1.5 rounded backdrop-blur-sm border border-white/20 shadow-sm">
                        S/ {formatPrice(p.price)}
                      </span>
                    </div>
                    {soldOut && (
                      <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                        <span className="bg-rose-stock text-white text-xs font-bold px-3 py-1 rounded-full rotate-[-15deg]">
                          AGOTADO
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 lg:p-4 flex flex-col flex-grow space-y-1 lg:space-y-2">
                    <div className="max-lg:hidden flex items-center justify-between">
                      <p className="text-xs font-bold text-secondary uppercase tracking-wider">
                        {p.category}
                      </p>
                      <span className="text-[10px] text-outline font-mono">
                        {p.code}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base min-[380px]:text-lg text-on-surface leading-6 min-[380px]:leading-7 line-clamp-2 mb-1">
                      {p.name}
                    </h3>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <span className="max-lg:hidden"><StockBadge stock={p.stock} /></span>
                      <span className="text-secondary font-bold text-base min-[380px]:text-lg leading-tight">S/ {formatPrice(p.price)}</span>
                      {soldOut ? (
                        <span className="text-xs text-on-surface-variant italic max-lg:hidden">No disponible</span>
                      ) : (
                        <button
                          onClick={() => addToCart(p)}
                          className="w-8 h-8 shrink-0 rounded-lg bg-secondary text-on-secondary flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                      )}
                    </div>
                    {inCart > 0 && (
                      <div className="max-lg:hidden text-[10px] text-secondary font-bold">
                        {inCart} en carrito
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="hidden lg:flex w-full lg:w-[420px] border-t lg:border-t-0 lg:border-l border-outline-variant bg-white flex-col max-h-[50vh] lg:max-h-none">
          <div className="p-4 border-b border-outline-variant bg-surface-bright">
            <h2 className="font-semibold flex items-center gap-2 text-lg">
              <span className="material-symbols-outlined text-secondary fill">
                shopping_cart
              </span>
              Carrito de Venta
              {cartItemCount > 0 && (
                <span className="ml-auto bg-secondary text-on-secondary text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </h2>
          </div>

          <div className="p-4 border-b border-outline-variant bg-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                person
              </span>
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-on-surface-variant"
                placeholder="Nombre del cliente (opcional)"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl mb-3">
                  shopping_cart
                </span>
                <p className="font-semibold">Carrito vacío</p>
                <p className="text-sm">Seleccione productos o escanee un código</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant"
                >
                  <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden flex items-center justify-center text-outline font-bold text-sm shrink-0 relative">
                    {item.image && (item.image.startsWith("http") || item.image.startsWith("data:")) ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{item.image && item.image.length <= 3 ? item.image : item.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      S/ {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-7 h-7 rounded border border-outline-variant hover:bg-secondary hover:text-white flex items-center justify-center text-sm transition-colors"
                    >
                      -
                    </button>
                    <span className="text-sm w-6 text-center font-bold">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      disabled={item.qty >= getStock(item.id)}
                      className="w-7 h-7 rounded border border-outline-variant hover:bg-secondary hover:text-white flex items-center justify-center text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <p className="text-sm font-bold">
                      S/ {formatPrice(item.price * item.qty)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-error hover:opacity-70 p-1"
                  >
                    <span className="material-symbols-outlined text-lg">
                      delete
                    </span>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-surface-container-lowest border-t border-outline-variant space-y-3 shadow-inner">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xl border-t border-outline-variant pt-1">
                <span className="font-bold">TOTAL</span>
                <span className="font-bold text-secondary">
                  S/ {formatPrice(total)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Método de Pago
              </p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPayment(pm.id)}
                    className={`flex flex-col items-center justify-center py-3 rounded-lg transition-all ${
                      payment === pm.id
                        ? "border-2 border-secondary bg-secondary/10 text-secondary"
                        : "border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-2xl ${
                        payment === pm.id ? "fill" : ""
                      }`}
                    >
                      {pm.icon}
                    </span>
                    <span className="text-[10px] font-bold mt-1 uppercase">
                      {pm.label}
                    </span>
                  </button>
                ))}
              </div>
              {payment && (
                <p className="text-[10px] text-secondary font-semibold text-center">
                  ✓ {paymentMethods.find((p) => p.id === payment)?.label} seleccionado
                </p>
              )}
            </div>

            <button
              onClick={confirmSale}
              disabled={cart.length === 0 || !payment}
              className="w-full bg-secondary text-on-secondary py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <span className="material-symbols-outlined">description</span>
              Confirmar Venta y Generar Boleta
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile sticky cart bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="mx-3 min-[380px]:mx-6 mb-3 bg-primary-container text-on-primary border border-outline-variant/30 rounded-xl px-4 min-[380px]:px-6 py-3 flex items-center justify-between gap-3 shadow-lg backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined">shopping_cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartItemCount}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-wider opacity-70">TOTAL</p>
              <p className="truncate font-semibold text-base min-[380px]:text-lg">S/ {formatPrice(total)}</p>
            </div>
          </div>
          <button
            onClick={() => setShowMobileCart(true)}
            className="shrink-0 bg-secondary text-on-secondary px-4 min-[380px]:px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-1 active:scale-95 transition-transform"
          >
            Ver Carrito
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Mobile cart bottom sheet */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest rounded-t-2xl max-h-[88dvh] flex flex-col animate-slide-up shadow-2xl">
            <div className="sticky top-0 bg-surface-container-lowest p-4 border-b border-outline-variant rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                  <h2 className="min-w-0 font-semibold flex items-center gap-2 text-base sm:text-lg">
                    <span className="material-symbols-outlined text-secondary fill">shopping_cart</span>
                    <span className="truncate">Carrito de Venta</span>
                  {cartItemCount > 0 && (
                    <span className="ml-auto bg-secondary text-on-secondary text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </h2>
                <button onClick={() => setShowMobileCart(false)} className="p-1 hover:bg-surface-container rounded-full -mr-1">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">person</span>
                  <input
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent border-none outline-none text-sm placeholder:text-on-surface-variant"
                    placeholder="Nombre del cliente (opcional)"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl mb-3">shopping_cart</span>
                  <p className="font-semibold">Carrito vacío</p>
                  <p className="text-sm">Seleccione productos o escanee un código</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[48px_minmax(0,1fr)_auto] sm:flex sm:items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant"
                  >
                    <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden flex items-center justify-center text-outline font-bold text-sm shrink-0 relative">
                      {item.image && (item.image.startsWith("http") || item.image.startsWith("data:")) ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{item.image && item.image.length <= 3 ? item.image : item.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{item.name}</p>
                      <p className="text-xs text-on-surface-variant">S/ {formatPrice(item.price)}</p>
                    </div>
                    <div className="col-start-2 flex items-center gap-1 sm:col-start-auto">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-7 h-7 rounded border border-outline-variant hover:bg-secondary hover:text-white flex items-center justify-center text-sm transition-colors"
                      >-</button>
                      <span className="text-sm w-6 text-center font-bold">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        disabled={item.qty >= getStock(item.id)}
                        className="w-7 h-7 rounded border border-outline-variant hover:bg-secondary hover:text-white flex items-center justify-center text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >+</button>
                    </div>
                    <div className="col-start-2 text-left sm:text-right sm:min-w-[70px]">
                      <p className="text-sm font-bold">S/ {formatPrice(item.price * item.qty)}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="col-start-3 row-start-1 self-start text-error hover:opacity-70 p-1 sm:row-start-auto sm:self-auto"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant space-y-3 shadow-inner">
              <div className="space-y-1.5">
                <div className="flex justify-between gap-3 text-lg sm:text-xl border-t border-outline-variant pt-1">
                  <span className="font-bold">TOTAL</span>
                  <span className="font-bold text-secondary text-right">S/ {formatPrice(total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Método de Pago</p>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => setPayment(pm.id)}
                      className={`flex flex-col items-center justify-center py-3 rounded-lg transition-all ${
                        payment === pm.id
                          ? "border-2 border-secondary bg-secondary/10 text-secondary"
                          : "border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-2xl ${payment === pm.id ? "fill" : ""}`}>{pm.icon}</span>
                      <span className="text-[10px] font-bold mt-1 uppercase">{pm.label}</span>
                    </button>
                  ))}
                </div>
                {payment && (
                  <p className="text-[10px] text-secondary font-semibold text-center">
                    ✓ {paymentMethods.find((p) => p.id === payment)?.label} seleccionado
                  </p>
                )}
              </div>

              <button
                onClick={confirmSale}
                disabled={cart.length === 0 || !payment}
                className="w-full bg-secondary text-on-secondary py-3.5 px-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm sm:text-base"
              >
                <span className="material-symbols-outlined">description</span>
                Confirmar Venta y Generar Boleta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden A4 receipt for PDF capture */}
      {lastSale && (
        <div
          ref={pdfRef}
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: 750,
            background: "#fff",
            fontFamily: "Inter, sans-serif",
            zIndex: -1,
            display: "none",
          }}
        >
          <div style={{ border: "1px solid #c6c6cd", overflow: "hidden" }}>
            <div style={{ padding: "20px 28px", borderBottom: "1px solid #c6c6cd", background: "#fcf8fa", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#00687a", textTransform: "uppercase" }}>Documento Electrónico</span>
                <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", color: "#000", marginTop: 2 }}>Boleta de Venta</h2>
                <p style={{ fontSize: 10, color: "#45464d", marginTop: 1 }}>R.U.C. 20601234567</p>
              </div>
              <div style={{ background: "#57dffe", border: "1px solid rgba(0,104,122,0.2)", borderRadius: 6, padding: "8px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#006172" }}>NÚMERO DE BOLETA</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#001f26", marginTop: 1 }}>{lastSale.id}</span>
              </div>
            </div>
            <div style={{ padding: "16px 28px", borderBottom: "1px solid #c6c6cd", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", textTransform: "uppercase", marginBottom: 6 }}>Datos del Cliente</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: "#00687a" }}>●</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b1d" }}>{lastSale.customer}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, color: "#00687a" }}>●</span>
                  <span style={{ fontSize: 10, color: "#45464d" }}>{paymentMethods.find((p) => p.id === lastSale.payment)?.label}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <h3 style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", textTransform: "uppercase", marginBottom: 6 }}>Fecha de Emisión</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: "#00687a" }}>●</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b1d" }}>
                    {(() => { const p = lastSale.date.split(", "); return p[0] || lastSale.date })()}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 14, color: "#76777d" }}>●</span>
                  <span style={{ fontSize: 10, color: "#45464d" }}>
                    {(() => { const p = lastSale.date.split(", "); return p[1] || "" })()}
                  </span>
                </div>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f0edef" }}>
                  <th style={{ padding: "8px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd" }}>Descripción</th>
                  <th style={{ padding: "8px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd", textAlign: "center" }}>Cant.</th>
                  <th style={{ padding: "8px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd", textAlign: "right" }}>Unitario</th>
                  <th style={{ padding: "8px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody style={{ borderBottom: "1px solid #c6c6cd" }}>
                {lastSale.items.map((item, i) => (
                  <tr key={i} style={i % 2 ? { background: "#f6f3f5" } : {}}>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#1b1b1d" }}>{item.name}</span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center", fontSize: 10, color: "#1b1b1d" }}>{item.qty}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: "#1b1b1d" }}>S/ {formatPrice(item.price)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#00687a" }}>S/ {formatPrice(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "16px 28px", background: "#fcf8fa", borderTop: "1px solid #c6c6cd", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: 300 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                  <span style={{ fontSize: 10, color: "#45464d" }}>Subtotal</span>
                  <span style={{ fontSize: 10, color: "#1b1b1d" }}>S/ {formatPrice(lastSale.total)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid #c6c6cd" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#000", textTransform: "uppercase", letterSpacing: "-0.01em" }}>Total a Pagar</span>
                  <span style={{ fontSize: 17, fontWeight: 700, color: "#00687a" }}>S/ {formatPrice(lastSale.total)}</span>
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 28px", textAlign: "center", borderTop: "1px solid #c6c6cd", background: "#fff" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#00687a", fontStyle: "italic", margin: "0 0 4px" }}>¡Gracias por su compra!</p>
              <p style={{ fontSize: 10, color: "#76777d", margin: 0 }}>Marlin Poseidon - Expertos en Pesca Deportiva &amp; Tackle Profesional</p>
            </div>
          </div>
        </div>
      )}

      {/* Stitch-style Boleta Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-4 sm:py-8" onClick={() => setShowReceipt(false)}>
          <div className="animate-[scaleIn_0.2s_ease-out] w-full max-w-[500px] mx-3 sm:mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Receipt card */}
            <div ref={receiptRef} className="bg-white border border-[#c6c6cd] shadow-sm rounded-xl overflow-hidden" data-keep-white={true}>
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-[#c6c6cd] bg-[#fcf8fa] flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex flex-col">
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#00687a", textTransform: "uppercase" }}>Documento Electrónico</span>
                  <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", color: "#000", marginTop: 4 }}>
                    Boleta de Venta
                  </h2>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#45464d", marginTop: 2 }}>R.U.C. 20601234567</p>
                </div>
                <div style={{ background: "#57dffe", border: "1px solid rgba(0,104,122,0.2)", borderRadius: 8, padding: "12px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#006172" }}>NÚMERO DE BOLETA</span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 600, color: "#001f26", marginTop: 2 }}>{lastSale.id}</span>
                </div>
              </div>

              {/* Customer & Date */}
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#c6c6cd]">
                <div className="space-y-2">
                  <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", textTransform: "uppercase" }}>Datos del Cliente</h3>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#00687a" }}>person</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 600, color: "#1b1b1d" }}>{lastSale.customer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#00687a" }}>payments</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#45464d" }}>{paymentMethods.find((p) => p.id === lastSale.payment)?.label}</span>
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", textTransform: "uppercase" }}>Fecha de Emisión</h3>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#00687a" }}>calendar_today</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 600, color: "#1b1b1d" }}>
                      {(() => { const p = lastSale.date.split(", "); return p[0] || lastSale.date })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#76777d" }}>schedule</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#45464d" }}>
                      {(() => { const p = lastSale.date.split(", "); return p[1] || "" })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ background: "#f0edef" }}>
                      <th className="px-4 py-2" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd" }}>Descripción</th>
                      <th className="px-4 py-2 text-center" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd" }}>Cant.</th>
                      <th className="px-4 py-2 text-right" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd" }}>Unitario</th>
                      <th className="px-4 py-2 text-right" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#76777d", borderBottom: "1px solid #c6c6cd" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody style={{ borderBottom: "1px solid #c6c6cd" }}>
                    {lastSale.items.map((item, i) => (
                      <tr key={i} className="hover:bg-[#f6f3f5]" style={i % 2 ? { background: "#f6f3f5" } : {}}>
                        <td className="px-4 py-3">
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 600, color: "#1b1b1d" }}>{item.name}</p>
                        </td>
                        <td className="px-4 py-3 text-center" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#1b1b1d" }}>{item.qty}</td>
                        <td className="px-4 py-3 text-right" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#1b1b1d" }}>S/ {formatPrice(item.price)}</td>
                        <td className="px-4 py-3 text-right" style={{ fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 600, color: "#00687a" }}>S/ {formatPrice(item.price * item.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="p-6 bg-[#fcf8fa] flex justify-end border-t border-[#c6c6cd]">
                <div style={{ width: 300 }} className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#45464d" }}>Subtotal</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#1b1b1d" }}>S/ {formatPrice(lastSale.total)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-[#c6c6cd]">
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 700, color: "#000", textTransform: "uppercase", letterSpacing: "-0.01em" }}>Total a Pagar</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 24, fontWeight: 700, color: "#00687a" }}>S/ {formatPrice(lastSale.total)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 text-center border-t border-[#c6c6cd] bg-white space-y-2" data-keep-white={true}>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 700, color: "#00687a", fontStyle: "italic" }}>¡Gracias por su compra!</p>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#76777d" }}>Marlin Poseidon - Expertos en Pesca Deportiva &amp; Tackle Profesional</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 bg-white border border-outline-variant text-on-surface font-bold py-3 rounded-lg hover:bg-surface-container-highest transition-all text-sm"
              >
                Nueva Venta
              </button>
              <button
                onClick={() => { downloadPDF(); setShowReceipt(false); }}
                disabled={pdfLoading}
                className="flex-1 bg-[#00687a] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">
                  {pdfLoading ? "hourglass_top" : "download"}
                </span>
                {pdfLoading ? "Generando..." : "Descargar PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
