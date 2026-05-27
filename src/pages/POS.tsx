import React, { useState, useEffect, useRef } from 'react';
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
  ShoppingCart
} from 'lucide-react';
import { productApi } from '../api/products';
import { transactionApi } from '../api/transactions';
import type { Product, Category } from '../types';
import { cn } from '../utils/cn';

interface CartItem extends Product {
  quantity: number;
}

const POS: React.FC = () => {
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
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productApi.getAll(),
        productApi.getCategories()
      ]);
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch POS data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
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

  const subtotal = cart.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax - discount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsCheckingOut(true);
    try {
      const checkoutData = {
        payment_method: paymentMethod,
        discount: discount,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      };
      
      const res = await transactionApi.create(checkoutData);
      
      if (res.success) {
        if (paymentMethod === 'snap' && res.data.payment?.redirect_url) {
          window.location.href = res.data.payment.redirect_url;
        } else {
          alert('Transaction successful!');
          setCart([]);
          setDiscount(0);
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
                  <div className="aspect-square bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0">
                    <Package className="w-8 lg:w-10 h-8 lg:h-10" />
                  </div>
                  <div className="flex-1 min-w-0 mb-3">
                    <h3 className="font-semibold text-slate-900 text-sm lg:text-base mb-1 truncate leading-tight">{product.name}</h3>
                    <p className="text-[10px] lg:text-xs text-slate-500 truncate uppercase tracking-wider font-medium">{product.sku}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm lg:text-lg font-bold text-blue-600">
                      ${(product.price || 0).toLocaleString()}
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
          <span className="font-bold pr-1">${total.toLocaleString()}</span>
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
                  <p className="text-xs font-bold text-blue-600">${(item.price || 0).toLocaleString()}</p>
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
          <div className="space-y-2 mb-4 lg:mb-6 text-xs lg:text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold">${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (10%)</span>
              <span className="font-semibold">${tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 items-center">
              <span>Discount</span>
              <div className="flex items-center gap-1 border-b border-slate-300 focus-within:border-blue-500 transition-colors">
                <span className="text-[10px] text-slate-400">$</span>
                <input 
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-16 text-right bg-transparent focus:outline-none py-0.5 font-bold"
                />
              </div>
            </div>
            <div className="flex justify-between text-lg lg:text-xl font-bold text-slate-900 pt-3 lg:pt-4 border-t border-slate-200 mt-2">
              <span>Total</span>
              <span className="text-blue-600">${total.toLocaleString()}</span>
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
    </div>
  );
};

export default POS;
