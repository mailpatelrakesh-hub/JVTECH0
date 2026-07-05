import React, { useState } from 'react';
import { UserRole, SystemSettings, StaffUser } from '../types';
import Logo from './Logo';
import { 
  Lock, User, Sparkles, Shield, Compass, ChevronRight, 
  AlertCircle, Eye, EyeOff, CheckSquare, Info
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (username: string, role: UserRole) => void;
  onCandidateBypass: () => void;
  systemSettings?: SystemSettings;
  systemUsers?: StaffUser[];
}

export default function LoginPage({ onLoginSuccess, onCandidateBypass, systemSettings, systemUsers = [] }: LoginPageProps) {
  
  // Credentials states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    // Simulate network delay
    setTimeout(() => {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      // Check against dynamic systemUsers list
      const foundUser = systemUsers.find(u => u.username.toLowerCase() === cleanUser);
      if (foundUser) {
        if (foundUser.status === 'Suspended') {
          setErrorMsg('Account Suspended: Contact administrator.');
          setIsSubmitting(false);
          return;
        }
        const expectedPass = foundUser.password || (foundUser.role === 'Admin' ? 'admin123' : 'staff123');
        if (cleanPass === expectedPass) {
          onLoginSuccess(foundUser.name, foundUser.role);
          return;
        }
      }

      setErrorMsg('Invalid Username or Password!');
      setIsSubmitting(false);
    }, 800);
  };

  const travelImages = [
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80', // Airplane/Aviation
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80', // Travel/Passport/Map
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80', // Scenic travel/boat/mountains
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80', // Beautiful resort/travel
    'https://images.unsplash.com/photo-1491557348673-cf171f111a62?auto=format&fit=crop&w=1600&q=80'  // Airplane wing/clouds view
  ];

  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % travelImages.length);
    }, 6000); // changes every 6 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div id="login-page-container" className="min-h-screen w-full bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Absolute Decorative backgrounds - Auto Sliding Travel Photos */}
      <div className="absolute inset-0 z-0">
        {travelImages.map((imgUrl, idx) => (
          <img 
            key={imgUrl}
            src={imgUrl} 
            alt="Beautiful Travel Background"
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
              idx === currentBgIndex ? 'opacity-25' : 'opacity-0'
            } mix-blend-overlay`}
            referrerPolicy="no-referrer"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/90 to-brand-950/30" />
      </div>

      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100/10 z-10 overflow-hidden flex flex-col justify-between">
        
        {/* Brand Header */}
        <div className="p-6 md:p-8 bg-slate-950 text-white relative border-b border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/45 to-slate-900 opacity-50" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <Logo size="md" theme="dark" className="flex-col text-center gap-2" />
          </div>
        </div>

        {/* Card Body */}
        <div className="px-6 py-6 md:px-8 md:py-8 space-y-5">
          {/* SECURE OFFICE LOGIN FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center pb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-brand-500" />
                <span>Office Login Only</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Username / ID</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl py-3 pl-9 pr-4 transition-all outline-none text-slate-700 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl py-3 pl-9 pr-10 transition-all outline-none text-slate-700 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Secure Sign In'}</span>
              {!isSubmitting && <ChevronRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-slate-500 text-[10px] space-y-1 z-10">
        <p>© 2026 {systemSettings?.portalName || 'JV Tech Test & Training Center, Kushinagar'} Private Ltd.</p>
        <p className="font-semibold text-slate-400">{(systemSettings?.locationDetails || 'Kushinagar, Uttar Pradesh')} • Secure System Login</p>
      </div>
    </div>
  );
}
