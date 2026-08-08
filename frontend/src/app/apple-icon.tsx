import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#4F46E5',
          borderRadius: 36,
          color: '#FFFFFF',
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: '-0.06em',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        MS
      </div>
    ),
    { ...size },
  );
}
