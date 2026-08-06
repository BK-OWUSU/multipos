"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { 
  Search, Scan, Plus, User, ShoppingCart, Wifi, Trash2,
  X, Smartphone, DollarSign, Check, PlusCircle, MinusCircle, Layers,
  Tag,
} from "lucide-react";
import Image from "next/image";
import { useProductStore } from "@/store/productsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Discount, ProductsVariants } from "@/types/schema/inventory";
import { useCategoryStore } from "@/store/categoryStore";
import { useCustomerStore } from "@/store/customerStore"; 
import { POSCheckoutInput } from "@/types/schema/sale.schema";
import CheckoutButton from "@/components/pos/CheckoutButton";
import { Customer } from "@/types/auth/auth";
import { useSaleStore } from "@/store/saleStore";
import SelectedProductTray from "./SelectedProductTray";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { toast } from "sonner";
import { useDiscountStore } from "@/store/discountStore";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/notification.store";

export interface POSCustomer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  businessId: string;
  createdAt: Date;
}

interface CartItemState {
  product: ProductsVariants;
  quantity: number;
}


export default function SaleTerminalPage() {
  // 1. GLOBAL STORE CONNECTORS
  const { user } = useAuthStore();
  const { fetchProductsVariantByShop,productsShopsVariants} = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { activeSession,fetchActiveCashSession} = useSaleStore();
  const {activeDiscounts, fetchDiscounts} = useDiscountStore()
  const {fetchNotifications} = useNotificationStore();

  const PRODUCTS: ProductsVariants[] | null = productsShopsVariants;

  // LOCAL UI STATES
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [activeProduct, setActiveProduct] = useState<ProductsVariants | null>(null);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [sortBy, setSortBy] = useState("name-az"); 

  // PAYMENT STATES (Added SPLIT support)
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOMO" | "SPLIT">("CASH");
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [momoPaid, setMomoPaid] = useState<number>(0);
  
  // CUSTOMER STATES
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // LOCAL CART STATE
  const [cart, setCart] = useState<CartItemState[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [isDiscountDropdownOpen, setIsDiscountDropdownOpen] = useState(false);

  const selectedProduct = activeProduct || (PRODUCTS && PRODUCTS.length > 0 ? PRODUCTS[0] : null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // LIFECYCLE DISPATCHERS
  useEffect(() => {
    fetchCategories();
    fetchActiveCashSession();
    fetchProductsVariantByShop();
    if (typeof fetchCustomers === "function") {
      fetchCustomers();
    }
    fetchDiscounts();
  }, [fetchCategories, fetchCustomers,fetchActiveCashSession,fetchProductsVariantByShop,fetchDiscounts]);

// Filter customers matching query rules with your explicit Customer type
const filteredCustomers = useMemo<Customer[]>(() => {
  if (!customers) return [];
  const lower = customerSearchQuery.toLowerCase().trim();
  if (!lower) return customers as Customer[];
  
  return (customers as Customer[]).filter((c: Customer) => {
    const fullName = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(lower) || 
      c.phone?.includes(lower) || 
      c.email?.toLowerCase().includes(lower)
    );
  });
}, [customers, customerSearchQuery]);

  // Filter products by dynamic Category Tray selection & top bar search query
  const filteredProducts = (PRODUCTS || []).filter((prod) => {
    const matchesCategory = selectedCategory === "All" || prod.category?.name === selectedCategory; 
    const lowerQuery = searchQuery.toLowerCase().trim();
    if (!lowerQuery) return matchesCategory;
    const matchesName = prod.displayName?.toLowerCase().includes(lowerQuery);
    const matchesSku = prod.sku?.toLowerCase().includes(lowerQuery);
    const matchesBarcode = prod.barcode?.toLowerCase().includes(lowerQuery);

    return matchesCategory && (matchesName || matchesSku || matchesBarcode);
  });

  // Sort base array outputs
  const sortedProducts = useMemo(() => {
    const baseProducts = [...filteredProducts];
    if (sortBy === "name-az") {
      return baseProducts.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
    }
    if (sortBy === "price-lh") {
      return baseProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    }
    return baseProducts;
  }, [filteredProducts, sortBy]); 

  const dynamicCategories = useMemo(() => {
    if (!categories || categories.length === 0) return ["All"];
    const dbCategoryNames = categories.map((cat: { name: string }) => cat.name);
    return ["All", ...dbCategoryNames];
  }, [categories]);

  // ── INTERACTIVE CART STATE ENGINE ACTIONS ──
  const handleAddToCart = (product: ProductsVariants | null) => {
    if (!product) return;
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].quantity += 1;
        return updatedCart;
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, increment: boolean) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = increment ? item.quantity + 1 : item.quantity - 1;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

const handleClearCart = () => {
  setCart([]);
  setSelectedDiscount(null);
};

  // ── MATHEMATICAL LIVE TOTAL CALCULATIONS ──
  // const cartTotals = useMemo(() => {
  //   return cart.reduce(
  //     (acc, item) => {
  //       const itemPrice = Number(item.product.price) || 0;
  //       return {
  //         total: acc.total + itemPrice * item.quantity,
  //         count: acc.count + item.quantity,
  //       };
  //     },
  //     { total: 0, count: 0 }
  //   );
  // }, [cart]);

  const cartTotals = useMemo(() => {
  // 1. Standard raw subtotal accumulation
  const subtotal = cart.reduce((acc, item) => {
    const itemPrice = Number(item.product.price) || 0;
    return acc + (itemPrice * item.quantity);
  }, 0);

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

 // 2. Compute discount with strict number casting
  let discountAmount = 0;
  if (selectedDiscount && subtotal > 0) {
    const discountValue = Number(selectedDiscount.value) || 0;

    if (selectedDiscount.type === "PERCENTAGE") {
      discountAmount = (subtotal * discountValue) / 100;
    } else if (selectedDiscount.type === "FIXED") {
      discountAmount = discountValue;
    }
  }

  // 3. Protect against negative price outcomes
  const total = Math.max(0, subtotal - discountAmount);

  return {
    subtotal,
    discountAmount,
    total,
    count: itemCount,
  };
}, [cart, selectedDiscount]);

  // Split-payment live balancing computations
  const splitRemaining = useMemo(() => {
    if (paymentMethod !== "SPLIT") return 0;
    const remaining = cartTotals.total - (cashPaid + momoPaid);
    return Number(remaining.toFixed(2));
  }, [paymentMethod, cartTotals.total, cashPaid, momoPaid]);

  // Checkout block validation checker
  const isCheckoutDisabled = useMemo(() => {
    if (cart.length === 0) return true;
    if (paymentMethod === "SPLIT" && splitRemaining !== 0) return true;
    return false;
  }, [cart.length, paymentMethod, splitRemaining]);

  // Global Keyboard listener hook (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          setTimeout(() => { searchInputRef.current?.select(); }, 0);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  // System Live Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── REAL TIME TRANSACTION PAYLOAD COMPILER ──
const currentCheckoutPayload = useMemo<POSCheckoutInput>(() => {
  return {
    // Explicitly cast or enforce string fallbacks to clear out potential 'any' bounds from stores
    businessId: (user?.business?.id as string),
    shopId: (user?.currentShop?.id as string), 
    employeeId: (user?.id as string),
    cashSessionId: (activeSession?.id as string), 
    
    customerId: selectedCustomer ? selectedCustomer.id : null,
    
    // Safely transform db 'null' value to 'undefined' or empty string to satisfy Zod signature
    customerEmail: selectedCustomer ? (selectedCustomer.email ?? "") : "",
    
    paymentMethod: paymentMethod,

    totalAmount: cartTotals.total,
    discountAmount: cartTotals.discountAmount,
    discountId: selectedDiscount ? selectedDiscount.id : null,

    cashPaid: paymentMethod === "CASH" ? cartTotals.total : paymentMethod === "SPLIT" ? cashPaid : 0,
    momoPaid: paymentMethod === "MOMO" ? cartTotals.total : paymentMethod === "SPLIT" ? momoPaid : 0,
    
    cartItems: cart.map((item) => ({
      productVariantId: item.product.id, 
      quantity: item.quantity,
      unitPrice: Number(item.product.price) || 0,
      costPrice: Number(item.product.costPrice) || Number(item.product.price) * 0.7 
    }))
  };
}, [user?.business?.id, user?.currentShop, user?.id, activeSession, selectedCustomer, paymentMethod, cartTotals.total, cashPaid, momoPaid, cart, cartTotals.discountAmount,selectedDiscount]);

  const handleSaleSuccess = (saleId: string) => {
    toast.success(`Transaction processing complete!`);
    handleClearCart();
    setCashPaid(0); 
    setMomoPaid(0);
    setSelectedCustomer(null);
    setPaymentMethod("CASH");
    fetchNotifications();
  };

  return (
    <div className="flex gap-2 rounded-md sticky top-2 flex-col h-screen w-full text-slate-800 antialiased overflow-hidden">
      
      <div className="flex flex-1 flex-col lg:flex-row overflow-y-auto lg:overflow-hidden gap-4 p-2 lg:p-0">
          
        <main className="flex-1 flex flex-col lg:overflow-hidden p-4 sm:p-5 space-y-4 bg-slate-50 rounded-xl border border-slate-200/60 shadow-sm">
          {/* Top Bar Utilities */}
          <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-md border border-slate-100">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 flex-1 w-full">
              <div className="relative flex-1 min-w-50">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  type="text" 
                  placeholder="Search products by name, SKU or barcode..." 
                  className="w-full pl-10 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <kbd className="hidden sm:inline-block absolute right-3 top-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border rounded shadow-sm">Ctrl + K</kbd>
              </div>

              <button className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex-1 sm:flex-none">
                <Scan className="h-4 w-4 text-slate-600" />
                <span className="text-slate-700 whitespace-nowrap">Scan Barcode</span>
              </button>

              <button className="p-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg shadow-sm transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </header>
          
          {/* Categories Horizontal Tray Container */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {dynamicCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === cat ? "bg-blue-900 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <select 
                className="bg-white border border-slate-200 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none flex-1 sm:flex-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name-az">🔢 Sort: Name (A-Z)</option>
                <option value="price-lh">🔢 Sort: Price (Low to High)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Grid Mapping DB Products */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 p-4 min-h-87.5">
            {sortedProducts && sortedProducts.length > 0 ? (
              sortedProducts.map((prod) => (
                <div 
                  key={prod.id}
                  onClick={() => setActiveProduct(prod)}
                  className={`bg-white border max-h-64 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer relative group ${
                    selectedProduct?.id === prod.id ? "ring-2 ring-blue-950 border-transparent" : "border-slate-200"
                  }`}
                >
                  <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 ${
                    prod.stock <= (prod.lowStockAlert || 0) ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                  }`}>
                    {prod.stock}
                  </span>
                  <div className="bg-slate-50 rounded-lg aspect-square w-full mb-3 flex items-center justify-center overflow-hidden border border-slate-100 relative">
                    <Image
                      src={prod.imageUrl || "/imgs/no-product-image.png"}
                      alt={prod.displayName || "Product Graphic UI"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{prod.displayName}</h4>
                    <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">SKU: {prod.sku}</p>
                    <div className="pt-1 flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{<CurrencyFormatter amount = {prod.costPrice || 0} />}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <ShoppingCart className="h-7 w-7 text-slate-400 mb-4" />
                <h3 className="text-sm font-bold text-slate-700">No Inventory Items Matches Found</h3>
              </div>
            )}
          </div>
          <SelectedProductTray
            selectedVariant={selectedProduct}
            quantityInCart={
              cart.find((item) => item.product.id === selectedProduct?.id)?.quantity || 0
            }
            onAddToCart={handleAddToCart}
          />
        </main>

        {/* RIGHT SIDEBAR ACTION CONTROL BASKET */}
        <aside className="w-full lg:w-100 bg-white flex flex-col overflow-hidden shrink-0 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <span>Cart Tray</span>
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">{cartTotals.count}</span>
            </h2>
            <button onClick={handleClearCart} className="text-xs text-rose-600 font-bold flex items-center gap-1 hover:underline">
              <Trash2 className="h-3 w-3" /> Clear Cart
            </button>
          </div>

          {/* Active Cart Line Mapping Loops */}
          <div className="flex-1 min-h-62.5 lg:min-h-0 overflow-y-auto px-4 py-2 space-y-3 bg-slate-50/40">
            {cart.length > 0 ? (
              cart.map((item) => (
                <CartItem 
                  key={item.product.id}
                  name={item.product.displayName || "Item"} 
                  sku={item.product.sku || ""} 
                  price={Number(item.product.price) || 0} 
                  qty={item.quantity} 
                  onIncrement={() => updateCartQuantity(item.product.id, true)}
                  onDecrement={() => updateCartQuantity(item.product.id, false)}
                />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 text-xs text-center p-4">
                No active products staged in checkout lane. Click products or &quot;Add to Cart&quot; to pass valid data items.
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-white space-y-4">
            <div className="p-4 border-t border-slate-200 bg-white space-y-4">
              <div className="space-y-2 text-sm border-b border-slate-100 pb-3">
                {/* Subtotal Display Row */}
                <div className="flex justify-between items-center text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold">{<CurrencyFormatter amount={cartTotals.subtotal} />}</span>
                </div>

                {/* Discount Interaction Layer */}
                <div className="flex justify-between items-center relative">
                  <span className="text-slate-500">Discount</span>
                  
                  {selectedDiscount ? (
                    /* Render Selected Discount Tag Badge */
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                        <Tag className="h-3 w-3" />
                        <span>{selectedDiscount.name}</span>
                        <button 
                          onClick={() => setSelectedDiscount(null)} 
                          className="text-blue-400 hover:text-blue-700 ml-1 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-bold text-blue-600">
                        -{<CurrencyFormatter amount={cartTotals.discountAmount} />}
                      </span>
                    </div>
                  ) : (
                    /* Action Button to Open Database Dropdown Selection */
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDiscountDropdownOpen(!isDiscountDropdownOpen)}
                        disabled = {isCheckoutDisabled}
                        className="text-xs border-dashed border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-500 h-8 gap-1"
                      >
                        <Plus className="h-3 w-3" /> Apply Discount
                      </Button>

                      {/* Popover Selection Box */}
                      {isDiscountDropdownOpen && (
                        <div className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                          <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
                            Available Store Discounts
                          </div>
                          {activeDiscounts && activeDiscounts.filter(d => d.status === "ACTIVE").length > 0 ? (
                            activeDiscounts
                              .filter((d) => d.status === "ACTIVE")
                              .map((disc) => (
                                <button
                                  key={disc.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDiscount(disc);
                                    setIsDiscountDropdownOpen(false);
                                  }}
                                  className="w-full p-2.5 hover:bg-slate-50 text-left flex justify-between items-center transition-colors"
                                >
                                  <div>
                                    <p className="font-bold text-slate-800 text-xs">{disc.name}</p>
                                    {disc.description && (
                                      <p className="text-[10px] text-slate-400 truncate max-w-37.5">{disc.description}</p>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                    {disc.type === "PERCENTAGE" ? `${disc.value}%` : <CurrencyFormatter amount={disc.value} />}
                                  </span>
                                </button>
                              ))
                          ) : (
                            <div className="p-3 text-center text-xs text-slate-400">
                              No active discounts found.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Total Due Display Row */}
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-800">Total Due</span>
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  {<CurrencyFormatter amount={cartTotals.total} />}
                </span>
              </div>
            </div>


            {/* INTERACTIVE CLIENT METADATA DROPDOWN */}
            <div ref={customerDropdownRef} className="relative flex flex-col border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center ${selectedCustomer ? 'bg-green-100 text-green-900' : 'bg-blue-100 text-blue-900'}`}>
                    <User className="h-4 w-4" />
                  </div>
                  <div className="max-w-45">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Customer</p>
                    <p 
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="text-xs font-bold text-blue-900 hover:underline cursor-pointer truncate"
                    >
                      {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`: "Walk-in Customer"}
                    </p>
                    {selectedCustomer && (
                      <p className="text-[10px] text-slate-400 truncate">{selectedCustomer.email}</p>
                    )}
                  </div>
                </div>
                
                {selectedCustomer ? (
                  <button 
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1 border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors bg-white"
                    title="Remove Customer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                    className={`p-1 border rounded-lg transition-colors bg-white ${isCustomerDropdownOpen ? 'bg-blue-900 text-white border-blue-900' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* FLOATING DROPDOWN POPUP */}
              {isCustomerDropdownOpen && (
                <div className="absolute left-0 right-0 bottom-12 mb-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 flex flex-col max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-slate-100 bg-slate-50">
                    <input 
                      type="text"
                      placeholder="Search customers database..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      autoFocus
                    />
                  </div>
                  
                  <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                    <div 
                      onClick={() => {
                        setSelectedCustomer(null);
                        setIsCustomerDropdownOpen(false);
                      }}
                      className="p-2.5 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer flex justify-between items-center font-medium"
                    >
                      <span>🚶 Default (Walk-in Customer)</span>
                      {!selectedCustomer && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </div>

                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((cust: Customer) => (
                        <div
                          key={cust.id}
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setIsCustomerDropdownOpen(false);
                            setCustomerSearchQuery("");
                          }}
                          className="p-2.5 hover:bg-blue-50/50 cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            {/* Render Combined Full Name strictly */}
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {cust.firstName} {cust.lastName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              {cust.phone || "No phone"} • {cust.email || "No email"}
                            </p>
                          </div>
                          {selectedCustomer?.id === cust.id && (
                            <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-[11px] text-slate-400">
                        No clients match search criteria
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PAYMENT METHOD OPTION LAYOUT BLOCK (With Split Button Added) */}
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Option</p>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => { setPaymentMethod("CASH"); setCashPaid(0); setMomoPaid(0); }}
                    className={`flex py-2 text-xs items-center justify-center gap-1 border rounded-lg font-bold transition-all ${paymentMethod === "CASH" ? "bg-blue-900 border-blue-900 text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Cash
                  </button>
                  <button 
                    onClick={() => { setPaymentMethod("MOMO"); setCashPaid(0); setMomoPaid(0); }}
                    className={`flex py-2 text-xs items-center justify-center gap-1 border rounded-lg font-bold transition-all ${paymentMethod === "MOMO" ? "bg-blue-900 border-blue-900 text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Smartphone className="h-3.5 w-3.5" /> MoMo
                  </button>
                  <button 
                    onClick={() => {
                      setPaymentMethod("SPLIT");
                      // Prefill cash with full amount to give standard starting point
                      setCashPaid(cartTotals.total);
                      setMomoPaid(0);
                    }}
                    className={`flex py-2 text-xs items-center justify-center gap-1 border rounded-lg font-bold transition-all ${paymentMethod === "SPLIT" ? "bg-blue-900 border-blue-900 text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Layers className="h-3.5 w-3.5" /> Split
                  </button>
                </div>
              </div>

              {/* CONDITIONAL SPLIT PAYMENT INPUTS SUB-TRAY */}
              {paymentMethod === "SPLIT" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2.5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{<CurrencyFormatter.Header title ="Cash Paid" />}</label>
                      <input 
                        type="number"
                        step="any"
                        min="0"
                        value={cashPaid || ""}
                        onChange={(e) => setCashPaid(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{<CurrencyFormatter.Header title="MoMo Paid" />}</label>
                      <input 
                        type="number"
                        step="any"
                        min="0"
                        value={momoPaid || ""}
                        onChange={(e) => setMomoPaid(Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Balancing Status Alert Badge */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[11px]">
                    <span className="text-slate-500 font-medium">Remaining Bal:</span>
                    {splitRemaining === 0 ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Balanced
                      </span>
                    ) : (
                      <span className={`font-bold ${splitRemaining > 0 ? "text-amber-600" : "text-rose-600"}`}>
                        {<CurrencyFormatter amount={splitRemaining} />} {splitRemaining > 0 ? "short" : "overpaid"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PIPED INLINE ACTION INVOCATION COMPONENT */}
            <CheckoutButton
              checkoutPayload={currentCheckoutPayload}
              onSuccess={handleSaleSuccess}
              disabled={isCheckoutDisabled}
            />
          </div>
        </aside>
      </div>

      {/* Footer Metrics Panel */}
      <footer className="px-4 py-3 bg-slate-100 border-t border-slate-200 flex flex-col md:flex-row gap-2 items-center justify-between text-[11px] text-slate-500 font-medium">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-1">
          <span>Business Name: <strong className="text-slate-700">{user?.business?.name || "My SaaS MultiPOS"}</strong></span>
          <span>Date: <strong className="text-slate-700">{currentDate || "Running..."}</strong></span>
          <span>Time: <strong className="text-slate-700">{currentTime || "Running..."}</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Terminal Online <Wifi className="h-4 w-4" />
          </span>
        </div>
      </footer>
    </div>
  );
}

function CartItem({ 
  name, sku, price, qty, onIncrement, onDecrement 
}: { 
  name: string; sku: string; price: number; qty: number; onIncrement: () => void; onDecrement: () => void 
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center justify-between gap-3 relative group">
      <div className="space-y-1 flex-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-800 truncate">{name}</h4>
        <p className="text-[10px] font-mono text-slate-400 uppercase">SKU: {sku}</p>
        <div className="pt-1 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">{<CurrencyFormatter amount={price}/>}</span>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">x{qty}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onDecrement} className="p-1 text-slate-400 hover:text-rose-600 transition-colors hover:bg-rose-50 rounded-md">
          <MinusCircle className="h-4 w-4" />
        </button>
        <button onClick={onIncrement} className="p-1 text-slate-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-md">
          <PlusCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}