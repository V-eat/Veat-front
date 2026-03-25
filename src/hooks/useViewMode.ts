import { useState, useCallback } from 'react';

export type ViewMode = 'pro' | 'client';

const STORAGE_KEY = 'veat_view_mode';

export function useViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ViewMode) ?? 'pro';
  });

  const setViewMode = useCallback((mode: ViewMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setViewModeState(mode);
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'pro' ? 'client' : 'pro');
  }, [viewMode, setViewMode]);

  const resetToProMode = useCallback(() => {
    setViewMode('pro');
  }, [setViewMode]);

  return { viewMode, toggleViewMode, resetToProMode };
}
