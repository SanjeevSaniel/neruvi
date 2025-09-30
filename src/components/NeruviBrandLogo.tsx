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
              {/* Modern rounded square background */}
              <rect
                x="2"
                y="2"
                width="44"
                height="44"
                rx="12"
                fill={variant === 'light' ? 'rgba(255,255,255,0.15)' : variant === 'dark' ? 'rgba(0,0,0,0.04)' : 'url(#modernBg)'}
                stroke={variant === 'light' ? 'rgba(255,255,255,0.3)' : variant === 'dark' ? 'rgba(0,0,0,0.08)' : 'url(#modernStroke)'}
                strokeWidth="1.5"
              />

              {/* Main flowing path - represents learning journey */}
              <path
                d="M12 18 Q16 14, 20 16 Q24 18, 28 22 Q32 26, 36 24"
                stroke={variant === 'light' ? 'white' : variant === 'dark' ? '#374151' : 'url(#pathGradient)'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Secondary subtle path for depth */}
              <path
                d="M12 22 Q16 20, 20 22 Q24 24, 28 28 Q32 32, 36 30"
                stroke={variant === 'light' ? 'rgba(255,255,255,0.4)' : variant === 'dark' ? 'rgba(55,65,81,0.4)' : 'url(#pathGradient2)'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Start point - larger emphasis */}
              <circle
                cx="12"
                cy="18"
                r="3"
                fill={variant === 'light' ? 'white' : variant === 'dark' ? '#374151' : '#459071'}
              />
              <circle
                cx="12"
                cy="18"
                r="1.5"
                fill={variant === 'light' ? 'rgba(255,255,255,0.5)' : variant === 'dark' ? 'rgba(55,65,81,0.3)' : '#f0f9f4'}
              />

              {/* Mid-point navigation marker */}
              <circle
                cx="24"
                cy="20"
                r="2.5"
                fill={variant === 'light' ? 'white' : variant === 'dark' ? '#374151' : '#4ea674'}
                opacity="0.9"
              />

              {/* End point - destination */}
              <circle
                cx="36"
                cy="24"
                r="3"
                fill={variant === 'light' ? 'white' : variant === 'dark' ? '#374151' : '#5fad81'}
              />
              <circle
                cx="36"
                cy="24"
                r="1.5"
                fill={variant === 'light' ? 'rgba(255,255,255,0.5)' : variant === 'dark' ? 'rgba(55,65,81,0.3)' : '#dcfce7'}
              />

              {/* Decorative accent dots - modern touch */}
              <circle
                cx="18"
                cy="32"
                r="1.5"
                fill={variant === 'light' ? 'rgba(255,255,255,0.3)' : variant === 'dark' ? 'rgba(55,65,81,0.2)' : '#4ea674'}
                opacity="0.6"
              />
              <circle
                cx="30"
                cy="14"
                r="1.5"
                fill={variant === 'light' ? 'rgba(255,255,255,0.3)' : variant === 'dark' ? 'rgba(55,65,81,0.2)' : '#5fad81'}
                opacity="0.6"
              />

              {/* Gradients */}
              <defs>
                <linearGradient id="modernBg" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stopColor="#f0f9f4" />
                  <stop offset="50%" stopColor="#dcfce7" />
                  <stop offset="100%" stopColor="#bbf7d0" />
                </linearGradient>
                <linearGradient id="modernStroke" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stopColor="#459071" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#5fad81" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="pathGradient" x1="12" y1="18" x2="36" y2="24">
                  <stop offset="0%" stopColor="#459071" />
                  <stop offset="50%" stopColor="#4ea674" />
                  <stop offset="100%" stopColor="#5fad81" />
                </linearGradient>
                <linearGradient id="pathGradient2" x1="12" y1="22" x2="36" y2="30">
                  <stop offset="0%" stopColor="#459071" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#5fad81" stopOpacity="0.4" />
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