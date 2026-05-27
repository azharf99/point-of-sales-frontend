import React, { useState } from 'react';
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setRegisterSuccess(null);
    setRegisterError(null);

    try {
      const res = await authApi.register(registerForm);
      if (res.success) {
        setRegisterSuccess(`Account for ${res.data.name} created successfully!`);
        setRegisterForm({ name: '', username: '', password: '', role: 'staff' });
      }
    } catch (err: any) {
      setRegisterError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setIsRegistering(false);
    }
  };

  const isAdmin = user?.role === 'admin';

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
                onClick={() => setActiveTab(tab.id as any)}
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
                        onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value as any })}
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center">
              <Store className="w-16 h-16 text-slate-200 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">General Store Settings</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                Configure your shop name, tax rates, currency, and receipt header/footer messages.
              </p>
              <div className="mt-8 px-6 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest">
                Feature coming soon
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
