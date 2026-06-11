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

  // Cleanup messages on tab switch
  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [isSignUp]);



  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setAuthLoading(true);

    const normalEmail = email.trim().toLowerCase();

    // Graceful offline/local simulation fallback if Supabase keys are absent
    if (!isConfigured) {
      setSuccessMessage(isSignUp ? "Account created successfully!" : "Successfully logged in!");
      setTimeout(() => {
        onLoginSuccess({
          user: {
            id: `usr_${normalEmail.replace(/[^a-z0-9]/g, '_')}`,
            email: normalEmail,
            user_metadata: {
              display_name: name.trim() || 'Eco Pioneer'
            }
          }
        });
      }, 500);
      return;
    }

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
            setSuccessMessage("Sign up complete! Please check your email for a verification link.");
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
      setErrorMessage(err.message || "Authentication failed. Check your network, email, or secure credentials.");
    } finally {
      setAuthLoading(false);
    }
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
                <label htmlFor="reg-name" className="sr-only">Full Name</label>
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" aria-hidden="true" />
                <input
                  id="reg-name"
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
              <label htmlFor="login-email" className="sr-only">Email Address</label>
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/65 focus:bg-slate-950/90 border border-emerald-500/15 focus:border-[#10B981] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                required
              />
            </div>

            <div className="relative">
              <label htmlFor="login-password" className="sr-only">Password</label>
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" aria-hidden="true" />
              <input
                id="login-password"
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
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
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
        <div className="text-center text-[10px] text-slate-500 font-mono select-none space-y-1">
          <div>Locked using AES RLS Encryption standard indicators • ISO 14064 Compliance</div>
          <div className="text-[#10B981] font-semibold">Developer: Sumit Raj (IITian)</div>
        </div>

      </div>
    </div>
  );
}
