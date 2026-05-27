import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Store, 
  UserPlus, 
  Key, 
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { settingsApi } from '../api/settings';
import { cn } from '../utils/cn';

const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'store'>('profile');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const [registerForm, setRegisterForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'staff' as 'admin' | 'staff'
  });

  // Store Settings States
  const [storeSettings, setStoreSettings] = useState({
    shop_name: '',
    tax_rate: 0,
    currency: 'USD',
    receipt_header: '',
    receipt_footer: '',
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (activeTab === 'store' && isAdmin) {
      const fetchSettings = async () => {
        setIsLoadingSettings(true);
        setSettingsError(null);
        try {
          const res = await settingsApi.get();
          if (res.success && res.data) {
            setStoreSettings({
              shop_name: res.data.shop_name,
              tax_rate: res.data.tax_rate,
              currency: res.data.currency,
              receipt_header: res.data.receipt_header || '',
              receipt_footer: res.data.receipt_footer || '',
            });
          }
        } catch (err: unknown) {
          setSettingsError(`Failed to load store settings. ${err instanceof Error ? err.message : ''}`);
        } finally {
          setIsLoadingSettings(false);
        }
      };
      fetchSettings();
    }
  }, [activeTab, isAdmin]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccess(null);
    setSettingsError(null);
    try {
      const res = await settingsApi.update(storeSettings);
      if (res.success) {
        setSettingsSuccess('Store settings updated successfully!');
      }
    } catch (err: unknown) {
      const message = err instanceof Error && 'response' in err 
        ? (err as { response: { data: { message: string } } }).response?.data?.message 
        : 'Failed to update store settings.';
      setSettingsError(message || 'Failed to update store settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setRegisterSuccess(null);
    setRegisterError(null);

    try {
      const res = await authApi.register(registerForm);
      if (res.success) {
        setRegisterSuccess(`Account for ${res.data?.name || 'user'} created successfully!`);
        setRegisterForm({ name: '', username: '', password: '', role: 'staff' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error && 'response' in err 
        ? (err as { response: { data: { message: string } } }).response?.data?.message 
        : 'Failed to create account.';
      setRegisterError(message || 'Failed to create account.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Tab definition is moved below state declarations to properly reference isAdmin
  const tabs = [
    { id: 'profile', name: 'My Profile', icon: User },
    { id: 'users', name: 'Staff Management', icon: Shield, hidden: !isAdmin },
    { id: 'store', name: 'Store Settings', icon: Store, hidden: !isAdmin },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
        <p className="text-slate-500">Manage your profile, staff accounts, and store preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tabs Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.filter(t => !t.hidden).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'profile' | 'users' | 'store')}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap lg:w-full",
                  activeTab === tab.id 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                    : "text-slate-500 hover:bg-white hover:text-slate-900"
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl font-black">
                    {user?.name?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{user?.name}</h4>
                    <p className="text-slate-500 font-medium capitalize">{user?.role} Account</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Username</p>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700">
                      {user?.username}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Employee ID</p>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700">
                      #{user?.id}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button className="text-blue-600 font-bold hover:underline">Change Account Password</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && isAdmin && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Register New Staff</h3>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="p-8 space-y-6">
                  {registerSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
                      <CheckCircle2 className="w-5 h-5" />
                      {registerSuccess}
                    </div>
                  )}
                  {registerError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
                      <AlertCircle className="w-5 h-5" />
                      {registerError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" /> Full Name
                      </label>
                      <input
                        required
                        type="text"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Sarah Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" /> Username
                      </label>
                      <input
                        required
                        type="text"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. sarah.smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Key className="w-4 h-4 text-slate-400" /> Initial Password
                      </label>
                      <input
                        required
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-400" /> System Role
                      </label>
                      <select
                        value={registerForm.role}
                        onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value as 'admin' | 'staff' })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="staff">Staff (Standard POS)</option>
                        <option value="admin">Admin (Full Access)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      disabled={isRegistering}
                      type="submit"
                      className="w-full md:w-auto bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 disabled:bg-slate-300"
                    >
                      {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                      Create Staff Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'store' && isAdmin && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Store className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">General Store Settings</h3>
                </div>
              </div>

              {isLoadingSettings ? (
                <div className="p-12 flex justify-center items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <form onSubmit={handleSaveSettings} className="p-8 space-y-6">
                  {settingsSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
                      <CheckCircle2 className="w-5 h-5" />
                      {settingsSuccess}
                    </div>
                  )}
                  {settingsError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
                      <AlertCircle className="w-5 h-5" />
                      {settingsError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Shop Name</label>
                      <input
                        required
                        type="text"
                        value={storeSettings.shop_name}
                        onChange={(e) => setStoreSettings({ ...storeSettings, shop_name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. My General Store"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Currency</label>
                        <select
                          value={storeSettings.currency}
                          onChange={(e) => setStoreSettings({ ...storeSettings, currency: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="IDR">IDR (Rp)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Tax Rate (%)</label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          min="0"
                          value={storeSettings.tax_rate}
                          onChange={(e) => setStoreSettings({ ...storeSettings, tax_rate: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Receipt Header Message</label>
                    <textarea
                      rows={3}
                      value={storeSettings.receipt_header}
                      onChange={(e) => setStoreSettings({ ...storeSettings, receipt_header: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Message printed at the top of receipts"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Receipt Footer Message</label>
                    <textarea
                      rows={3}
                      value={storeSettings.receipt_footer}
                      onChange={(e) => setStoreSettings({ ...storeSettings, receipt_footer: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Message printed at the bottom of receipts"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      disabled={isSavingSettings}
                      type="submit"
                      className="w-full md:w-auto bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 disabled:bg-slate-300"
                    >
                      {isSavingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Store className="w-5 h-5" />}
                      Save Store Settings
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
