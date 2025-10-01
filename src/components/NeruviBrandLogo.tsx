import React from 'react';
import Image from 'next/image';

interface NeruviBrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showIcon?: boolean;
  showTagline?: boolean;
  variant?: 'default' | 'light' | 'dark' | 'gradient';
}

const NeruviBrandLogo: React.FC<NeruviBrandLogoProps> = ({
  size = 'md',
  className = '',
  showIcon = true,
  showTagline = false,
  variant = 'default',
}) => {
  const sizeConfig = {
    sm: {
      text: 'text-2xl',
      icon: 32,
      tagline: 'text-[10px]',
      iconContainer: 'h-8 w-8',
    },
    md: {
      text: 'text-4xl',
      icon: 40,
      tagline: 'text-xs',
      iconContainer: 'h-10 w-10',
    },
    lg: {
      text: 'text-6xl',
      icon: 56,
      tagline: 'text-base',
      iconContainer: 'h-14 w-14',
    },
    xl: {
      text: 'text-7xl md:text-8xl',
      icon: 72,
      tagline: 'text-lg',
      iconContainer: 'h-[72px] w-[72px]',
    },
  };

  const config = sizeConfig[size];

  const getTextStyle = () => {
    switch (variant) {
      case 'light':
        return 'text-white';
      case 'dark':
        return 'text-slate-900';
      case 'gradient':
        return 'bg-gradient-to-r from-[#459071] via-[#4ea674] to-[#5fad81] bg-clip-text text-transparent';
      default:
        return 'text-[#459071]';
    }
  };

  const getTaglineStyle = () => {
    switch (variant) {
      case 'light':
        return 'text-white/80';
      case 'dark':
        return 'text-slate-600';
      case 'gradient':
        return 'text-[#4ea674]';
      default:
        return 'text-[#5fad81]';
    }
  };

  return (
    <div
      className={`inline-flex flex-col items-center justify-center ${className}`}>
      <div
        className='flex items-center justify-center'
        style={{ gap: '0.18rem' }}>
        {showIcon && (
          <div
            className={`flex items-center justify-center ${config.iconContainer}`}>
            <svg
              width={config.icon}
              height={config.icon}
              viewBox='0 0 48 48'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <defs>
                <linearGradient
                  id='bgGradient'
                  x1='0%'
                  y1='0%'
                  x2='100%'
                  y2='100%'>
                  <stop
                    offset='0%'
                    stopColor='#f0fdf4'
                  />
                  <stop
                    offset='100%'
                    stopColor='#dcfce7'
                  />
                </linearGradient>
                <linearGradient
                  id='nGradient'
                  x1='0%'
                  y1='0%'
                  x2='100%'
                  y2='100%'>
                  <stop
                    offset='0%'
                    stopColor='#10b981'
                  />
                  <stop
                    offset='100%'
                    stopColor='#059669'
                  />
                </linearGradient>
                <filter
                  id='innerGlow'
                  x='-50%'
                  y='-50%'
                  width='200%'
                  height='200%'>
                  <feGaussianBlur
                    in='SourceAlpha'
                    stdDeviation='1'
                  />
                  <feOffset
                    dx='0'
                    dy='0.5'
                    result='offsetblur'
                  />
                  <feComponentTransfer>
                    <feFuncA
                      type='linear'
                      slope='0.1'
                    />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in='SourceGraphic' />
                  </feMerge>
                </filter>
              </defs>
              <rect
                x='8'
                y='8'
                width='32'
                height='32'
                rx='8'
                fill={
                  variant === 'light'
                    ? 'white'
                    : variant === 'dark'
                    ? 'white'
                    : 'url(#bgGradient)'
                }
                filter='url(#innerGlow)'
              />
              <g transform="translate(11, 11)">
                {/* Single unified N shape with soft rounded design */}
                <path
                  d="M 3 0
                     C 1.343 0 0 1.343 0 3
                     L 0 23
                     C 0 24.657 1.343 26 3 26
                     C 4.657 26 6 24.657 6 23
                     L 6 9.5
                     L 20 23.5
                     C 20.5 24 21 24.5 21.5 24.75
                     C 22 25 22.5 25 23 25
                     C 24.657 25 26 23.657 26 22
                     L 26 3
                     C 26 1.343 24.657 0 23 0
                     C 21.343 0 20 1.343 20 3
                     L 20 16.5
                     L 6 2.5
                     C 5.5 2 5 1.5 4.5 1.25
                     C 4 1 3.5 0 3 0 Z"
                  fill="#10b981"
                />
              </g>
            </svg>
          </div>
        )}
        <span
          className={`${
            config.text
          } font-comfortaa leading-none ${getTextStyle()} text-center`}
          style={{
            fontWeight: 300,
            fontVariantNumeric: 'proportional-nums',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            lineHeight: 1,
            display: 'inline-block',
            marginTop: '-0.2em', // nudges the text upward
          }}>
          <span style={{ fontWeight: 300 }}>ne</span>
          <span
            style={{
              fontWeight: 700,
              color:
                variant === 'gradient'
                  ? undefined
                  : variant === 'light'
                  ? 'rgba(255,255,255,0.95)'
                  : '#059669',
              position: 'relative',
              display: 'inline-block',
            }}>
            ru
            <span
              style={{
                position: 'absolute',
                bottom: '-2px',
                left: '0',
                right: '0',
                height: '2px',
                background:
                  variant === 'light'
                    ? 'rgba(255,255,255,0.3)'
                    : 'rgba(16,185,129,0.3)',
                borderRadius: '1px',
              }}
            />
          </span>
          <span style={{ fontWeight: 300 }}>vi</span>
        </span>
      </div>
      {showTagline && (
        <p
          className={`${
            config.tagline
          } ${getTaglineStyle()} font-medium uppercase mt-2 text-center`}
          style={{
            letterSpacing: '0.2em',
            fontWeight: 500,
            opacity: 0.85,
            textRendering: 'optimizeLegibility',
          }}>
          AI Learning Navigator
        </p>
      )}
    </div>
  );
};

export default NeruviBrandLogo;
