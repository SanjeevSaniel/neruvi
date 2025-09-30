import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = {
  width: 512,
  height: 512,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          borderRadius: '128px',
        }}
      >
        <div
          style={{
            fontSize: '320px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          N
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
