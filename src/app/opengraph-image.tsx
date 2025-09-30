import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Neruvi - AI Learning Navigator'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '100px',
            left: '150px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: '#10b981',
            opacity: 0.05,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '100px',
            right: '150px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: '#059669',
            opacity: 0.05,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '150px',
            right: '250px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: '#10b981',
            opacity: 0.08,
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '40px',
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '30px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '2px solid rgba(16,185,129,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '80px',
              fontWeight: 'bold',
              color: '#10b981',
            }}
          >
            N
          </div>

          {/* Brand name */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                fontSize: '120px',
                fontWeight: '300',
                color: '#459071',
                lineHeight: 1,
                display: 'flex',
              }}
            >
              <span style={{ fontWeight: '300' }}>ne</span>
              <span style={{ fontWeight: '700', color: '#059669' }}>ru</span>
              <span style={{ fontWeight: '300' }}>vi</span>
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: '500',
                color: '#5fad81',
                letterSpacing: '3px',
                marginTop: '20px',
              }}
            >
              AI LEARNING NAVIGATOR
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            fontSize: '18px',
            color: '#6b7280',
          }}
        >
          Master Node.js and Python with intelligent guidance
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
