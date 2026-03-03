
import React from 'react';
import { Bell, User, Settings, LogOut, Shield, Layout, Send, History, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
  onTabChange: (tab: 'dashboard' | 'transfer' | 'history' | 'admin') => void;
  user: { name: string; role?: string } | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, onTabChange, user, isDarkMode, onToggleDarkMode }) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  return (
    <header className="bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <div className="bg-[#002366] dark:bg-blue-600 p-1.5 rounded-lg group-hover:scale-105 transition-transform">
              <div className="w-6 h-6 border-2 border-white rounded-sm flex items-center justify-center font-bold text-white text-xs">G</div>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Global Int <span className="text-[#002366] dark:text-blue-400">Banking</span>
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={onToggleDarkMode}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0a0a0a]"></span>
          </button>
          
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-1"></div>
          
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
            >
              <div className="flex flex-col items-end mr-2 hidden md:flex text-right">
                <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{user?.name || 'Institutional User'}</span>
                <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{user?.role || 'Member'}</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#002366] dark:bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-900/20">
                {user?.name?.substring(0, 2).toUpperCase() || 'GI'}
              </div>
            </button>

            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl shadow-blue-900/10 z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 md:hidden">
                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{user?.name || 'Institutional User'}</p>
                    <p className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{user?.role || 'Member'}</p>
                  </div>
                  
                  <div className="px-4 py-2">
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">Banking Operations</p>
                    <div className="space-y-1">
                      <button 
                        onClick={() => {
                          onTabChange('dashboard');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all"
                      >
                        <Layout className="w-4 h-4" />
                        Overview Dashboard
                      </button>
                      <button 
                        onClick={() => {
                          onTabChange('transfer');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all"
                      >
                        <Send className="w-4 h-4" />
                        New Transfer
                      </button>
                      <button 
                        onClick={() => {
                          onTabChange('history');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all"
                      >
                        <History className="w-4 h-4" />
                        Transaction Ledger
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-gray-50 dark:bg-gray-800 my-1"></div>

                  <div className="px-4 py-2">
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">System Management</p>
                    <div className="space-y-1">
                      {user?.role === 'admin' && (
                        <button 
                          onClick={() => {
                            onTabChange('admin');
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Control Panel
                        </button>
                      )}
                      
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all">
                        <Settings className="w-4 h-4" />
                        Security Settings
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-px bg-gray-50 dark:bg-gray-800 my-1"></div>
                  
                  <div className="px-4 py-2">
                    <button 
                      onClick={() => {
                        onLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Terminate Session
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
