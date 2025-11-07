/**
 * Confirm Dialog Component
 * A beautiful, reusable confirmation dialog for delete and other critical actions
 * Uses shadcn/ui AlertDialog with custom styling
 */

'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { cn } from '@/core/utils';

export type ConfirmDialogVariant = 'danger' | 'destructive' | 'error' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
}

const baseVariantConfig = {
  danger: {
    icon: Trash2,
    iconColor: 'text-red-500',
    iconBgColor: 'bg-red-50 dark:bg-red-950/20',
    buttonClass: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    iconBgColor: 'bg-amber-50 dark:bg-amber-950/20',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    iconBgColor: 'bg-blue-50 dark:bg-blue-950/20',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
  },
} as const;

const variantAliasMap: Record<ConfirmDialogVariant, keyof typeof baseVariantConfig> = {
  danger: 'danger',
  destructive: 'danger',
  error: 'danger',
  warning: 'warning',
  info: 'info',
};

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Continue',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const config = baseVariantConfig[variantAliasMap[variant]];
  const Icon = config.icon;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Confirm action failed:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                config.iconBgColor
              )}
            >
              <Icon className={cn('h-6 w-6', config.iconColor)} />
            </div>

            {/* Title and Description */}
            <div className="flex-1 space-y-2">
              <AlertDialogTitle className="text-lg font-semibold">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <AlertDialogCancel
            disabled={isLoading}
            className="mt-0"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isLoading}
            className={cn(
              'text-white',
              config.buttonClass
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </span>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for using the Confirm Dialog
 * Provides a simple way to show confirmation dialogs
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback((): Promise<boolean> => {
    setIsOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = React.useCallback(() => {
    setIsLoading(false);
    setIsOpen(false);
    resolveRef.current?.(true);
  }, []);

  const handleCancel = React.useCallback(() => {
    setIsLoading(false);
    setIsOpen(false);
    resolveRef.current?.(false);
  }, []);

  return {
    isOpen,
    isLoading,
    setIsLoading,
    confirm,
    handleConfirm,
    handleCancel,
    setIsOpen,
  };
}
