/**
 * Custom hook for managing view preferences with localStorage persistence
 * This hook saves and restores user's preferred view (table/kanban/list) across page refreshes
 */

import { useState, useEffect } from 'react';

type ViewType = 'table' | 'kanban' | 'list' | 'grid' | 'card';

interface UseViewPreferenceOptions {
  key: string; // localStorage key (e.g., 'leads-view', 'deals-view')
  defaultView: ViewType;
}

/**
 * Hook to persist view preference in localStorage
 * 
 * @example
 * ```tsx
 * const [view, setView] = useViewPreference({
 *   key: 'leads-view',
 *   defaultView: 'table'
 * });
 * ```
 */
export function useViewPreference({ key, defaultView }: UseViewPreferenceOptions) {
  const [view, setView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      return (saved as ViewType) || defaultView;
    }
    return defaultView;
  });

  useEffect(() => {
    localStorage.setItem(key, view);
  }, [key, view]);

  return [view, setView] as const;
}
