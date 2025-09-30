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
      gap: 'space-x-2.5'
    },
    md: {
      text: 'text-4xl',
      icon: 40,
      tagline: 'text-xs',
      gap: 'space-x-3'
    },
    lg: {
      text: 'text-6xl',
      icon: 56,
      tagline: 'text-base',
      gap: 'space-x-4'
    },
    xl: {
      text: 'text-7xl md:text-8xl',
      icon: 72,
      tagline: 'text-lg',
      gap: 'space-x-5'
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
      <div className={`flex items-center ${config.gap}`}>
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
              {/* Soft shadow definition */}
              <defs>
                <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
                  <feOffset dx="0" dy="1" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.15"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                {/* Gradient for modern depth */}
                <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={variant === 'light' ? '#10b981' : '#10b981'} />
                  <stop offset="100%" stopColor={variant === 'light' ? '#059669' : '#059669'} />
                </linearGradient>
              </defs>

              {/* Premium white container with subtle shadow */}
              <rect
                x="2"
                y="2"
                width="44"
                height="44"
                rx="12"
                fill={variant === 'light' ? 'white' : variant === 'dark' ? 'white' : 'white'}
                filter="url(#softShadow)"
              />

              {/* Geometric "N" with modern proportions */}
              <g transform="translate(14, 15)">
                {/* Left vertical stroke */}
                <rect
                  x="0"
                  y="0"
                  width="3"
                  height="18"
                  rx="1.5"
                  fill="url(#iconGradient)"
                />

                {/* Diagonal stroke - perfectly aligned */}
                <path
                  d="M 1.5 0 L 18 18 L 15 18 L 1.5 3.5 Z"
                  fill="url(#iconGradient)"
                />

                {/* Right vertical stroke */}
                <rect
                  x="15"
                  y="0"
                  width="3"
                  height="18"
                  rx="1.5"
                  fill="url(#iconGradient)"
                />
              </g>

              {/* Refined accent dot - positioned with golden ratio */}
              <circle
                cx="36"
                cy="16"
                r="2"
                fill="url(#iconGradient)"
              />

              {/* Subtle glow for depth */}
              <circle
                cx="36"
                cy="16"
                r="3.5"
                fill="url(#iconGradient)"
                opacity="0.15"
              />
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