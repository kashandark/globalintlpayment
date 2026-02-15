
import React, { useState } from 'react';
import { Lock, User, ShieldCheck, ChevronRight, Loader2, Globe, ShieldAlert } from 'lucide-react';

interface LoginProps {
  onLogin: (userData: { name: string; balance: number }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate Institutional API Authentication
    setTimeout(() => {
      if (username === 'asdi_global' && password === 'admin123') {
        const userData = {
          name: 'Global International Liquidity',
          balance: 1000000000.00
        };
        // Persist session in localStorage
        localStorage.setItem('asdipro_session', JSON.stringify({
          token: 'inst_882910_x7',
          user: userData,
          expiry: Date.now() + (3600 * 1000) // 1 hour session
        }));
        onLogin(userData);
      } else {
        setError('Invalid credentials or unauthorized access node.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#001533] flex items-center justify-center p-4 font-['Inter'] relative overflow-hidden">
      {/* Background patterns for a high-security feel */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[100px] -ml-48 -mb-48"></div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Header Branding */}
          <div className="bg-[#002366] p-10 text-center relative">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-blue-400/30 rounded-full"></div>
             <div className="inline-flex items-center justify-center bg-white p-3 rounded-2xl shadow-xl mb-6">
                <div className="w-8 h-8 bg-[#002366] flex items-center justify-center font-bold text-white rounded-lg">G</div>
             </div>
             <h1 className="text-2xl font-black text-white tracking-tight mb-1">GLOBAL INTERNATIONAL <span className="text-blue-400 font-medium">BANKING</span></h1>
             <p className="text-blue-200/60 text-[10px] uppercase font-bold tracking-[0.3em]">Institutional Access Gateway</p>
          </div>

          <div className="p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Terminal ID / Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-gray-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:border-blue-600 focus:ring-0 text-sm font-semibold text-gray-900 transition-all outline-none bg-gray-50/50"
                    placeholder="Enter Username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Security Access Key</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:border-blue-600 focus:ring-0 text-sm font-semibold text-gray-900 transition-all outline-none bg-gray-50/50"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[11px] font-bold flex items-center gap-3 border border-red-100 animate-in shake duration-300">
                  <ShieldAlert className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#002366] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20 hover:bg-blue-900 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Establish Secure Session
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="flex items-center justify-center gap-6 opacity-30">
                <div className="flex flex-col items-center gap-1">
                   <ShieldCheck className="w-5 h-5" />
                   <span className="text-[8px] font-bold uppercase">HSM V.4</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                   <Globe className="w-5 h-5" />
                   <span className="text-[8px] font-bold uppercase">SWIFT-ID</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-blue-200/30 text-[9px] uppercase font-bold tracking-[0.2em]">
          Restricted System. Authorized Personnel Only. <br/>
          All activities are logged and monitored.
        </p>
      </div>
    </div>
  );
};

export default Login;
