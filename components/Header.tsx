
import React from 'react';
import { Menu, Bell, User, Settings, LogOut } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, onLogout }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-[#0D47A1] p-1.5 rounded-lg">
              <div className="w-6 h-6 border-2 border-white rounded-sm flex items-center justify-center font-bold text-white text-xs">G</div>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">
              Global Int <span className="text-[#0D47A1]">Banking</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
            <Settings className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-gray-200 mx-1"></div>
          
          <div className="flex items-center gap-2 group relative">
            <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700 hidden md:block">Global Int User</span>
              <div className="w-8 h-8 rounded-full bg-[#0D47A1] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                GI
              </div>
            </button>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all ml-2"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
