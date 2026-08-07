'use client';

import { useCallback, useEffect } from 'react';
import { useExamStore } from '../store/exam-store';

export interface SecureExamPolicy {
  blockCopyPaste?: boolean;
  blockRightClick?: boolean;
  requireFullscreen?: boolean;
}

export function useSecureExamMode(
  enabled: boolean,
  policy: SecureExamPolicy,
  onViolation?: (type: string) => void,
) {
  const setSecureModeEnabled = useExamStore((s) => s.setSecureModeEnabled);

  const report = useCallback(
    (type: string) => {
      useExamStore.getState().addWarning(type);
      onViolation?.(type);
    },
    [onViolation],
  );

  useEffect(() => {
    if (!enabled) {
      setSecureModeEnabled(false);
      return;
    }

    setSecureModeEnabled(true);

    const blockCopy = (event: ClipboardEvent) => {
      if (policy.blockCopyPaste !== false) {
        event.preventDefault();
        report('clipboard_attempt');
      }
    };

    const blockContext = (event: MouseEvent) => {
      if (policy.blockRightClick !== false) {
        event.preventDefault();
        report('shortcut_attempt');
      }
    };

    const onVisibility = () => {
      if (document.hidden) report('tab_switch');
    };

    const onBlur = () => report('tab_switch');

    const onFullscreenChange = () => {
      if (policy.requireFullscreen && !document.fullscreenElement) {
        report('fullscreen_exit');
      }
    };

    document.addEventListener('copy', blockCopy);
    document.addEventListener('cut', blockCopy);
    document.addEventListener('paste', blockCopy);
    document.addEventListener('contextmenu', blockContext);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    if (policy.requireFullscreen && document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen().catch(() => {
        report('fullscreen_exit');
      });
    }

    return () => {
      document.removeEventListener('copy', blockCopy);
      document.removeEventListener('cut', blockCopy);
      document.removeEventListener('paste', blockCopy);
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      setSecureModeEnabled(false);
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => undefined);
      }
    };
  }, [enabled, policy, report, setSecureModeEnabled]);
}
