import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Phone, 
  Mail, 
  Trophy,
  Loader2,
  X,
  Save,
  Trash2
} from 'lucide-react';
import { customerApi } from '../api/customers';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils/cn';
import type { Customer } from '../types';

const Customers: React.FC = () => {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Partial<Customer> | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Debounce search query and reset page to 1 on new search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchCustomers = async (page = 1, search = '') => {
    setIsLoading(true);
    try {
      const res = await customerApi.getAll(page, 15, search);
      if (res.data && 'items' in res.data) {
        setCustomers(res.data.items || []);
        setCurrentPage(res.data.meta.page);
        setTotalPages(res.data.meta.total_pages);
        setTotalItems(res.data.meta.total);
      } else {
        setCustomers([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        fetchCustomers(currentPage, debouncedSearch);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [currentPage, debouncedSearch]);



  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customerApi.delete(id);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to delete customer', err);
      alert('Failed to delete customer.');
    }
  };

  const handleAdd = () => {
    setSelectedCustomer({ name: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      if (selectedCustomer.id) {
        await customerApi.update(selectedCustomer.id, selectedCustomer);
      } else {
        await customerApi.create(selectedCustomer);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to save customer', err);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900">Customer Directory</h2>
          <p className="text-sm text-slate-500">Manage your loyalty program and customer profiles.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 lg:p-6 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px] lg:min-w-0">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Loyalty Points</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{customer.name}</p>
                          <p className="text-xs text-slate-400">ID: #{customer.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100">
                        <Trophy className="w-4 h-4" />
                        {customer.points}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleEdit(customer)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {user?.role === 'admin' && (
                        <button 
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-500">
              Showing page <span className="text-slate-900 font-bold">{currentPage}</span> of <span className="text-slate-900 font-bold">{totalPages}</span> ({totalItems} total customers)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
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
      </div>

      {/* Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                {selectedCustomer?.id ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <input
                  required
                  type="text"
                  value={selectedCustomer?.name || ''}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Phone Number</label>
                <input
                  required
                  type="tel"
                  value={selectedCustomer?.phone || ''}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 08123456789"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email Address</label>
                <input
                  required
                  type="email"
                  value={selectedCustomer?.email || ''}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Save className="w-5 h-5" />
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
