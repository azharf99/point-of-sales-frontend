import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  AlertCircle,
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Save,
  Tag,
  DollarSign,
  FolderTree
} from 'lucide-react';
import { productApi } from '../api/products';
import type { Product, Category } from '../types';
import { cn } from '../utils/cn';

const Products: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Partial<Product> | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Partial<Category> | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productApi.getAll(),
        productApi.getCategories()
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Product Actions
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct({
      name: '',
      category_id: categories[0]?.id || 0,
      sku: '',
      barcode: '',
      price: 0,
      cost_price: 0,
      stock: 0,
      min_stock: 10
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSavingProduct(true);
    try {
      if (selectedProduct.id) {
        await productApi.update(selectedProduct.id, selectedProduct);
      } else {
        await productApi.create(selectedProduct);
      }
      setIsProductModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save product', err);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Category Actions
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleAddCategory = () => {
    setSelectedCategory({ name: '' });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setIsSavingCategory(true);
    try {
      await productApi.createCategory(selectedCategory);
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save category', err);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const getStatusBadge = (stock: number, minStock: number) => {
    if (stock <= 0) {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700">
          <XCircle className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> Out
        </span>
      );
    }
    if (stock <= minStock) {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
          <AlertCircle className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> Low
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700">
        <CheckCircle2 className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> Stock
      </span>
    );
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:space-y-8 pb-10">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Items</p>
            <p className="text-2xl font-bold text-slate-900">{products.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Low Stock</p>
            <p className="text-2xl font-bold text-slate-900">
              {products.filter(p => p.stock > 0 && p.stock <= p.min_stock).length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categories</p>
            <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button 
          onClick={() => { setActiveTab('products'); setSearchQuery(''); }}
          className={cn(
            "pb-4 text-sm font-bold transition-all border-b-2",
            activeTab === 'products' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Product Catalog
        </button>
        <button 
          onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
          className={cn(
            "pb-4 text-sm font-bold transition-all border-b-2",
            activeTab === 'categories' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Manage Categories
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 lg:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 lg:w-5 lg:h-5" />
            <input
              type="text"
              placeholder={activeTab === 'products' ? "Search catalog..." : "Search categories..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 lg:pl-10 pr-4 py-2 lg:py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
          <button 
            onClick={activeTab === 'products' ? handleAddProduct : handleAddCategory}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 lg:px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 text-sm whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
            {activeTab === 'products' ? 'Add Product' : 'New Category'}
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'products' ? (
            <table className="w-full text-left border-collapse min-w-[600px] lg:min-w-0">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Product Info</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Category</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Price / Stock</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No products found.</td></tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 lg:w-10 lg:h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <Package className="w-4 lg:w-5 h-4 lg:h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{product.name}</p>
                            <p className="text-[10px] lg:text-xs text-slate-500 font-medium uppercase tracking-tighter lg:tracking-normal">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                          {product.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <p className="font-bold text-slate-900 text-sm">${(product.price || 0).toLocaleString()}</p>
                        <p className="text-[10px] font-medium text-blue-600">{product.stock} units</p>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {getStatusBadge(product.stock, product.min_stock)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <button onClick={() => handleEditProduct(product)} className="p-1.5 lg:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 className="w-3.5 lg:w-4 h-3.5 lg:h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Category Name</th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Linked Products</th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></td></tr>
                ) : filteredCategories.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No categories found.</td></tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                            <FolderTree className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-center">
                        <span className="text-xs font-bold text-slate-400">
                          {products.filter(p => p.category_id === cat.id).length} products
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <button onClick={() => handleEditCategory(cat)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {selectedProduct?.id ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                {selectedProduct?.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Basic Information</h4>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Product Name</label>
                    <input required type="text" value={selectedProduct?.name || ''} onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="e.g. Arabica Coffee" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-slate-700">Category</label>
                      <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="text-[10px] font-bold text-blue-600 hover:underline">+ Quick Add</button>
                    </div>
                    <select required value={selectedProduct?.category_id || ''} onChange={(e) => setSelectedProduct({ ...selectedProduct, category_id: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="" disabled>Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">SKU</label>
                      <input required type="text" value={selectedProduct?.sku || ''} onChange={(e) => setSelectedProduct({ ...selectedProduct, sku: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm uppercase" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Barcode</label>
                      <input required type="text" value={selectedProduct?.barcode || ''} onChange={(e) => setSelectedProduct({ ...selectedProduct, barcode: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><DollarSign className="w-3.5 h-3.5" /> Pricing & Inventory</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Sale Price</label>
                      <input required type="number" value={selectedProduct?.price || ''} onChange={(e) => setSelectedProduct({ ...selectedProduct, price: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Cost Price</label>
                      <input required type="number" value={selectedProduct?.cost_price || ''} onChange={(e) => setSelectedProduct({ ...selectedProduct, cost_price: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Current Stock</label>
                      <input required type="number" value={selectedProduct?.stock || ''} onChange={(e) => setSelectedProduct({ ...selectedProduct, stock: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Min. Stock</label>
                      <input required type="number" value={selectedProduct?.min_stock || ''} onChange={(e) => setSelectedProduct({ ...selectedProduct, min_stock: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-sm active:scale-95">Cancel</button>
                <button disabled={isSavingProduct} type="submit" className="flex-[2] bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-[0.98] disabled:bg-slate-300 text-sm">
                  {isSavingProduct ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {selectedProduct?.id ? 'Update Product' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {selectedCategory?.id ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Category Name</label>
                <input
                  required
                  autoFocus
                  type="text"
                  value={selectedCategory?.name || ''}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Beverages"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-sm">Cancel</button>
                <button disabled={isSavingCategory} type="submit" className="flex-[2] bg-blue-600 text-white font-bold py-2 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 disabled:bg-slate-300 text-sm">
                  {isSavingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
