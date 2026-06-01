import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  ShoppingBag,
  Package,
  Loader2,
  X,
  ShoppingCart,
  UserSearch,
  UserPlus,
  Trophy,
  Gift,
  Sparkles,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { productApi } from '../api/products';
import { transactionApi } from '../api/transactions';
import { customerApi } from '../api/customers';
import type { Product, Category, Customer } from '../types';
import { cn } from '../utils/cn';
import { useSettingsStore, formatCurrency } from '../store/settingsStore';
import { getProductImageUrl } from '../utils/image';

interface CartItem extends Product {
  quantity: number;
  order_type?: string;
}

const POINTS_VALUE = 1000; // 1 point = Rp1,000

const POS: React.FC = () => {
  const { settings, fetchSettings } = useSettingsStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'snap'>('cash');
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Member/Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [memberPhone, setMemberPhone] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [memberSearchResults, setMemberSearchResults] = useState<Customer[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  
  // Quick Register state
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickRegName, setQuickRegName] = useState('');
  const [quickRegPhone, setQuickRegPhone] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Redeem Points state
  const [redeemPoints, setRedeemPoints] = useState(0);
  
  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ pointsEarned: number; pointsRedeemed: number; total: number } | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const memberSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productApi.getAll(1, 100),
        productApi.getCategories()
      ]);
      if (productsRes.data && 'items' in productsRes.data) {
        setProducts(productsRes.data.items || []);
      } else {
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      }
      setCategories(categoriesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch POS data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!settings) {
        await fetchSettings();
      }
      await fetchData();
    };
    init();
  }, [settings, fetchSettings]);

  // Debounced member search
  const searchMembers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setMemberSearchResults([]);
      return;
    }
    setIsSearchingMembers(true);
    try {
      const res = await customerApi.getAll(1, 10, query);
      if (res.data && 'items' in res.data) {
        setMemberSearchResults(res.data.items || []);
      }
    } catch (err) {
      console.error('Member search failed', err);
    } finally {
      setIsSearchingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (memberSearchTimerRef.current) clearTimeout(memberSearchTimerRef.current);
    memberSearchTimerRef.current = setTimeout(() => {
      searchMembers(memberSearchQuery);
    }, 300);
    return () => {
      if (memberSearchTimerRef.current) clearTimeout(memberSearchTimerRef.current);
    };
  }, [memberSearchQuery, searchMembers]);

  const handleMemberLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberPhone.trim()) return;
    
    setIsLookingUp(true);
    try {
      const res = await customerApi.lookup(memberPhone.trim());
      if (res.success && res.data) {
        setSelectedCustomer(res.data);
        setMemberPhone('');
        setRedeemPoints(0);
      } else {
        // Offer quick register
        setQuickRegPhone(memberPhone.trim());
        setQuickRegName('');
        setShowQuickRegister(true);
      }
    } catch {
      // Not found — offer quick register
      setQuickRegPhone(memberPhone.trim());
      setQuickRegName('');
      setShowQuickRegister(true);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      const res = await customerApi.create({ name: quickRegName, phone: quickRegPhone });
      if (res.success && res.data) {
        setSelectedCustomer(res.data);
        setShowQuickRegister(false);
        setMemberPhone('');
        setRedeemPoints(0);
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || 'Failed to register customer.');
    } finally {
      setIsRegistering(false);
    }
  };

  const selectMemberFromSearch = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowMemberSearch(false);
    setMemberSearchQuery('');
    setMemberSearchResults([]);
    setRedeemPoints(0);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setRedeemPoints(0);
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Product "${product.name}" is out of stock!`);
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          alert(`Cannot add more. Only ${product.stock} units available in stock.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          if (newQuantity > item.stock) {
            alert(`Cannot exceed available stock (${item.stock} units).`);
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const handleBarcodeLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    try {
      const res = await productApi.lookup(searchQuery);
      if (res.success && res.data) {
        addToCart(res.data);
        setSearchQuery('');
      }
    } catch (err) {
      console.error('Product not found', err);
    }
  };

  const taxRate = settings ? settings.tax_rate / 100 : 0.1;
  const subtotal = cart.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
  const pointsDiscount = redeemPoints * POINTS_VALUE;
  const taxableAmount = Math.max(0, subtotal - discount - pointsDiscount);
  const tax = taxableAmount * taxRate;
  const total = Math.max(0, subtotal - discount - pointsDiscount + tax);
  const estimatedPointsEarned = selectedCustomer ? Math.floor(total / 10000) : 0;
  const maxRedeemablePoints = selectedCustomer ? Math.min(selectedCustomer.points, Math.floor((subtotal - discount) / POINTS_VALUE)) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsCheckingOut(true);
    try {
      const checkoutData: {
        payment_method: string;
        discount: number;
        redeem_points: number;
        customer_id?: number;
        items: { product_id: number; quantity: number; order_type: string }[];
      } = {
        payment_method: paymentMethod,
        discount: discount,
        redeem_points: redeemPoints,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          order_type: item.order_type || 'dine_in'
        }))
      };

      if (selectedCustomer) {
        checkoutData.customer_id = selectedCustomer.id;
      }
      
      const res = await transactionApi.create(checkoutData);
      
      if (res.success && res.data) {
        if (paymentMethod === 'snap' && res.data.payment?.redirect_url) {
          try {
            const url = new URL(res.data.payment.redirect_url);
            const trustedDomains = ['app.midtrans.com', 'app.sandbox.midtrans.com'];
            if (trustedDomains.includes(url.hostname)) {
              window.location.href = res.data.payment.redirect_url;
            } else {
              console.error('Insecure redirect URL:', res.data.payment.redirect_url);
              alert('Error: Insecure payment gateway redirect.');
            }
          } catch (err) {
            console.error('Invalid redirect URL:', err);
            alert('Error: Invalid payment redirect URL.');
          }
        } else {
          // Cash success
          setSuccessData({
            pointsEarned: res.data.transaction?.loyalty_points_earned || estimatedPointsEarned,
            pointsRedeemed: redeemPoints,
            total: res.data.transaction?.total || total
          });
          setShowSuccess(true);
          setCart([]);
          setDiscount(0);
          setRedeemPoints(0);
          setSelectedCustomer(null);
          setIsCartOpen(false);
        }
      }
    } catch (err) {
      console.error('Checkout failed', err);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-full gap-6 relative">
      {/* Product Catalog Section */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Member Section */}
        <div className="mb-4 lg:mb-5">
          {selectedCustomer ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 lg:p-4 flex items-center gap-3 lg:gap-4 animate-in fade-in duration-200">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm lg:text-base truncate">{selectedCustomer.name}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedCustomer.phone}
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Trophy className="w-3 h-3" />
                    {selectedCustomer.points} pts
                  </span>
                </div>
              </div>
              <button
                onClick={clearCustomer}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                title="Remove member"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <form onSubmit={handleMemberLookup} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Scan/ketik No. HP member..."
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLookingUp || !memberPhone.trim()}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 transition-all text-sm font-bold shrink-0 active:scale-95 flex items-center gap-1.5"
                >
                  {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Cari
                </button>
              </form>
              <button
                onClick={() => setShowMemberSearch(true)}
                className="px-3 py-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-all text-slate-600 shrink-0"
                title="Cari member"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="mb-4 lg:mb-6 space-y-4">
          <form onSubmit={handleBarcodeLookup} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search product or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
            />
          </form>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                selectedCategory === null 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                  selectedCategory === cat.id 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto -mx-1 px-1">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4 pb-20 lg:pb-0">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white p-3 lg:p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left group flex flex-col h-full"
                >
                  <div className="aspect-square bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 transition-all overflow-hidden border border-slate-100 shrink-0">
                    {product.thumbnail_url || product.image_url ? (
                      <img 
                        src={getProductImageUrl(product.thumbnail_url || product.image_url)} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                      />
                    ) : (
                      <Package className="w-8 lg:w-10 h-8 lg:h-10 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 mb-3">
                    <h3 className="font-semibold text-slate-900 text-sm lg:text-base mb-1 truncate leading-tight">{product.name}</h3>
                    <p className="text-[10px] lg:text-xs text-slate-500 truncate uppercase tracking-wider font-medium">{product.sku}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm lg:text-lg font-bold text-blue-600">
                      {formatCurrency(product.price || 0, settings)}
                    </span>
                    <span className={cn(
                      "text-[9px] lg:text-[10px] px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-md font-bold uppercase tracking-tighter lg:tracking-normal",
                      product.stock > 10 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {product.stock}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Mobile Cart */}
      {cart.length > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-30 bg-blue-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 animate-bounce-subtle"
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-blue-600">
              {cart.length}
            </span>
          </div>
          <span className="font-bold pr-1">{formatCurrency(total, settings)}</span>
        </button>
      )}

      {/* Mobile Cart Backdrop */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Cart / Order Summary Sidebar */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 w-[90%] sm:w-96 lg:static lg:w-96 flex flex-col bg-white border-l lg:border border-slate-200 lg:rounded-2xl overflow-hidden shadow-2xl lg:shadow-sm transform transition-transform duration-300 ease-in-out h-full shrink-0",
        isCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 lg:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg lg:text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 lg:w-6 h-5 lg:h-6 text-blue-600" />
            Current Order
          </h2>
          <div className="flex items-center gap-3">
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-md text-[10px] lg:text-xs font-bold uppercase tracking-wider">
              {cart.length} items
            </span>
            <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 -mr-2 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Customer Info in Cart (compact) */}
        {selectedCustomer && (
          <div className="px-4 lg:px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-700">{selectedCustomer.name}</span>
              </div>
              <span className="text-xs font-bold text-amber-600">{selectedCustomer.points} pts</span>
            </div>
            {cart.length > 0 && estimatedPointsEarned > 0 && (
              <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Akan mendapat +{estimatedPointsEarned} points dari transaksi ini
              </p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 lg:p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
              <ShoppingBag className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Your basket is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3 lg:gap-4 group">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 truncate leading-tight mb-0.5">{item.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600">{formatCurrency(item.price || 0, settings)}</span>
                    <span className="text-[10px] font-medium text-slate-400">•</span>
                    <select
                      value={item.order_type || 'dine_in'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCart(prev => prev.map(c => c.id === item.id ? { ...c, order_type: val } : c));
                      }}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 border-none rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 cursor-pointer transition-all"
                    >
                      <option value="dine_in">Dine-In</option>
                      <option value="take_away">Take Away</option>
                      <option value="delivery_gojek">Gojek Delivery</option>
                      <option value="delivery_grab">Grab Delivery</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 lg:p-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 hover:bg-white rounded transition-colors"
                    >
                      <Minus className="w-3 lg:w-4 h-3 lg:h-4" />
                    </button>
                    <span className="w-6 lg:w-8 text-center text-xs lg:text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:bg-white rounded transition-colors"
                    >
                      <Plus className="w-3 lg:w-4 h-3 lg:h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 lg:p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 lg:w-4 h-3.5 lg:h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 lg:p-6 bg-slate-50 border-t border-slate-100 shrink-0">
          {/* Redeem Points UI */}
          {selectedCustomer && selectedCustomer.points > 0 && cart.length > 0 && (
            <div className="mb-4 bg-amber-50/50 border border-amber-100 rounded-xl p-3 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-amber-600 animate-pulse" />
                  Tukar Points untuk Discount
                </label>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded-md">
                  1 pt = Rp1.000
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max={maxRedeemablePoints}
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(Number(e.target.value))}
                  className="flex-1 accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex items-center gap-1 border border-amber-200 bg-white px-2 py-1 rounded-lg shrink-0">
                  <input
                    type="number"
                    min="0"
                    max={maxRedeemablePoints}
                    value={redeemPoints}
                    onChange={(e) => {
                      const val = Math.min(maxRedeemablePoints, Math.max(0, Number(e.target.value)));
                      setRedeemPoints(val);
                    }}
                    className="w-10 text-center font-bold text-slate-800 text-sm focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-medium">pts</span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500 font-medium">
                <span>Maksimal redeem: {maxRedeemablePoints} pts</span>
                {redeemPoints > 0 && (
                  <span className="text-amber-600 font-bold animate-pulse">
                    Potongan: -{formatCurrency(pointsDiscount, settings)}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2 mb-4 lg:mb-6 text-xs lg:text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal, settings)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount Manual</span>
                <span className="font-semibold">-{formatCurrency(discount, settings)}</span>
              </div>
            )}
            {redeemPoints > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Point Discount ({redeemPoints} pts)</span>
                <span className="font-semibold">-{formatCurrency(pointsDiscount, settings)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax ({settings ? settings.tax_rate : 10}%)</span>
              <span className="font-semibold">{formatCurrency(tax, settings)}</span>
            </div>
            <div className="flex justify-between text-slate-600 items-center">
              <span>Discount Manual</span>
              <div className="flex items-center gap-1 border-b border-slate-300 focus-within:border-blue-500 transition-colors">
                <span className="text-[10px] text-slate-400">
                  {settings?.currency === 'IDR' ? 'Rp' : (settings?.currency === 'EUR' ? '€' : (settings?.currency === 'GBP' ? '£' : '$'))}
                </span>
                <input 
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    if (val > subtotal) {
                      alert("Discount cannot exceed subtotal.");
                      setDiscount(subtotal);
                    } else {
                      setDiscount(val);
                    }
                  }}
                  className="w-16 text-right bg-transparent focus:outline-none py-0.5 font-bold"
                />
              </div>
            </div>
            <div className="flex justify-between text-lg lg:text-xl font-bold text-slate-900 pt-3 lg:pt-4 border-t border-slate-200 mt-2">
              <span>Total</span>
              <span className="text-blue-600">{formatCurrency(total, settings)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:gap-3 mb-4 shrink-0">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                paymentMethod === 'cash' 
                  ? "border-blue-600 bg-blue-50 text-blue-600" 
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              <Banknote className="w-5 lg:w-6 h-5 lg:h-6 shrink-0" />
              <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider">Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod('snap')}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                paymentMethod === 'snap' 
                  ? "border-blue-600 bg-blue-50 text-blue-600" 
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              <CreditCard className="w-5 lg:w-6 h-5 lg:h-6 shrink-0" />
              <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider">Snap</span>
            </button>
          </div>

          <button
            disabled={cart.length === 0 || isCheckingOut}
            onClick={handleCheckout}
            className="w-full bg-blue-600 text-white font-bold py-3.5 lg:py-4 rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            {isCheckingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Checkout
              </>
            )}
          </button>
        </div>
      </div>

      {/* Member Search Modal */}
      {showMemberSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <UserSearch className="w-5 h-5 text-blue-600" />
                Cari Member
              </h3>
              <button 
                onClick={() => {
                  setShowMemberSearch(false);
                  setMemberSearchQuery('');
                  setMemberSearchResults([]);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Ketik nama atau nomor HP member..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 min-h-[200px]">
              {isSearchingMembers ? (
                <div className="h-full flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : memberSearchResults.length > 0 ? (
                <div className="space-y-2">
                  {memberSearchResults.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => selectMemberFromSearch(customer)}
                      className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left flex items-center justify-between group"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                          {customer.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">{customer.phone}</p>
                      </div>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        {customer.points} pts
                      </span>
                    </button>
                  ))}
                </div>
              ) : memberSearchQuery.length >= 2 ? (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-sm">Member tidak ditemukan.</p>
                  <button
                    onClick={() => {
                      setQuickRegPhone(memberSearchQuery.replace(/\D/g, ''));
                      setQuickRegName('');
                      setShowMemberSearch(false);
                      setShowQuickRegister(true);
                    }}
                    className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Daftar Baru
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Ketik minimal 2 karakter untuk memulai pencarian.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Register Modal */}
      {showQuickRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleQuickRegister} className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Daftar Cepat Member
              </h3>
              <button 
                type="button"
                onClick={() => setShowQuickRegister(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">No. Handphone</label>
                <input
                  type="text"
                  required
                  value={quickRegPhone}
                  onChange={(e) => setQuickRegPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={quickRegName}
                  onChange={(e) => setQuickRegName(e.target.value)}
                  placeholder="Ketik nama customer..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-semibold"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowQuickRegister(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isRegistering || !quickRegName.trim() || !quickRegPhone.trim()}
                className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center gap-1.5 active:scale-95 shadow-md shadow-blue-100"
              >
                {isRegistering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Daftarkan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col p-6 items-center text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-xl mb-1">Transaksi Berhasil!</h3>
            <p className="text-xs text-slate-500 mb-6">Pembayaran telah diproses menggunakan Cash</p>

            <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Total Bayar</span>
                <span className="font-extrabold text-slate-950">{formatCurrency(successData.total, settings)}</span>
              </div>
              {successData.pointsRedeemed > 0 && (
                <div className="flex justify-between text-xs text-amber-600 font-semibold border-t border-slate-200/60 pt-2.5">
                  <span className="flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" />
                    Points Ditukar
                  </span>
                  <span>-{successData.pointsRedeemed} pts</span>
                </div>
              )}
              {successData.pointsEarned > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-semibold border-t border-slate-200/60 pt-2.5">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Points Didapat
                  </span>
                  <span>+{successData.pointsEarned} pts</span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowSuccess(false);
                setSuccessData(null);
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-blue-150 active:scale-95"
            >
              Transaksi Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
