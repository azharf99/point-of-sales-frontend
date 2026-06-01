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
  FolderTree,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { productApi } from '../api/products';
import { useAuthStore } from '../store/authStore';
import type { Product, Category } from '../types';
import { cn } from '../utils/cn';
import { useSettingsStore, formatCurrency } from '../store/settingsStore';
import { getProductImageUrl } from '../utils/image';

const Products: React.FC = () => {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Product Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Category Pagination State
  const [categoryPage, setCategoryPage] = useState(1);
  const categoryLimit = 15;
  const [allProductsForCount, setAllProductsForCount] = useState<Product[]>([]);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Partial<Product> | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Partial<Category> | null>(null);

  const fetchProducts = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await productApi.getAll(page, 15);
      if (res.data && 'items' in res.data) {
        setProducts(res.data.items || []);
        setCurrentPage(res.data.meta.page);
        setTotalPages(res.data.meta.total_pages);
        setTotalItems(res.data.meta.total);
      } else {
        setProducts(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getAll(1, 1000)
      ]);
      setCategories(catRes.data || []);
      if (prodRes.data && 'items' in prodRes.data) {
        setAllProductsForCount(prodRes.data.items || []);
      } else {
        setAllProductsForCount(Array.isArray(prodRes.data) ? prodRes.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchLowStockCount = async () => {
    try {
      const res = await productApi.getLowStock();
      setLowStockCount(res.data?.length || 0);
    } catch (err) {
      console.error('Failed to fetch low stock count', err);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productApi.delete(id);
      await Promise.all([
        fetchProducts(currentPage),
        fetchLowStockCount()
      ]);
    } catch (err) {
      console.error('Failed to delete product', err);
      alert('Failed to delete product.');
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        fetchProducts(currentPage);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [currentPage]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        fetchCategories();
        fetchLowStockCount();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  // Product Actions
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setImageFile(null);
    setImagePreview(product.image_url ? getProductImageUrl(product.image_url) : null);
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
    setImageFile(null);
    setImagePreview(null);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSavingProduct(true);
    try {
      let savedProduct: Product;
      if (selectedProduct.id) {
        const res = await productApi.update(selectedProduct.id, selectedProduct);
        savedProduct = res.data;
      } else {
        const res = await productApi.create(selectedProduct);
        savedProduct = res.data;
      }

      // Upload image if selected
      if (imageFile && savedProduct.id) {
        await productApi.uploadImage(savedProduct.id, imageFile);
      }

      setIsProductModalOpen(false);
      await Promise.all([
        fetchProducts(currentPage),
        fetchLowStockCount()
      ]);
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
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category', err);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const [isUploadingCSV, setIsUploadingCSV] = useState(false);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCSV(true);
    try {
      if (activeTab === 'products') {
        await productApi.uploadProductCSV(file);
        alert('Products imported successfully!');
        await Promise.all([
          fetchProducts(currentPage),
          fetchLowStockCount()
        ]);
      } else {
        await productApi.uploadCategoryCSV(file);
        alert('Categories imported successfully!');
        await fetchCategories();
      }
    } catch (err) {
      console.error('CSV Import failed', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      alert('CSV Import failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUploadingCSV(false);
      e.target.value = '';
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

  const totalCategoryPages = Math.max(1, Math.ceil(filteredCategories.length / categoryLimit));
  const paginatedCategories = filteredCategories.slice(
    (categoryPage - 1) * categoryLimit,
    categoryPage * categoryLimit
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
            <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Low Stock</p>
            <p className="text-2xl font-bold text-slate-900">{lowStockCount}</p>
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
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv"
              id="csv-upload-input"
              className="hidden"
              onChange={handleCSVUpload}
              disabled={isUploadingCSV}
            />
            <label
              htmlFor="csv-upload-input"
              className={cn(
                "flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm whitespace-nowrap cursor-pointer active:scale-95 select-none shadow-sm",
                isUploadingCSV && "opacity-50 pointer-events-none"
              )}
            >
              {isUploadingCSV ? (
                <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" />
              )}
              {isUploadingCSV ? 'Importing...' : 'Import CSV'}
            </label>

            <button 
              onClick={activeTab === 'products' ? handleAddProduct : handleAddCategory}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 lg:px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 text-sm whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
              {activeTab === 'products' ? 'Add Product' : 'New Category'}
            </button>
          </div>
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
                          <div className="w-9 h-9 lg:w-10 lg:h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-blue-50 transition-colors overflow-hidden border border-slate-100">
                             {product.thumbnail_url || product.image_url ? (
                               <img 
                                 src={getProductImageUrl(product.thumbnail_url || product.image_url)} 
                                 alt={product.name} 
                                 className="w-full h-full object-cover" 
                               />
                             ) : (
                               <Package className="w-4 lg:w-5 h-4 lg:h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                             )}
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
                        <p className="font-bold text-slate-900 text-sm">{formatCurrency(product.price || 0, settings)}</p>
                        <p className="text-[10px] font-medium text-blue-600">{product.stock} units</p>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {getStatusBadge(product.stock, product.min_stock)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <button onClick={() => handleEditProduct(product)} className="p-1.5 lg:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 className="w-3.5 lg:w-4 h-3.5 lg:h-4" />
                        </button>
                        {user?.role === 'admin' && (
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 lg:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-1">
                            <Trash2 className="w-3.5 lg:w-4 h-3.5 lg:h-4" />
                          </button>
                        )}
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
                ) : paginatedCategories.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No categories found.</td></tr>
                ) : (
                  paginatedCategories.map((cat) => (
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
                          {allProductsForCount.filter(p => p.category_id === cat.id).length} products
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

        {/* Pagination Footers */}
        {activeTab === 'products' && totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-500">
              Showing page <span className="text-slate-900 font-bold">{currentPage}</span> of <span className="text-slate-900 font-bold">{totalPages}</span> ({totalItems} total products)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all animate-in"
              >
                Previous
              </button>
              {(() => {
                const pages: number[] = [];
                const range = 2;
                for (let i = Math.max(1, currentPage - range); i <= Math.min(totalPages, currentPage + range); i++) {
                  pages.push(i);
                }
                return pages;
              })().map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all",
                    page === currentPage
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                      : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {activeTab === 'categories' && totalCategoryPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-500">
              Showing page <span className="text-slate-900 font-bold">{categoryPage}</span> of <span className="text-slate-900 font-bold">{totalCategoryPages}</span> ({filteredCategories.length} total categories)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCategoryPage(prev => Math.max(prev - 1, 1))}
                disabled={categoryPage === 1}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
              >
                Previous
              </button>
              {(() => {
                const pages: number[] = [];
                const range = 2;
                for (let i = Math.max(1, categoryPage - range); i <= Math.min(totalCategoryPages, categoryPage + range); i++) {
                  pages.push(i);
                }
                return pages;
              })().map(page => (
                <button
                  key={page}
                  onClick={() => setCategoryPage(page)}
                  className={cn(
                    "w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all",
                    page === categoryPage
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                      : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCategoryPage(prev => Math.min(prev + 1, totalCategoryPages))}
                disabled={categoryPage === totalCategoryPages}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
                  <div className="space-y-1.5 pt-2">
                    <label className="text-sm font-bold text-slate-700 block">Product Photo</label>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-slate-300" />
                         )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/jpg, image/webp" 
                          id="product-image-file" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                alert("Max size is 5MB");
                                return;
                              }
                              setImageFile(file);
                              setImagePreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                        <label htmlFor="product-image-file" className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl bg-white hover:bg-slate-50 transition-all select-none">
                          Choose Photo
                        </label>
                        <p className="text-[9px] text-slate-400">Supports JPG, JPEG, PNG, WEBP (Max 5MB)</p>
                      </div>
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
