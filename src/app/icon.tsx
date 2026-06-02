import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 192,
  height: 192,
};
export const contentType = 'image/png';

const iconStyle = {
  fontSize: 84,
  background: '#F4B400',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  borderRadius: '20%',
} as const;

export default function Icon() {
  return new ImageResponse(
    (
      <div style={iconStyle}>
        FM
      </div>
    ),
    { ...size }
  );
}
