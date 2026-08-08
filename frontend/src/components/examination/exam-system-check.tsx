'use client';

import { Button, Card, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface ExamSystemCheckResult {
  network: boolean;
  fullscreen: boolean;
  camera: boolean;
  microphone: boolean;
}

interface ExamSystemCheckProps {
  requireWebcam?: boolean;
  requireMicrophone?: boolean;
  requireFullscreen?: boolean;
  onReadyChange: (ready: boolean, results: ExamSystemCheckResult) => void;
}

export function ExamSystemCheck({
  requireWebcam = false,
  requireMicrophone = false,
  requireFullscreen = false,
  onReadyChange,
}: ExamSystemCheckProps) {
  const t = useTranslations('dashboard.student.examSystemCheck');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [results, setResults] = useState<ExamSystemCheckResult>({
    network: typeof navigator !== 'undefined' ? navigator.onLine : false,
    fullscreen: false,
    camera: !requireWebcam,
    microphone: !requireMicrophone,
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateResults = useCallback(
    (patch: Partial<ExamSystemCheckResult>) => {
      setResults((prev) => {
        const next = { ...prev, ...patch };
        const ready =
          next.network &&
          (!requireFullscreen || next.fullscreen) &&
          (!requireWebcam || next.camera) &&
          (!requireMicrophone || next.microphone);
        onReadyChange(ready, next);
        return next;
      });
    },
    [onReadyChange, requireFullscreen, requireMicrophone, requireWebcam],
  );

  useEffect(() => {
    const onOnline = () => updateResults({ network: true });
    const onOffline = () => updateResults({ network: false });
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [updateResults]);

  useEffect(() => {
    const onFullscreen = () => {
      updateResults({ fullscreen: Boolean(document.fullscreenElement) });
    };
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreen);
    };
  }, [updateResults]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, [stream]);

  const runMediaTest = async () => {
    setError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: requireWebcam,
        audio: requireMicrophone,
      });
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play().catch(() => undefined);
      }
      updateResults({
        camera: !requireWebcam || media.getVideoTracks().some((t) => t.readyState === 'live'),
        microphone: !requireMicrophone || media.getAudioTracks().some((t) => t.readyState === 'live'),
      });
    } catch {
      setError(t('mediaError'));
      updateResults({ camera: false, microphone: false });
    }
  };

  const runFullscreenTest = async () => {
    try {
      await document.documentElement.requestFullscreen();
      updateResults({ fullscreen: true });
    } catch {
      setError(t('fullscreenError'));
      updateResults({ fullscreen: false });
    }
  };

  const checks = [
    { key: 'network', label: t('network'), ok: results.network },
    { key: 'fullscreen', label: t('fullscreen'), ok: results.fullscreen, skip: !requireFullscreen },
    { key: 'camera', label: t('camera'), ok: results.camera, skip: !requireWebcam },
    { key: 'microphone', label: t('microphone'), ok: results.microphone, skip: !requireMicrophone },
  ].filter((c) => !c.skip);

  return (
    <Card className="rounded-2xl border-border/80">
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <div className="space-y-4 p-4 pt-0">
        <ul className="space-y-2">
          {checks.map((check) => (
            <li
              key={check.key}
              className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
            >
              <span>{check.label}</span>
              <span className={check.ok ? 'text-emerald-600' : 'text-muted-foreground'}>
                {check.ok ? t('pass') : t('pending')}
              </span>
            </li>
          ))}
        </ul>

        {(requireWebcam || requireMicrophone) && (
          <div className="space-y-2">
            <video
              ref={videoRef}
              className="aspect-video w-full max-w-sm rounded-lg bg-muted object-cover"
              muted
              playsInline
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void runMediaTest();
              }}
            >
              {t('testMedia')}
            </Button>
          </div>
        )}

        {requireFullscreen && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void runFullscreenTest();
            }}
          >
            {t('testFullscreen')}
          </Button>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </Card>
  );
}
