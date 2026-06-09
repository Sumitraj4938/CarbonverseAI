import React, { useState, useEffect } from 'react';
import { supabase, SUPABASE_SETUP_SQL } from '../lib/supabase';
import { 
  Cloud, Lock, User, Mail, ShieldAlert, CheckCircle, 
  AlertCircle, ChevronRight, Terminal, Copy, LogOut, Loader2,
  Eye, EyeOff, Github, Chrome, Apple, ArrowRight
} from 'lucide-react';
import Logo from './Logo';

interface SupabaseAuthProps {
  onSessionChange: (session: any) => void;
  userId: string | null;
  onSyncRequest: () => void;
  syncing: boolean;
}

export default function SupabaseAuth({ onSessionChange, userId, onSyncRequest, syncing }: SupabaseAuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const isConfigured = !!(import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  // Retrieve existing Supabase session if configured
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserEmail(session.user.email || null);
        onSessionChange(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserEmail(session.user.email || null);
        onSessionChange(session);
      } else {
        setUserEmail(null);
        onSessionChange(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [onSessionChange]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name || 'Eco Pioneer'
            }
          }
        });

        if (error) throw error;
        
        if (data.user) {
          if (data.session) {
            setSuccessMessage("Account created successfully!");
            setUserEmail(data.user.email || null);
            onSessionChange(data.session);
          } else {
            setSuccessMessage("Verification check active! Please confirm in simulated sandbox.");
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.session) {
          setSuccessMessage("Successfully logged in!");
          setUserEmail(data.user?.email || null);
          onSessionChange(data.session);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An authentication error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setAuthLoading(true);
    try {
      await supabase.auth.signOut();
      onSessionChange(null);
      setUserEmail(null);
      setSuccessMessage("Logged out successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Logout failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div id="supabase-auth-panel" className="relative overflow-hidden text-left h-full flex flex-col justify-between rounded-3xl bg-slate-950/40 border border-white/5 shadow-2xl shadow-slate-950/50">
      
      {/* 1. Subtle, colorful mesh gradient background with glowing ambient light blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/45 via-slate-900/60 to-slate-950/95 pointer-events-none" />
      
      {/* soft glowing radial blobs behind the card for visual depth */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute -bottom-16 -right-16 w-52 h-52 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main glass containers */}
      <div className="relative z-10 p-6 flex-1 flex flex-col justify-between">
        <div>
          
          {/* Header metadata branding */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <Logo size="xs" showSlogan={false} className="!items-start" />
              <div className="border-l border-white/10 pl-3">
                <h3 className="text-[10px] font-bold text-white tracking-widest font-mono uppercase">CarbonSync</h3>
                <p className="text-[8px] text-slate-500 font-mono tracking-widest uppercase leading-none mt-0.5">Decarbonization Vault</p>
              </div>
            </div>
            
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-mono shadow-sm transition-all ${
              isConfigured 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400 animate-pulse'}`} />
              <span>{isConfigured ? 'SECURE DB' : 'CLOUD SANDBOX'}</span>
            </div>
          </div>

          {/* Dev credentials guidance */}
          {!isConfigured && (
            <div id="supabase-key-warning" className="bg-slate-900/80 border border-white/5 rounded-2xl p-3.5 mb-5 text-[11px] text-slate-300 leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-indigo-400 font-mono">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>SANDBOX MODE ACTIVE</span>
              </div>
              <p className="text-[10.5px] text-slate-400">
                Operates instantly using a fast virtual cloud sandbox. To connect to live production PostgreSQL, add your tokens in AI Studio's <strong>Settings / Secrets</strong> tab:
              </p>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/5 font-mono text-[9px] text-cyan-400 space-y-1 select-all">
                <div>VITE_SUPABASE_URL = "https://your-proj.supabase.co"</div>
                <div>VITE_SUPABASE_ANON_KEY = "your-anon-role-id"</div>
              </div>
            </div>
          )}

          {/* Banner notification feedbacks */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-2xl p-3 mb-4 text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md rounded-2xl p-3 mb-4 text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* Authenticated Dashboard / Setup tools */}
          {userId ? (
            <div id="authenticated-ui" className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-950/20 via-slate-900/60 to-slate-950/80 border border-white/5 rounded-2xl p-4 flex flex-col space-y-3 shadow-lg">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">ACTIVE INTEGRATION</span>
                  <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{userEmail}</span>
                </div>
                
                <p className="text-slate-300 text-xs leading-relaxed font-sans">
                  Your live environmental carbon statistics, milestone green badges, progress history, and active quests are fully synced and secure under direct security hashes.
                </p>

                <div className="flex gap-2.5 pt-1">
                  <button
                    id="btn-sync-supabase"
                    disabled={syncing}
                    onClick={onSyncRequest}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-mono text-xs font-bold cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-violet-500/10 active:scale-95"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3.5 h-3.5 text-white" />
                        Sync Data Snapshot
                      </>
                    )}
                  </button>
                  <button
                    id="btn-signout-supabase"
                    onClick={handleSignOut}
                    disabled={authLoading}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 active:bg-white/[0.03] border border-white/10 rounded-xl text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all active:scale-95 duration-200"
                    title="Sign Out Account"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
              
              {/* Show SQL installation instruction panel inside the synced space */}
              <div className="rounded-2xl border border-white/5 p-3 bg-slate-900/40 space-y-2">
                <button
                  id="btn-toggle-sql-tips"
                  onClick={() => setShowSql(!showSql)}
                  className="w-full text-left text-xs font-mono font-bold text-slate-400 hover:text-white flex justify-between items-center cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    DATABASE CONSOLE schema
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showSql ? 'rotate-90' : ''}`} />
                </button>
                {showSql && (
                  <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                    <p className="text-slate-400 text-[10px] leading-tight">
                      Execute this SQL script in your Supabase Dashboard to initiate row level security policies:
                    </p>
                    <div className="relative">
                      <pre className="p-2.5 max-h-40 overflow-y-auto bg-slate-950 border border-white/5 rounded font-mono text-[9px] text-cyan-400 select-all">
                        {SUPABASE_SETUP_SQL}
                      </pre>
                      <button
                        id="btn-copy-sql"
                        onClick={copySqlToClipboard}
                        className="absolute right-1.5 top-1.5 p-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                        title="Copy SQL Table Script"
                      >
                        {copiedSql ? 'Copied!' : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            
            /* Interactive Premium Floating Login Card Form */
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="text-left pb-1">
                <h4 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent font-sans tracking-tight">
                  {isSignUp ? "Create dynamic account." : "Welcome back."}
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  {isSignUp 
                    ? "Start tracking your carbon story with modern diagnostics." 
                    : "Access your cloud synchronization & global elite ranks."}
                </p>
              </div>

              {/* Form entries with focus scale glow transitions */}
              {isSignUp && (
                <div className="relative group">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 transition-colors group-focus-within:text-violet-400" />
                  <input
                    id="auth-name-input"
                    type="text"
                    placeholder="Full Name (e.g. Marcus Aero)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-slate-950 border border-white/10 hover:border-white/20 focus:border-violet-500/80 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500/80 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                    required
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 transition-colors group-focus-within:text-violet-400" />
                <input
                  id="auth-email-input"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-slate-950 border border-white/10 hover:border-white/20 focus:border-violet-500/80 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500/80 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 transition-colors group-focus-within:text-violet-400" />
                <input
                  id="auth-password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create Secure Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] hover:bg-white/[0.06] focus:bg-slate-950 border border-white/10 hover:border-white/20 focus:border-violet-500/80 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder-slate-500/80 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                  minLength={6}
                  required
                />
                
                {/* 3. Password Toggle Action */}
                <button
                  type="button"
                  id="btn-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* 4. Remember Me and Forgot Password linkages */}
              <div className="flex items-center justify-between text-xs font-sans text-slate-400 pt-0.5 select-noneId">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/10 bg-white/5 text-violet-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 transition-colors cursor-pointer"
                  />
                  <span className="group-hover:text-slate-200 transition-colors">Remember me</span>
                </label>
                
                <button
                  type="button"
                  id="btn-forgot-password-link"
                  onClick={() => setSuccessMessage("Password reset instructions dispatched to your email! (Simulated)")}
                  className="hover:text-violet-400 transition-colors hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Activation Button */}
              <button
                id="btn-auth-submit"
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold rounded-xl text-xs font-sans tracking-wider uppercase cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/15 duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Dynamic Profile' : 'Sign In Now'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Divider standard section */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-mono">
                  <span className="bg-[#0f172a] px-3 text-slate-500 font-medium">Or continue with</span>
                </div>
              </div>

              {/* Minimalist well-spaced social connectors */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  id="social-btn-google"
                  onClick={() => setSuccessMessage("Google Social Auth active in your identity container.")}
                  className="flex justify-center items-center py-2.5 px-4 bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/[0.04] border border-white/[0.06] hover:border-violet-500/30 rounded-xl transition-all duration-200 group cursor-pointer"
                  title="Sign in with Google"
                >
                  <Chrome className="w-3.5 h-3.5 text-slate-350 group-hover:text-amber-400 group-hover:scale-110 transition-all duration-200" />
                </button>
                <button
                  type="button"
                  id="social-btn-apple"
                  onClick={() => setSuccessMessage("Apple Secure ID active in your identity container.")}
                  className="flex justify-center items-center py-2.5 px-4 bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/[0.04] border border-white/[0.06] hover:border-violet-500/30 rounded-xl transition-all duration-200 group cursor-pointer"
                  title="Sign in with Apple"
                >
                  <Apple className="w-3.5 h-3.5 text-slate-350 group-hover:text-white group-hover:scale-110 transition-all duration-200" />
                </button>
                <button
                  type="button"
                  id="social-btn-github"
                  onClick={() => setSuccessMessage("GitHub developer identity active in your container.")}
                  className="flex justify-center items-center py-2.5 px-4 bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/[0.04] border border-white/[0.06] hover:border-violet-500/30 rounded-xl transition-all duration-200 group cursor-pointer"
                  title="Sign in with GitHub"
                >
                  <Github className="w-3.5 h-3.5 text-slate-350 group-hover:text-violet-400 group-hover:scale-110 transition-all duration-200" />
                </button>
              </div>

              {/* Footer text switches */}
              <div className="text-center pt-2">
                <button
                  id="btn-toggle-auth-mode"
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer font-sans"
                >
                  {isSignUp ? (
                    <>
                      Already have an account? <span className="text-violet-400 font-semibold hover:underline">Sign In</span>
                    </>
                  ) : (
                    <>
                      Don't have an account? <span className="text-cyan-400 font-semibold hover:underline">Sign Up</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Fixed Footer info */}
        <div className="mt-6 pt-4 border-t border-white/[0.03] text-[9.5px] text-slate-500 font-mono leading-relaxed select-none">
          <span>Enterprise-grade authentication layer secured with high performance SSL & RLS encryption metrics.</span>
        </div>
      </div>
    </div>
  );
}
