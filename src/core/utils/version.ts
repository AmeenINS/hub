/**
 * Application Version Configuration
 * Centralized version management for the application
 */

export const APP_VERSION = {
  major: 0,
  minor: 1,
  patch: 1,
  build: Date.now(), // Build timestamp
} as const;

/**
 * Get formatted version string
 */
export function getVersionString(): string {
  return `${APP_VERSION.major}.${APP_VERSION.minor}.${APP_VERSION.patch}`;
}

/**
 * Get full version string with build info
 */
export function getFullVersionString(): string {
  const buildDate = new Date(APP_VERSION.build).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  return `v${getVersionString()} (${buildDate})`;
}

/**
 * Get build info
 */
export function getBuildInfo() {
  return {
    version: getVersionString(),
    fullVersion: getFullVersionString(),
    buildDate: new Date(APP_VERSION.build),
    buildTimestamp: APP_VERSION.build,
    environment: process.env.NODE_ENV || 'development',
  };
}

/**
 * Environment information
 */
export const BUILD_INFO = {
  version: getVersionString(),
  fullVersion: getFullVersionString(),
  environment: process.env.NODE_ENV || 'development',
  timestamp: APP_VERSION.build,
} as const;