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
              {/* Clean white rounded square - Arattai style */}
              <rect
                x="4"
                y="4"
                width="40"
                height="40"
                rx="10"
                fill={variant === 'light' ? 'white' : variant === 'dark' ? 'white' : 'white'}
                stroke="none"
              />

              {/* Simple "N" lettermark - clean and minimal */}
              <path
                d="M 16 30 L 16 18 L 25 27 L 25 18"
                stroke={variant === 'light' ? '#10b981' : variant === 'dark' ? '#10b981' : '#10b981'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Subtle accent dot */}
              <circle
                cx="30"
                cy="19"
                r="2"
                fill={variant === 'light' ? '#10b981' : variant === 'dark' ? '#10b981' : '#10b981'}
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