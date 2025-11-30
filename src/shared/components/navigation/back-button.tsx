'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/i18n/i18n-context';
import { cn } from '@/core/utils';

interface BackButtonProps {
  className?: string;
  fallbackUrl?: string;
  showLabel?: boolean;
}

/**
 * Professional Back Button Component
 * - Works like browser back button
 * - Consistent across all pages
 * - RTL/LTR support
 * - Optional fallback URL if no history
 */
export function BackButton({ className, fallbackUrl = '/dashboard', showLabel = true }: BackButtonProps) {
  const router = useRouter();
  const { t, dir } = useI18n();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to specified URL or dashboard
      router.push(fallbackUrl);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn(
        'gap-2 text-muted-foreground hover:text-foreground transition-colors',
        dir === 'rtl' && 'flex-row-reverse',
        className
      )}
    >
      <ArrowLeft 
        className={cn(
          'h-4 w-4',
          dir === 'rtl' && 'rotate-180'
        )} 
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {t('common.back')}
        </span>
      )}
    </Button>
  );
}
