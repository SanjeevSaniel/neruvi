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
      text: 'text-xl',
      icon: 24,
      tagline: 'text-[9px]',
      gap: 'space-x-2'
    },
    md: {
      text: 'text-3xl',
      icon: 32,
      tagline: 'text-[11px]',
      gap: 'space-x-2.5'
    },
    lg: {
      text: 'text-5xl',
      icon: 48,
      tagline: 'text-sm',
      gap: 'space-x-3'
    },
    xl: {
      text: 'text-6xl md:text-7xl',
      icon: 64,
      tagline: 'text-base',
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
      <div className={`flex items-center ${config.gap}`}>
        {/* Modern Redesigned Icon */}
        {showIcon && (
          <div className="relative flex-shrink-0">
            <svg
              width={config.icon}
              height={config.icon}
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Clean circular background - Arattai style */}
              <circle
                cx="24"
                cy="24"
                r="22"
                fill={variant === 'light' ? 'rgba(255,255,255,0.12)' : variant === 'dark' ? 'rgba(0,0,0,0.05)' : 'url(#bgGradient)'}
                stroke={variant === 'light' ? 'rgba(255,255,255,0.25)' : variant === 'dark' ? 'rgba(0,0,0,0.1)' : 'url(#strokeGradient)'}
                strokeWidth="1.5"
              />

              {/* Simplified path icon - navigation/journey symbol */}
              <path
                d="M 15 24 L 22 17 L 29 24 L 36 20"
                stroke={variant === 'light' ? 'white' : variant === 'dark' ? '#374151' : '#459071'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Accent line for depth */}
              <path
                d="M 15 28 L 36 24"
                stroke={variant === 'light' ? 'rgba(255,255,255,0.4)' : variant === 'dark' ? 'rgba(55,65,81,0.3)' : '#5fad81'}
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.6"
              />

              {/* Clean navigation dots */}
              <circle
                cx="15"
                cy="24"
                r="2.5"
                fill={variant === 'light' ? 'white' : variant === 'dark' ? '#374151' : '#459071'}
              />
              <circle
                cx="22"
                cy="17"
                r="2"
                fill={variant === 'light' ? 'rgba(255,255,255,0.85)' : variant === 'dark' ? 'rgba(55,65,81,0.8)' : '#4ea674'}
              />
              <circle
                cx="29"
                cy="24"
                r="2"
                fill={variant === 'light' ? 'rgba(255,255,255,0.85)' : variant === 'dark' ? 'rgba(55,65,81,0.8)' : '#5fad81'}
              />
              <circle
                cx="36"
                cy="20"
                r="2.5"
                fill={variant === 'light' ? 'white' : variant === 'dark' ? '#374151' : '#68b889'}
              />

              {/* Gradients */}
              <defs>
                <linearGradient id="bgGradient" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stopColor="#f0f9f4" />
                  <stop offset="100%" stopColor="#dcfce7" />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stopColor="#459071" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#5fad81" stopOpacity="0.15" />
                </linearGradient>
              </defs>
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