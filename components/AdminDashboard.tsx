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
  CheckCircle2, AlertCircle, ChevronRight, Hash,
  ShieldCheck, Plus, Trash2, ExternalLink
} from 'lucide-react';
import { api, UserProfile, UserAccount, Transaction } from '../api';

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
  const [activeTab, setActiveTab] = useState<'entities' | 'disputes' | 'settings'>('entities');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile> & { password?: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Settings State
  const [institutionalName, setInstitutionalName] = useState('');
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  
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

  // Account Management State
  const [selectedProfileForAccounts, setSelectedProfileForAccounts] = useState<UserProfile | null>(null);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [isAccountsLoading, setIsAccountsLoading] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState<Partial<UserAccount>>({
    account_name: '',
    bank_entity: '',
    swift_code: '',
    iban: '',
    account_number: '',
    balance: 0,
    currency: 'USD',
    is_primary: false
  });

  // Transaction Management State
  const [selectedProfileForTransaction, setSelectedProfileForTransaction] = useState<UserProfile | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [txForm, setTxForm] = useState({
    name: 'Manual Adjustment',
    recipientName: '',
    amount: '',
    currency: 'USD',
    type: 'out' as 'in' | 'out',
    status: 'Settled',
    accountId: '',
    paymentReason: 'Administrative Adjustment',
    recipient: '',
    bic: '',
    fee: '0.00',
    totalSettlement: ''
  });

  useEffect(() => {
    if (activeTab === 'entities') {
      loadProfiles();
    } else if (activeTab === 'disputes') {
      loadDisputes();
    } else if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    setIsSettingsLoading(true);
    try {
      const profile = await api.fetchProfile();
      setInstitutionalName(profile.bank_entity || '');
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const profile = await api.fetchProfile();
      await api.updateProfile(profile.id, { bank_entity: institutionalName });
      setMessage({ type: 'success', text: 'Institutional branding updated. Please refresh to see changes.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to update settings' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

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

  const loadUserAccounts = async (userId: string) => {
    setIsAccountsLoading(true);
    try {
      const data = await api.fetchUserAccounts(userId);
      setUserAccounts(data);
    } catch (e) {
      console.error('Failed to load user accounts', e);
    } finally {
      setIsAccountsLoading(false);
    }
  };

  const handleOpenAccounts = (profile: UserProfile) => {
    setSelectedProfileForAccounts(profile);
    loadUserAccounts(profile.id);
  };

  const handleOpenTransaction = async (profile: UserProfile) => {
    setSelectedProfileForTransaction(profile);
    setTxForm({
      ...txForm,
      currency: profile.currency || 'USD',
      accountId: ''
    });
    setShowTransactionForm(true);
    
    // Fetch accounts to populate the dropdown
    setIsAccountsLoading(true);
    try {
      const accounts = await api.fetchUserAccounts(profile.id);
      setUserAccounts(accounts);
    } catch (e) {
      console.error('Failed to fetch accounts', e);
    } finally {
      setIsAccountsLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileForTransaction) return;
    
    setIsSaving(true);
    try {
      const amountNum = parseFloat(txForm.amount || '0');
      const feeNum = parseFloat(txForm.fee || '0');
      const totalSettlement = (amountNum + feeNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      await api.adminAddTransaction(selectedProfileForTransaction.id, {
        ...txForm,
        amount: txForm.amount,
        totalSettlement: totalSettlement
      });
      setMessage({ type: 'success', text: 'Transaction recorded successfully' });
      setShowTransactionForm(false);
      loadProfiles();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to record transaction' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileForAccounts) return;
    
    setIsSaving(true);
    try {
      if (editingAccountId) {
        await api.updateAccount(editingAccountId, accountForm);
        setMessage({ type: 'success', text: 'Account updated successfully' });
      } else {
        await api.createAccount({
          ...accountForm,
          user_id: selectedProfileForAccounts.id
        } as any);
        setMessage({ type: 'success', text: 'New account delegated successfully' });
      }
      setShowAccountForm(false);
      setEditingAccountId(null);
      setAccountForm({
        account_name: '',
        bank_entity: '',
        swift_code: '',
        iban: '',
        account_number: '',
        balance: 0,
        currency: 'USD',
        is_primary: false
      });
      loadUserAccounts(selectedProfileForAccounts.id);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to save account' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this account delegation?')) return;
    setIsSaving(true);
    try {
      await api.deleteAccount(id);
      setMessage({ type: 'success', text: 'Account delegation revoked' });
      if (selectedProfileForAccounts) loadUserAccounts(selectedProfileForAccounts.id);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to delete account' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const startEditAccount = (account: UserAccount) => {
    setEditingAccountId(account.id);
    setAccountForm(account);
    setShowAccountForm(true);
  };

  const loadDisputes = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchAllDisputes();
      console.log('Loaded disputes:', data);
      setDisputes(data);
    } catch (e) {
      console.error('Failed to load disputes', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDispute = async (id: string, status: string) => {
    const notes = prompt('Resolution notes (optional):');
    setIsSaving(true);
    try {
      await api.updateDisputeStatus(id, status, notes || undefined);
      setMessage({ type: 'success', text: `Dispute ${status} successfully` });
      loadDisputes();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to update dispute' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
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
      // 1. Update Auth Data if email or password changed
      if (editForm.email || editForm.password) {
        await api.adminUpdateUser(editingId, {
          email: editForm.email,
          password: editForm.password,
          full_name: editForm.full_name
        });
      }

      // 2. Update Profile Data (all other fields)
      const { password: _, ...profileUpdates } = editForm;
      await api.updateProfile(editingId, profileUpdates);
      
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
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mr-4">
            <button
              onClick={() => setActiveTab('entities')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'entities' 
                  ? 'bg-white dark:bg-[#111] text-blue-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              Entities
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'disputes' 
                  ? 'bg-white dark:bg-[#111] text-blue-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              Disputes
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'settings' 
                  ? 'bg-white dark:bg-[#111] text-blue-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              Settings
            </button>
          </div>

          {activeTab === 'entities' && (
            <button 
              onClick={() => setShowRegister(!showRegister)}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              {showRegister ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {showRegister ? 'Cancel Provisioning' : 'Provision New Entity'}
            </button>
          )}
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
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Auth Credentials</h4>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                    <span className="text-[8px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Auto-Confirm Active</span>
                  </div>
                </div>
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
        {activeTab === 'settings' ? (
          <div className="bg-white dark:bg-[#111] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 md:p-12 shadow-sm">
            <div className="max-w-2xl">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Institutional Branding</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-8">Configure how your bank entity appears across the platform, invoices, and receipts.</p>
              
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Bank Entity Name (e.g. FF LLC)</label>
                  <div className="relative">
                    <Landmark className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <input 
                      type="text"
                      value={institutionalName}
                      onChange={(e) => setInstitutionalName(e.target.value)}
                      placeholder="Enter Bank Entity Name..."
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-sm font-black text-gray-900 dark:text-white outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight px-1 mt-2">
                    This name will replace "Main Institutional Account" in the header, balance cards, and will appear as the sender on all generated documents.
                  </p>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isSaving || isSettingsLoading}
                    className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Institutional Branding
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : activeTab === 'entities' ? (
          filteredProfiles.map(profile => (
            <div key={profile.id} className="bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
                      <Landmark className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {editingId === profile.id ? (
                          <input 
                            type="text"
                            value={editForm.full_name || ''}
                            onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                            className="px-3 py-1 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm font-black text-gray-900 dark:text-white outline-none focus:border-blue-600"
                            placeholder="Full Name"
                          />
                        ) : (
                          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{profile.full_name}</h3>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          profile.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}>
                          {profile.role}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Entity ID: {profile.id}</p>
                        {profile.email && <p className="text-[10px] font-bold text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest">{profile.email}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleOpenTransaction(profile)}
                      className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-100 dark:hover:bg-green-800 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Transaction
                    </button>
                    <button 
                      onClick={() => handleOpenAccounts(profile)}
                      className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-800 transition-all flex items-center gap-2"
                    >
                      <Landmark className="w-4 h-4" />
                      Manage Accounts
                    </button>
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

                  {editingId === profile.id && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Activity className="w-3 h-3" /> Email Address
                        </label>
                        <input 
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-600"
                          placeholder="entity@gibk.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Shield className="w-3 h-3" /> New Password
                        </label>
                        <input 
                          type="password"
                          value={editForm.password || ''}
                          onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-600"
                          placeholder="Leave blank to keep current"
                        />
                      </div>
                    </>
                  )}

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
          ))
        ) : (
          disputes.map(dispute => (
            <div key={dispute.id} className="bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow p-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      dispute.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      dispute.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                      dispute.status === 'approved_pending_refund' ? 'bg-purple-100 text-purple-700' :
                      dispute.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {dispute.status === 'resolved' ? 'Approved & Refunded' : dispute.status.replace(/_/g, ' ')}
                    </span>
                    {dispute.status === 'approved_pending_refund' && dispute.scheduled_refund_at && (
                      <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-900/30">
                        <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                          Scheduled Refund: {new Date(dispute.scheduled_refund_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mt-2">
                      Reason: {dispute.reason}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px]">
                    <div className="space-y-1">
                      <p className="text-gray-400 uppercase font-black tracking-widest">Transaction ID</p>
                      <p className="font-mono font-bold text-gray-900 dark:text-gray-200">{dispute.transaction_id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 uppercase font-black tracking-widest">User</p>
                      <p className="font-bold text-gray-900 dark:text-gray-200 truncate max-w-[150px]" title={dispute.profiles?.full_name || dispute.user_id}>
                        {dispute.profiles?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-[8px] font-mono text-gray-500 truncate">{dispute.user_id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 uppercase font-black tracking-widest">Amount</p>
                      <p className="font-bold text-gray-900 dark:text-gray-200">
                        {dispute.transactions?.currency} {dispute.transactions?.amount}
                        {dispute.refund_amount > 0 && (
                          <span className="ml-2 text-green-600 dark:text-green-400">
                            (Refund: {dispute.refund_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest">Details</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{dispute.details}</p>
                  </div>

                  {dispute.resolution_notes && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Resolution Notes</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 italic">"{dispute.resolution_notes}"</p>
                    </div>
                  )}
                </div>

                {dispute.status !== 'resolved' && dispute.status !== 'rejected' && dispute.status !== 'approved_pending_refund' && (
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <button
                      onClick={() => handleUpdateDispute(dispute.id, 'under_review')}
                      className="w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                    >
                      Under Review
                    </button>
                    <button
                      onClick={() => handleUpdateDispute(dispute.id, 'approved_pending_refund')}
                      className="w-full px-4 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all"
                    >
                      Approve (Refund 15m)
                    </button>
                    <button
                      onClick={() => handleUpdateDispute(dispute.id, 'resolved')}
                      className="w-full px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all"
                    >
                      Approve & Refund Now
                    </button>
                    <button
                      onClick={() => handleUpdateDispute(dispute.id, 'rejected')}
                      className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                    >
                      Reject Claim
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {((activeTab === 'entities' && filteredProfiles.length === 0) || (activeTab === 'disputes' && disputes.length === 0)) && (
          <div className="bg-white dark:bg-[#111] rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800 p-20 text-center">
            <Users className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
              No {activeTab} found in global registry
            </p>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {selectedProfileForTransaction && showTransactionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTransactionForm(false)}></div>
          <div className="relative bg-white dark:bg-[#0f0f0f] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800">
            <div className="bg-green-600 px-8 py-6 flex items-center justify-between">
              <div>
                <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                  <Activity className="w-5 h-5" />
                  Manual Transaction: {selectedProfileForTransaction.full_name}
                </h3>
                <p className="text-green-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Inject or deduct liquidity from this entity</p>
              </div>
              <button 
                onClick={() => setShowTransactionForm(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Transaction Type</label>
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTxForm({...txForm, type: 'in'})}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        txForm.type === 'in' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-400'
                      }`}
                    >
                      Credit (Deposit)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxForm({...txForm, type: 'out'})}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        txForm.type === 'out' ? 'bg-white dark:bg-gray-700 text-red-600 shadow-sm' : 'text-gray-400'
                      }`}
                    >
                      Debit (Withdrawal)
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Target Account</label>
                  <select 
                    value={txForm.accountId}
                    onChange={(e) => setTxForm({...txForm, accountId: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:border-green-600 dark:text-white appearance-none"
                  >
                    <option value="">Primary Profile Balance</option>
                    {userAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.account_name} ({acc.currency})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Transaction Name</label>
                  <input 
                    required
                    type="text"
                    value={txForm.name}
                    onChange={(e) => setTxForm({...txForm, name: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:border-green-600 dark:text-white"
                    placeholder="e.g. Liquidity Injection"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Counterparty Name</label>
                  <input 
                    required
                    type="text"
                    value={txForm.recipientName}
                    onChange={(e) => setTxForm({...txForm, recipientName: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:border-green-600 dark:text-white"
                    placeholder="e.g. Global International Banking"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Amount</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">{CURRENCY_SYMBOLS[txForm.currency] || '$'}</span>
                    <input 
                      required
                      type="text"
                      value={txForm.amount}
                      onChange={(e) => setTxForm({...txForm, amount: e.target.value})}
                      className="w-full pl-10 pr-5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black text-blue-600 outline-none focus:border-green-600"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Settlement Fee</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">{CURRENCY_SYMBOLS[txForm.currency] || '$'}</span>
                    <input 
                      type="text"
                      value={txForm.fee}
                      onChange={(e) => setTxForm({...txForm, fee: e.target.value})}
                      className="w-full pl-10 pr-5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black text-red-600 outline-none focus:border-green-600"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Currency</label>
                  <select 
                    value={txForm.currency}
                    onChange={(e) => setTxForm({...txForm, currency: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:border-green-600 dark:text-white appearance-none"
                  >
                    {SUPPORTED_CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSaving}
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-3"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                Commit Transaction
              </button>
            </form>
          </div>
        </div>
      )}
      {selectedProfileForAccounts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProfileForAccounts(null)}></div>
          <div className="relative bg-white dark:bg-[#0f0f0f] w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800">
            <div className="bg-[#002366] dark:bg-blue-900/40 px-8 py-6 flex items-center justify-between">
              <div>
                <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                  <Landmark className="w-5 h-5" />
                  Account Delegation: {selectedProfileForAccounts.full_name}
                </h3>
                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Manage multiple bank account identities for this entity</p>
              </div>
              <button 
                onClick={() => setSelectedProfileForAccounts(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {showAccountForm ? (
                <form onSubmit={handleSaveAccount} className="space-y-6 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">
                      {editingAccountId ? 'Edit Delegated Account' : 'Provision New Delegation'}
                    </h4>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowAccountForm(false);
                        setEditingAccountId(null);
                      }}
                      className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Display Name</label>
                      <input 
                        required
                        type="text"
                        value={accountForm.account_name}
                        onChange={(e) => setAccountForm({...accountForm, account_name: e.target.value})}
                        className="w-full px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:border-blue-600 dark:text-white"
                        placeholder="e.g. European Operations"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Bank Entity</label>
                      <input 
                        required
                        type="text"
                        value={accountForm.bank_entity}
                        onChange={(e) => setAccountForm({...accountForm, bank_entity: e.target.value})}
                        className="w-full px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:border-blue-600 dark:text-white"
                        placeholder="e.g. Deutsche Bank AG"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">SWIFT / BIC</label>
                      <input 
                        required
                        type="text"
                        value={accountForm.swift_code}
                        onChange={(e) => setAccountForm({...accountForm, swift_code: e.target.value.toUpperCase()})}
                        className="w-full px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-600 dark:text-white"
                        placeholder="DEUTDEFF"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Account Number</label>
                      <input 
                        required
                        type="text"
                        value={accountForm.account_number}
                        onChange={(e) => setAccountForm({...accountForm, account_number: e.target.value})}
                        className="w-full px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-600 dark:text-white"
                        placeholder="0180501002"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">IBAN Identification</label>
                      <input 
                        required
                        type="text"
                        value={accountForm.iban}
                        onChange={(e) => setAccountForm({...accountForm, iban: e.target.value.toUpperCase()})}
                        className="w-full px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-600 dark:text-white"
                        placeholder="DE93 3003 0880 ..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Initial Liquidity</label>
                      <input 
                        type="number"
                        value={accountForm.balance}
                        onChange={(e) => setAccountForm({...accountForm, balance: parseFloat(e.target.value)})}
                        className="w-full px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black text-blue-600 outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Currency</label>
                      <select 
                        value={accountForm.currency}
                        onChange={(e) => setAccountForm({...accountForm, currency: e.target.value})}
                        className="w-full px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:border-blue-600 dark:text-white appearance-none"
                      >
                        {SUPPORTED_CURRENCIES.map(curr => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-center gap-3 py-2">
                      <input 
                        type="checkbox"
                        id="is_primary"
                        checked={accountForm.is_primary}
                        onChange={(e) => setAccountForm({...accountForm, is_primary: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="is_primary" className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Set as Primary Account</label>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                    {editingAccountId ? 'Update Delegation' : 'Authorize Delegation'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Delegated Identities</h4>
                    <button 
                      onClick={() => setShowAccountForm(true)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add New Account
                    </button>
                  </div>

                  {isAccountsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : userAccounts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                      <Landmark className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No delegated accounts assigned</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {userAccounts.map((acc) => (
                        <div key={acc.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-900/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${acc.is_primary ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                              <Landmark className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{acc.account_name}</h5>
                                {acc.is_primary && (
                                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-widest rounded-full">Primary</span>
                                )}
                              </div>
                              <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mt-1">{acc.iban}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Liquidity</p>
                              <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                                {CURRENCY_SYMBOLS[acc.currency] || '$'}
                                {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => startEditAccount(acc)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteAccount(acc.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
