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
              {/* Modern white rounded square with shadow */}
              <defs>
                <filter id="logoShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                  <feOffset dx="0" dy="2" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.2"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <rect
                x="4"
                y="4"
                width="40"
                height="40"
                rx="11"
                fill={variant === 'light' ? 'white' : variant === 'dark' ? 'white' : 'white'}
                filter="url(#logoShadow)"
              />

              {/* Bold "N" lettermark - modern and clean */}
              <path
                d="M 16 30 L 16 18 L 25 27 L 25 18"
                stroke={variant === 'light' ? '#10b981' : variant === 'dark' ? '#10b981' : '#10b981'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Enhanced accent dot with glow */}
              <circle
                cx="30"
                cy="19"
                r="2.5"
                fill={variant === 'light' ? '#10b981' : variant === 'dark' ? '#10b981' : '#10b981'}
              />
              <circle
                cx="30"
                cy="19"
                r="4"
                fill={variant === 'light' ? '#10b981' : variant === 'dark' ? '#10b981' : '#10b981'}
                opacity="0.2"
              />
            </svg>
          </div>
        )}

        {/* Premium Typography */}
        <div className="flex flex-col">
          <h1
            className={`${config.text} font-light font-comfortaa leading-none ${getTextStyle()}`}
            style={{
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'proportional-nums'
            }}
          >
            <span className="font-light">ne</span>
            <span className="font-semibold" style={{ color: variant === 'gradient' ? undefined : variant === 'light' ? 'rgba(255,255,255,0.9)' : '#4ea674' }}>ru</span>
            <span className="font-light">vi</span>
          </h1>

          {/* Tagline - positioned directly under logo */}
          {showTagline && (
            <p
              className={`${config.tagline} ${getTaglineStyle()} font-medium tracking-wider uppercase mt-1`}
              style={{
                letterSpacing: '0.15em',
                fontWeight: 600
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