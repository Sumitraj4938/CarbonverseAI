import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';
import SupabaseAuth from './SupabaseAuth';
import Logo from './Logo';

interface ExtraControlsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionChange: (session: any) => void;
  supabaseUserId: string | null;
  onSyncRequest: () => void;
  syncing: boolean;
}

export default function ExtraControlsDrawer({
  isOpen,
  onClose,
  onSessionChange,
  supabaseUserId,
  onSyncRequest,
  syncing
}: ExtraControlsDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id="extra-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 z-50 backdrop-blur-sm cursor-pointer"
          />

          {/* Dedicated Identity & Sync Drawer Panel */}
          <motion.div
            id="extra-drawer-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 left-0 h-full w-full max-w-[460px] bg-slate-950 border-r border-white/5 shadow-2xl z-50 flex flex-col focus:outline-none text-left"
          >
            {/* Header portion */}
            <div className="p-5 border-b border-white/[0.04] bg-slate-950 flex justify-between items-center" id="drawer-header">
              <div className="flex items-center gap-3">
                <Logo size="xs" showSlogan={false} className="!items-start" />
                <div className="border-l border-white/10 pl-3">
                  <h3 className="text-[10px] font-bold text-white tracking-wider uppercase font-mono">Secure Vault</h3>
                  <p className="text-[8px] text-slate-500 font-mono uppercase tracking-widest leading-none mt-0.5">RLS Credentials Portal</p>
                </div>
              </div>
              
              <button 
                id="btn-close-extra-drawer"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close Portal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Core Authentication & Sync Container Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar bg-slate-950/90" id="drawer-scroll-body">
              <SupabaseAuth 
                onSessionChange={onSessionChange} 
                userId={supabaseUserId} 
                onSyncRequest={onSyncRequest} 
                syncing={syncing} 
              />
            </div>

            {/* Premium, honest footer status representation */}
            <div className="p-4.5 border-t border-white/[0.04] bg-slate-950 text-center text-[10px] text-slate-500 font-mono flex-shrink-0 flex justify-between items-center">
              <span>SECURITY CERTIFIED ENGINE</span>
              <span className="text-indigo-400/80 font-semibold uppercase tracking-wider">RLS Decarbonization Vault</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
