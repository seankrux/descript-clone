import { useEffect, useCallback } from 'react';

/**
 * Hook to enforce modern web guidance modal behaviors:
 * 1. Handles Escape key to trigger standard platform close requests.
 * 2. Implements declarative light-dismiss fallback by closing when clicking outside the dialog content box.
 */
export function useModalDismiss(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return { handleBackdropClick };
}
