// components/ui/NeruviBrandLogo.tsx
// Premium brand logo with exceptional typography and design

interface NeruviBrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showIcon?: boolean;
  showTagline?: boolean;
  variant?: 'default' | 'light' | 'dark' | 'gradient';
}

const NeruviBrandLogo = ({
  size = 'md',
  className = '',
  showIcon = true,
  showTagline = false,
  variant = 'default'
}: NeruviBrandLogoProps) => {

  const sizeConfig = {
    sm: {
      text: 'text-2xl',
      icon: 32,
      tagline: 'text-[10px]',
      gap: 'space-x-2'
    },
    md: {
      text: 'text-4xl',
      icon: 40,
      tagline: 'text-xs',
      gap: 'space-x-2.5'
    },
    lg: {
      text: 'text-6xl',
      icon: 56,
      tagline: 'text-base',
      gap: 'space-x-3'
    },
    xl: {
      text: 'text-7xl md:text-8xl',
      icon: 72,
      tagline: 'text-lg',
      gap: 'space-x-4'
    }
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
    <div className={`inline-flex flex-col ${className}`}>
      <div className={`flex items-center ${config.gap}`} style={{ alignItems: 'center' }}>
        {/* Minimalist Arattai-style Icon */}
        {showIcon && (
          <div className="relative flex-shrink-0">
            <svg
              width={config.icon}
              height={config.icon}
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Definitions */}
              <defs>
                {/* Elegant gradient for depth */}
                <linearGradient id="nGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="1" />
                </linearGradient>

                {/* Subtle inner shadow for depth */}
                <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
                  <feOffset dx="0" dy="0.5" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.1"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Premium white circular background with subtle border */}
              <circle
                cx="24"
                cy="24"
                r="22"
                fill="white"
                filter="url(#innerGlow)"
              />

              {/* Subtle border for visibility on white backgrounds */}
              <circle
                cx="24"
                cy="24"
                r="21.5"
                fill="none"
                stroke={variant === 'light' ? 'rgba(255,255,255,0.3)' : variant === 'dark' ? 'rgba(0,0,0,0.06)' : 'rgba(16,185,129,0.08)'}
                strokeWidth="0.5"
              />

              {/* Geometric precision "N" with perfect alignment */}
              <g>
                {/* Left vertical pillar - perfectly aligned */}
                <rect
                  x="15"
                  y="16"
                  width="2.5"
                  height="16"
                  rx="1.25"
                  fill="url(#nGradient)"
                />

                {/* Futuristic diagonal connector - mathematically precise */}
                <path
                  d="M 16.25 16 L 30.75 32 L 28.5 32 L 15.5 17.5 Z"
                  fill="url(#nGradient)"
                  opacity="0.95"
                />

                {/* Right vertical pillar - mirror aligned */}
                <rect
                  x="30.5"
                  y="16"
                  width="2.5"
                  height="16"
                  rx="1.25"
                  fill="url(#nGradient)"
                />

                {/* Subtle accent lines for tech/futuristic feel */}
                <line
                  x1="16.25"
                  y1="16"
                  x2="16.25"
                  y2="14"
                  stroke="url(#nGradient)"
                  strokeWidth="0.5"
                  strokeLinecap="round"
                  opacity="0.4"
                />
                <line
                  x1="31.75"
                  y1="16"
                  x2="31.75"
                  y2="14"
                  stroke="url(#nGradient)"
                  strokeWidth="0.5"
                  strokeLinecap="round"
                  opacity="0.4"
                />
              </g>
            </svg>
          </div>
        )}

        {/* Premium Typography with Design Principles */}
        <div className="flex flex-col">
          <h1
            className={`${config.text} font-comfortaa leading-none ${getTextStyle()}`}
            style={{
              letterSpacing: '-0.04em',
              fontWeight: 300,
              fontVariantNumeric: 'proportional-nums',
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale'
            }}
          >
            <span style={{ fontWeight: 300 }}>ne</span>
            <span
              style={{
                fontWeight: 700,
                color: variant === 'gradient' ? undefined : variant === 'light' ? 'rgba(255,255,255,0.95)' : '#059669',
                position: 'relative',
                display: 'inline-block'
              }}
            >
              ru
              {/* Subtle underline accent */}
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: '0',
                  right: '0',
                  height: '2px',
                  background: variant === 'light' ? 'rgba(255,255,255,0.3)' : 'rgba(16,185,129,0.3)',
                  borderRadius: '1px'
                }}
              />
            </span>
            <span style={{ fontWeight: 300 }}>vi</span>
          </h1>

          {/* Refined Tagline */}
          {showTagline && (
            <p
              className={`${config.tagline} ${getTaglineStyle()} font-medium uppercase mt-2`}
              style={{
                letterSpacing: '0.2em',
                fontWeight: 500,
                opacity: 0.85,
                textRendering: 'optimizeLegibility'
              }}
            >
              AI Learning Navigator
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NeruviBrandLogo;