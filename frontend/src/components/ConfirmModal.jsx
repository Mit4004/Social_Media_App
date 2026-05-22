import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'
import Button from './Button'

/**
 * A beautiful, premium, and reusable confirmation modal component.
 * Features background blur, entry animations, accessibility close options,
 * and support for destructive warning states.
 */
export const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onCancel}
            className="absolute inset-0 bg-base/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative bg-card border border-border w-full max-w-[400px] rounded-[24px] shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="h-[58px] px-6 border-b border-border flex items-center justify-between bg-card">
              <div className="flex items-center gap-2">
                {isDestructive && (
                  <div className="w-6 h-6 rounded-full bg-danger/10 flex items-center justify-center text-danger animate-pulse">
                    <AlertTriangle size={14} />
                  </div>
                )}
                <span className="font-bold text-primary text-sm">{title}</span>
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-base transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 bg-card">
              <p className="text-xs text-secondary leading-relaxed font-medium">
                {message}
              </p>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-base/40 border-t border-border flex justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
                className="rounded-[12px] border-border text-secondary hover:text-primary"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                variant={isDestructive ? 'danger' : 'primary'}
                size="sm"
                onClick={onConfirm}
                isLoading={isLoading}
                className="rounded-[12px]"
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmModal
