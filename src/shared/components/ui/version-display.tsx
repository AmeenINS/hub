'use client';

import { getVersionString, getFullVersionString, getBuildInfo } from '@/core/utils/version';

interface VersionDisplayProps {
  variant?: 'simple' | 'full' | 'detailed';
  className?: string;
  showBuildDate?: boolean;
}

export function VersionDisplay({ 
  variant = 'simple', 
  className = '',
  showBuildDate = false 
}: VersionDisplayProps) {
  const buildInfo = getBuildInfo();

  switch (variant) {
    case 'simple':
      return (
        <span className={`font-mono text-xs ${className}`}>
          v{getVersionString()}
        </span>
      );
    
    case 'full':
      return (
        <span className={`font-mono text-xs ${className}`}>
          {getFullVersionString()}
        </span>
      );
    
    case 'detailed':
      return (
        <div className={`font-mono text-xs space-y-1 ${className}`}>
          <div>Version: {getVersionString()}</div>
          {showBuildDate && (
            <div>Build: {buildInfo.buildDate.toLocaleDateString()}</div>
          )}
          <div>Environment: {buildInfo.environment}</div>
        </div>
      );
    
    default:
      return (
        <span className={`font-mono text-xs ${className}`}>
          v{getVersionString()}
        </span>
      );
  }
}

/**
 * Version Badge Component for header/footer usage
 */
export function VersionBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-md bg-muted/50 ${className}`}>
      <VersionDisplay variant="simple" className="text-muted-foreground" />
    </div>
  );
}

/**
 * About Dialog Version Info
 */
export function VersionInfo({ className = '' }: { className?: string }) {
  const buildInfo = getBuildInfo();
  
  return (
    <div className={`space-y-2 text-sm ${className}`}>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Version:</span>
        <span className="font-mono">{buildInfo.version}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Build Date:</span>
        <span className="font-mono">{buildInfo.buildDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Environment:</span>
        <span className="font-mono capitalize">{buildInfo.environment}</span>
      </div>
    </div>
  );
}