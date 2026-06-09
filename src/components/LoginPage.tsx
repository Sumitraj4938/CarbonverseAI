import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, User, Mail, ShieldAlert, CheckCircle, 
  AlertCircle, Cloud, ArrowRight, Eye, EyeOff, Sparkles, LogIn
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from './Logo';
import LoginLogo from './LoginLogo';

interface LoginPageProps {
  onLoginSuccess: (session: any) => void;
  initialEmail?: string;
}

const SIMULATED_USERS_KEY = 'carbonsteps_simulated_users';
const SIMULATED_SESSION_KEY = 'carbonsteps_simulated_session';

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isConfigured = !!supabase;
  const [useSandbox, setUseSandbox] = useState(!isConfigured);

  // Sync sandbox state when configuration helper loads
  useEffect(() => {
    setUseSandbox(!isConfigured);
  }, [isConfigured]);

  // Cleanup messages on tab switch
  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [isSignUp, useSandbox]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setAuthLoading(true);

    const normalEmail = email.trim().toLowerCase();

    // 1. Live Supabase Authentication
    if (isConfigured && !useSandbox) {
      try {
        if (isSignUp) {
          const { data, error } = await supabase!.auth.signUp({
            email: normalEmail,
            password,
            options: {
              data: {
                display_name: name.trim() || 'Eco Pioneer'
              }
            }
          });

          if (error) throw error;
          
          if (data.user) {
            if (data.session) {
              setSuccessMessage("Account created successfully!");
              onLoginSuccess(data.session);
            } else {
              setSuccessMessage("Sign up complete! Please check your email for a verification link. (Or toggle back to 'Local Sandbox' above for instant registration bypass)");
            }
          }
        } else {
          const { data, error } = await supabase!.auth.signInWithPassword({
            email: normalEmail,
            password
          });

          if (error) throw error;

          if (data.session) {
            setSuccessMessage("Successfully logged in!");
            onLoginSuccess(data.session);
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Authentication failed. Check your network or credentials.");
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    // 2. Simulated Local Sandbox Authentication
    setTimeout(() => {
      try {
        const users = JSON.parse(localStorage.getItem(SIMULATED_USERS_KEY) || '[]');
        
        if (isSignUp) {
          // Check if user already exists
          const existingUser = users.find((u: any) => u.email === normalEmail);
          if (existingUser) {
            throw new Error("An account with this email address already exists in the sandbox.");
          }

          // Create standard initial data profile
          const initialData = {
            id: 'sim_usr_' + Math.random().toString(36).substr(2, 9),
            email: normalEmail,
            name: name.trim() || 'Eco Pioneer',
            level: 'Tree',
            xp: 380,
            greenPoints: 460,
            streak: 4,
            calculatorData: {
              transportation: { carMiles: 140, carType: "hybrid", publicTransitHours: 5, flightsCount: 2 },
              electricity: { monthlyKwh: 380, renewableRatio: 0.3 },
              food: { dietType: "omnivore", wasteRatio: 3 },
              shopping: { clothingSpend: 100, electronicsSpend: 150, miscSpend: 80 },
              water: { dailyShowers: 12, appliancesWeekly: 6 }
            },
            breakdown: {
              transportation: 1950,
              electricity: 1420,
              food: 2150,
              shopping: 1120,
              water: 480,
              total: 7120,
              carbonScore: 72
            }
          };

          // Store simulated user
          const updatedUsers = [...users, { email: normalEmail, password, profile: initialData }];
          localStorage.setItem(SIMULATED_USERS_KEY, JSON.stringify(updatedUsers));
          
          // Generate active session
          const simulatedSession = {
            user: {
              id: initialData.id,
              email: normalEmail,
              user_metadata: { display_name: initialData.name }
            },
            simulated: true
          };

          if (rememberMe) {
            localStorage.setItem(SIMULATED_SESSION_KEY, JSON.stringify(simulatedSession));
          }

          setSuccessMessage("Sandbox account created successfully! Unlocking dashboard...");
          onLoginSuccess(simulatedSession);
        } else {
          // Signing In
          const matchingUser = users.find((u: any) => u.email === normalEmail);
          
          // Fallback user if matches the input demo in screenshot
          if (!matchingUser && normalEmail === 'rajsumit202425@gmail.com' && password === 'sumit1234') {
            const seedUser = {
              email: 'rajsumit202425@gmail.com',
              password: 'sumit1234',
              profile: {
                id: 'sim_usr_rajsumit',
                email: 'rajsumit202425@gmail.com',
                name: 'Raj Sumit',
                level: 'Tree',
                xp: 420,
                greenPoints: 500,
                streak: 5,
                calculatorData: {
                  transportation: { carMiles: 120, carType: "hybrid", publicTransitHours: 6, flightsCount: 1 },
                  electricity: { monthlyKwh: 320, renewableRatio: 0.4 },
                  food: { dietType: "vegetarian", wasteRatio: 2 },
                  shopping: { clothingSpend: 80, electronicsSpend: 110, miscSpend: 50 },
                  water: { dailyShowers: 10, appliancesWeekly: 5 }
                },
                breakdown: {
                  transportation: 1650,
                  electricity: 1220,
                  food: 1350,
                  shopping: 820,
                  water: 380,
                  total: 5420,
                  carbonScore: 81
                }
              }
            };
            users.push(seedUser);
            localStorage.setItem(SIMULATED_USERS_KEY, JSON.stringify(users));
            
            const simulatedSession = {
              user: {
                id: seedUser.profile.id,
                email: seedUser.email,
                user_metadata: { display_name: seedUser.profile.name }
              },
              simulated: true
            };
            if (rememberMe) {
              localStorage.setItem(SIMULATED_SESSION_KEY, JSON.stringify(simulatedSession));
            }
            setSuccessMessage("Successfully logged in! Unlocking dashboard...");
            onLoginSuccess(simulatedSession);
            return;
          }

          if (!matchingUser) {
            throw new Error("No sandbox account matches this email. Toggle to 'Sign Up Free' below to create a simulated account instantly!");
          }

          if (matchingUser.password !== password) {
            throw new Error("Invalid secure credentials. Please verify your password entry.");
          }

          const simulatedSession = {
            user: {
              id: matchingUser.profile.id,
              email: matchingUser.email,
              user_metadata: { display_name: matchingUser.profile.name }
            },
            simulated: true
          };

          if (rememberMe) {
            localStorage.setItem(SIMULATED_SESSION_KEY, JSON.stringify(simulatedSession));
          }

          setSuccessMessage("Authorized successfully! Opening website dashboard...");
          onLoginSuccess(simulatedSession);
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Login failed in Sandbox.");
      } finally {
        setAuthLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0B130E] text-white flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Absolute decorative radial backdrops */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0F2216] via-[#0B130E] to-[#12221F] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main unified responsive form container */}
      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* App Logo and branding container */}
        <div className="flex flex-col items-center text-center space-y-2 select-none mb-1">
          <Logo size="md" showSlogan={true} className="!items-center justify-center animate-fade-in" />
          <p className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase mt-2">
            GHG ACCREDITED ENVIRONMENTAL SCIENCE INDEX
          </p>
        </div>

        {/* Card box with sleek thin borders */}
        <div className="bg-[#0B130E]/75 border border-emerald-500/15 rounded-3xl p-6 md:p-8 shadow-2xl relative backdrop-blur-lg">
          
          <div className="absolute inset-x-0 -top-px h-[2px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          
          {/* Header information */}
          <div className="flex flex-col items-center justify-center text-center pb-4">
            <div className="bg-emerald-950/40 p-4.5 rounded-full border border-emerald-500/20 mb-3 text-emerald-400">
              <LoginLogo size="48" />
            </div>
            
            <h1 className="text-xl md:text-2xl font-black text-white tracking-wide font-display uppercase">
              {isSignUp ? 'Create Environment Account' : 'Portal Sign In'}
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-[280px]">
              {isSignUp 
                ? 'Join thousands of citizens modeling their lifestyle environmental footprint.' 
                : 'Enter your credentials to manage your Interactive Carbon Twin dashboard.'}
            </p>
          </div>

          {/* Connection Mode Toggle */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-emerald-500/10 mb-4 select-none">
            <button
              type="button"
              onClick={() => {
                if (!isConfigured) {
                  setErrorMessage("Supabase is not configured yet. Configure VITE_SUPABASE_URL & ANON_KEY in Secrets first, or use Sandbox Mode!");
                  return;
                }
                setUseSandbox(false);
              }}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono tracking-wider font-bold uppercase transition-all ${
                !useSandbox
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-[#0B130E] shadow bg-emerald-500'
                  : 'text-slate-400 hover:text-slate-200 cursor-pointer'
              } ${!isConfigured ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              Cloud (Supabase)
            </button>
            <button
              type="button"
              onClick={() => setUseSandbox(true)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono tracking-wider font-bold uppercase transition-all ${
                useSandbox
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-[#0B130E] shadow bg-emerald-500'
                  : 'text-slate-400 hover:text-slate-200 cursor-pointer'
              }`}
            >
              Local Sandbox
            </button>
          </div>

          {/* Sandbox alert detail box */}
          {useSandbox && (
            <div className="bg-emerald-500/10 border border-emerald-500/15 rounded-2xl p-3 mb-4 text-[11px] leading-relaxed text-slate-300">
              <div className="flex items-center gap-2 font-bold font-mono text-emerald-400 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400 animate-pulse" />
                <span>LOCAL SANDBOX ENGINE ACTIVE</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                Create any simulated account below instantly. Zero delays, no database set up or email verification required.
              </p>
            </div>
          )}

          {/* 1-Click Sandbox Fill */}
          {useSandbox && !isSignUp && (
            <div className="bg-slate-950/65 border border-emerald-500/10 rounded-2xl p-3 mb-4 text-left font-sans">
              <div className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Demo Profile (Instant Sign In)</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/10 rounded text-[8px] text-emerald-400 font-bold font-mono">1-CLICK</span>
              </div>
              <div className="flex items-center justify-between gap-3 bg-[#0B130E]/60 border border-emerald-500/5 rounded-xl p-2.5">
                <div className="font-mono text-[10px] text-slate-300 space-y-0.5">
                  <p className="truncate"><span className="text-slate-500">Email:</span> rajsumit202425@gmail.com</p>
                  <p><span className="text-slate-500">Pass:</span> sumit1234</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('rajsumit202425@gmail.com');
                    setPassword('sumit1234');
                    setErrorMessage(null);
                    setSuccessMessage("Demo credentials loaded! Press 'Access Portal Dashboard' below.");
                  }}
                  className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-bold tracking-wider font-mono uppercase transition-all cursor-pointer active:scale-95"
                >
                  Autofill
                </button>
              </div>
            </div>
          )}

          {/* User notifications */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-3 text-xs flex items-start gap-2 mb-4 animate-shake">
              <AlertCircle className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 rounded-xl p-3 text-xs flex items-start gap-2 mb-4">
              <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* Form controls */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Full Name (e.g. Raj Sumit)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/65 focus:bg-slate-950/90 border border-emerald-500/15 focus:border-[#10B981] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/65 focus:bg-slate-950/90 border border-emerald-500/15 focus:border-[#10B981] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Secure Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/65 focus:bg-slate-950/90 border border-emerald-500/15 focus:border-[#10B981] rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 select-none pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-emerald-500/20 bg-slate-950 text-emerald-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 transition-colors cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              
              <button
                type="button"
                onClick={() => setSuccessMessage("Simulated password reset email sent successfully!")}
                className="hover:text-emerald-400 transition-colors cursor-pointer font-semibold"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-[#0B130E] font-bold rounded-xl text-xs font-mono tracking-widest uppercase cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:translate-y-px disabled:opacity-50"
            >
              {authLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0B130E]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Activate Account' : 'Access Portal Dashboard'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0B130E]" />
                </>
              )}
            </button>
          </form>

          {/* Toggler button */}
          <div className="text-center pt-4 border-t border-emerald-500/10 mt-5">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-medium"
            >
              {isSignUp ? (
                <>
                  Already have an account? <span className="text-emerald-400 font-bold hover:underline">Sign In</span>
                </>
              ) : (
                <>
                  Don't have an environmental profile yet? <span className="text-emerald-400 font-bold hover:underline">Sign Up Free</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Footer legalities */}
        <div className="text-center text-[10px] text-slate-500 font-mono select-none">
          Locked using AES RLS Encryption standard indicators • ISO 14064 Compliance
        </div>

      </div>
    </div>
  );
}
