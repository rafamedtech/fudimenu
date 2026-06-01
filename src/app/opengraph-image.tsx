import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'FudiMenu — Tu menú online en segundos';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FFFCF5',
          color: '#1F2937',
          padding: '72px 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            fontSize: 42,
            fontWeight: 800,
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 24,
              background: '#F4B400',
              color: '#FFFFFF',
              fontSize: 42,
            }}
          >
            FM
          </div>
          FudiMenu
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ maxWidth: 940, fontSize: 76, fontWeight: 900, lineHeight: 1.05 }}>
            Tu menú online en segundos.
          </div>
          <div style={{ maxWidth: 900, color: '#6B7280', fontSize: 34, lineHeight: 1.25 }}>
            Comparte un menú digital rápido, editable y accesible desde un solo QR.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
