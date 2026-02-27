'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, X, Info } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  tool: string;
  params: any;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({ isOpen, tool, params, onConfirm, onCancel }: ConfirmationModalProps) {
  if (!isOpen) return null;

  const toolDisplayName = tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <Shield size={32} />
            </div>
            <h2 className="text-xl font-bold">Authorization Required</h2>
            <p className="text-white/80 text-sm mt-1">Agent is requesting to perform an action</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                <div className="bg-zinc-200 dark:bg-zinc-700 p-2 rounded-lg shrink-0">
                  <Info size={18} className="text-zinc-600 dark:text-zinc-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{toolDisplayName}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                    This action requires a Verifiable Presentation.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Parameters</span>
                <div className="bg-zinc-100 dark:bg-zinc-950 p-3 rounded-lg font-mono text-xs text-zinc-700 dark:text-zinc-300 break-all max-h-32 overflow-y-auto">
                  {JSON.stringify(params, null, 2)}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
              >
                <X size={18} />
                Deny
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Authorize
              </button>
            </div>

            <p className="text-[10px] text-center text-zinc-400">
              By clicking Authorize, you will generate a signed Verifiable Presentation using your DID.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
