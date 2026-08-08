'use client';

import { useEffect } from 'react';
import { useExamStore } from '../store/exam-store';

export function useProctorMedia(options: {
  enabled: boolean;
  requireWebcam?: boolean;
  requireMicrophone?: boolean;
  onViolation?: (type: 'camera_blocked' | 'microphone_blocked') => void;
}) {
  const setMediaPermissions = useExamStore((s) => s.setMediaPermissions);

  useEffect(() => {
    if (!options.enabled) return;

    let stream: MediaStream | null = null;
    let cancelled = false;

    async function requestMedia() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (options.requireWebcam) options.onViolation?.('camera_blocked');
        if (options.requireMicrophone) options.onViolation?.('microphone_blocked');
        setMediaPermissions(false, false);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: options.requireWebcam ?? false,
          audio: options.requireMicrophone ?? false,
        });
        if (cancelled) return;
        setMediaPermissions(
          stream.getVideoTracks().some((t) => t.enabled),
          stream.getAudioTracks().some((t) => t.enabled),
        );
      } catch {
        if (options.requireWebcam) options.onViolation?.('camera_blocked');
        if (options.requireMicrophone) options.onViolation?.('microphone_blocked');
        setMediaPermissions(false, false);
      }
    }

    void requestMedia();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [
    options.enabled,
    options.requireWebcam,
    options.requireMicrophone,
    options.onViolation,
    setMediaPermissions,
  ]);
}
