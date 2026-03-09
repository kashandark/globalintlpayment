/**
 * SECURITY AUDIT - ADMIN DASHBOARD
 * 1. Access Control: Component is only rendered if user.role === 'admin'.
 * 2. Audit Trail: All profile updates are timestamped in Supabase.
 * 3. Least Privilege: Admin can modify identity credentials and liquidity but cannot access user passwords.
 * 4. UI Safety: Destructive actions (if any) should require double-confirmation.
 */
import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Landmark, CreditCard, 
  Activity, Search, Edit2, Save, X, Loader2, 
  CheckCircle2, AlertCircle, ChevronRight, Hash
} from 'lucide-react';
import { api, UserProfile } from '../api';

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'PKR', 'CHF', 'CNY', 'SAR', 'HKD', 'QAR'];

const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'AED': 'د.إ',
  'PKR': '₨',
  'CHF': 'Fr.',
  'HKD': 'HK$',
  'QAR': 'ر.ق',
  'CNY': '¥',
  'SAR': 'SR',
};

const AdminDashboard: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Registration State
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({
    email: '',
    password: '',
    full_name: '',
    balance: '0',
    role: 'user' as 'admin' | 'user',
    currency: 'USD',
    bank_entity: '',
    swift_code: '',
    iban: '',
    account_number: ''
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchAllProfiles();
      setProfiles(data);
    } catch (e) {
      console.error('Failed to load profiles', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.createUser(regForm.email, regForm.password, {
        full_name: regForm.full_name,
        balance: parseFloat(regForm.balance),
        role: regForm.role,
        bank_entity: regForm.bank_entity,
        swift_code: regForm.swift_code,
        iban: regForm.iban,
        account_number: regForm.account_number,
        currency: regForm.currency
      });
      setMessage({ type: 'success', text: 'New entity provisioned successfully' });
      setShowRegister(false);
      setRegForm({
        email: '',
        password: '',
        full_name: '',
        balance: '0',
        role: 'user',
        currency: 'USD',
        bank_entity: '',
        swift_code: '',
        iban: '',
        account_number: ''
      });
      loadProfiles();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to provision entity' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const startEdit = (profile: UserProfile) => {
    setEditingId(profile.id);
    setEditForm(profile);
  };

  const handleSave = async () => {
    if (!editingId) return;
    setIsSaving(true);
    try {
      await api.updateProfile(editingId, editForm);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setEditingId(null);
      loadProfiles();
    } catch (e: any) {
      console.error('Update error:', e);
      setMessage({ type: 'error', text: e.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Institutional Control Panel
          </h2>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Global User Provisioning & Liquidity Management</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowRegister(!showRegister)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            {showRegister ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {showRegister ? 'Cancel Provisioning' : 'Provision New Entity'}
          </button>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Entity ID or Name..."
              className="pl-12 pr-6 py-3 bg-white dark:bg-[#111] border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 dark:text-white w-full md:w-80 transition-all"
            />
          </div>
        </div>
      </div>

      {showRegister && (
        <div className="bg-white dark:bg-[#111] rounded-[2.5rem] border-2 border-blue-100 dark:border-blue-900/30 shadow-2xl shadow-blue-600/5 overflow-hidden animate-in slide-in-from-top-8 duration-500">
          <div className="bg-blue-600 dark:bg-blue-700 px-8 py-6">
            <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
              <UserPlus className="w-5 h-5" />
              New Institutional Entity Provisioning
            </h3>
            <p className="text-blue-100 dark:text-blue-200 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Initialize secure node and identity credentials</p>
          </div>
          
          <form onSubmit={handleRegister} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Auth Credentials */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 pb-2">Auth Credentials</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      required
                      type="email"
                      value={regForm.email}
                      onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 dark:text-white transition-all"
                      placeholder="entity@gibk.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Initial Password</label>
                    <input 
                      required
                      type="password"
                      value={regForm.password}
                      onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 dark:text-white transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 pb-2">Profile Details</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Full Legal Name</label>
                    <input 
                      required
                      type="text"
                      value={regForm.full_name}
                      onChange={(e) => setRegForm({...regForm, full_name: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 dark:text-white transition-all"
                      placeholder="SJ LLC / Global Corp"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Initial Liquidity</label>
                      <input 
                        type="number"
                        value={regForm.balance}
                        onChange={(e) => setRegForm({...regForm, balance: e.target.value})}
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-black text-blue-600 dark:text-blue-400 outline-none focus:border-blue-600 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Currency</label>
                      <select 
                        value={regForm.currency}
                        onChange={(e) => setRegForm({...regForm, currency: e.target.value})}
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 dark:text-white transition-all appearance-none"
                      >
                        {SUPPORTED_CURRENCIES.map(curr => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Access Role</label>
                      <select 
                        value={regForm.role}
                        onChange={(e) => setRegForm({...regForm, role: e.target.value as any})}
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 dark:text-white transition-all appearance-none"
                      >
                        <option value="user">USER</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identity Credentials */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 pb-2">Identity Credentials</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Bank Entity</label>
                    <input 
                      type="text"
                      value={regForm.bank_entity}
                      onChange={(e) => setRegForm({...regForm, bank_entity: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 dark:text-white transition-all"
                      placeholder="GIBK London Node"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">SWIFT / BIC</label>
                      <input 
                        type="text"
                        value={regForm.swift_code}
                        onChange={(e) => setRegForm({...regForm, swift_code: e.target.value.toUpperCase()})}
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-mono font-bold outline-none focus:border-blue-600 dark:text-white transition-all"
                        placeholder="GIBKGB2L"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Account Number</label>
                      <input 
                        type="text"
                        value={regForm.account_number}
                        onChange={(e) => setRegForm({...regForm, account_number: e.target.value})}
                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-mono font-bold outline-none focus:border-blue-600 dark:text-white transition-all"
                        placeholder="5230314596"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">IBAN Identification</label>
                    <input 
                      type="text"
                      value={regForm.iban}
                      onChange={(e) => setRegForm({...regForm, iban: e.target.value.toUpperCase()})}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-mono font-bold outline-none focus:border-blue-600 dark:text-white transition-all"
                      placeholder="GB29 GIBK 0000 ..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-4">
              <button 
                type="button"
                onClick={() => setShowRegister(false)}
                className="px-8 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-gray-600 dark:hover:text-gray-300 transition-all"
              >
                Discard
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                Authorize & Provision Entity
              </button>
            </div>
          </form>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-xs font-bold uppercase tracking-wider">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {filteredProfiles.map(profile => (
          <div key={profile.id} className="bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
                    <Landmark className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{profile.full_name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        profile.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        {profile.role}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Entity ID: {profile.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {editingId === profile.id ? (
                    <>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="p-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Commit Changes
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => startEdit(profile)}
                      className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modify Credentials
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-3 h-3" /> Available Liquidity
                  </label>
                  {editingId === profile.id ? (
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        value={editForm.balance}
                        onChange={(e) => setEditForm({...editForm, balance: parseFloat(e.target.value)})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm font-black text-blue-600 dark:text-blue-400 outline-none focus:border-blue-600"
                      />
                      <select 
                        value={editForm.currency || 'USD'}
                        onChange={(e) => setEditForm({...editForm, currency: e.target.value})}
                        className="px-3 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-600 appearance-none"
                      >
                        {SUPPORTED_CURRENCIES.map(curr => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                      {CURRENCY_SYMBOLS[profile.currency || 'USD'] || '$'}
                      {profile.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <span className="text-[10px] ml-1 opacity-60">{profile.currency || 'USD'}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Landmark className="w-3 h-3" /> Bank Entity
                  </label>
                  {editingId === profile.id ? (
                    <input 
                      type="text"
                      value={editForm.bank_entity || ''}
                      onChange={(e) => setEditForm({...editForm, bank_entity: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-600"
                      placeholder="e.g. GIBK London Node"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-200">{profile.bank_entity || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Hash className="w-3 h-3" /> SWIFT / BIC
                  </label>
                  {editingId === profile.id ? (
                    <input 
                      type="text"
                      value={editForm.swift_code || ''}
                      onChange={(e) => setEditForm({...editForm, swift_code: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm font-mono font-bold text-gray-900 dark:text-white outline-none focus:border-blue-600"
                      placeholder="GIBKGB2L"
                    />
                  ) : (
                    <p className="text-sm font-mono font-bold text-gray-900 dark:text-gray-200">{profile.swift_code || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Hash className="w-3 h-3" /> Account Number
                  </label>
                  {editingId === profile.id ? (
                    <input 
                      type="text"
                      value={editForm.account_number || ''}
                      onChange={(e) => setEditForm({...editForm, account_number: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm font-mono font-bold text-gray-900 dark:text-white outline-none focus:border-blue-600"
                      placeholder="5230314596"
                    />
                  ) : (
                    <p className="text-sm font-mono font-bold text-gray-900 dark:text-gray-200">{profile.account_number || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3" /> IBAN ID
                  </label>
                  {editingId === profile.id ? (
                    <input 
                      type="text"
                      value={editForm.iban || ''}
                      onChange={(e) => setEditForm({...editForm, iban: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm font-mono font-bold text-gray-900 dark:text-white outline-none focus:border-blue-600"
                      placeholder="GB29 GIBK 0000 ..."
                    />
                  ) : (
                    <p className="text-sm font-mono font-bold text-gray-900 dark:text-gray-200">{profile.iban || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Active Node</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                    <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">KYC Verified</span>
                  </div>
               </div>
               <p className="text-[8px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest">Last Updated: {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}

        {filteredProfiles.length === 0 && (
          <div className="bg-white dark:bg-[#111] rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800 p-20 text-center">
            <Users className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">No matching entities found in global registry</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
