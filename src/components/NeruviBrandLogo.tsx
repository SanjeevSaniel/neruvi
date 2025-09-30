import React from 'react';

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
              <rect
                x='8.25'
                y='8.25'
                width='31.5'
                height='31.5'
                rx='7.75'
                fill='none'
                stroke={
                  variant === 'light'
                    ? 'rgba(255,255,255,0.3)'
                    : variant === 'dark'
                    ? 'rgba(0,0,0,0.08)'
                    : 'rgba(16,185,129,0.15)'
                }
                strokeWidth='0.5'
              />
              <g>
                <rect
                  x='14.5'
                  y='15'
                  width='3.5'
                  height='18'
                  rx='1.75'
                  fill='url(#nGradient)'
                />
                <path
                  d='M 16.25 15 L 31.75 33 L 28.75 33 L 14.75 17 Z'
                  fill='url(#nGradient)'
                />
                <rect
                  x='30'
                  y='15'
                  width='3.5'
                  height='18'
                  rx='1.75'
                  fill='url(#nGradient)'
                />
                <line
                  x1='16.25'
                  y1='15'
                  x2='16.25'
                  y2='13'
                  stroke='url(#nGradient)'
                  strokeWidth='0.8'
                  strokeLinecap='round'
                  opacity='0.5'
                />
                <line
                  x1='31.75'
                  y1='15'
                  x2='31.75'
                  y2='13'
                  stroke='url(#nGradient)'
                  strokeWidth='0.8'
                  strokeLinecap='round'
                  opacity='0.5'
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
