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
        {/* Modern Neural Network Icon */}
        {showIcon && (
          <div className="relative flex-shrink-0">
            <svg
              width={config.icon}
              height={config.icon}
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Modern rounded square background with strong contrast */}
              <rect
                x="2"
                y="2"
                width="44"
                height="44"
                rx="12"
                fill={variant === 'light' ? 'white' : variant === 'dark' ? '#f8fafc' : 'white'}
                stroke={variant === 'light' ? 'rgba(255,255,255,0.4)' : variant === 'dark' ? 'rgba(148,163,184,0.3)' : 'rgba(69,144,113,0.15)'}
                strokeWidth="1.5"
              />

              {/* Neural network paths - learning representation */}
              {/* Layer 1 to Layer 2 connections */}
              <path
                d="M 14 18 Q 20 22, 24 16"
                stroke={variant === 'light' ? '#10b981' : variant === 'dark' ? '#4ea674' : '#4ea674'}
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.4"
              />
              <path
                d="M 14 18 Q 20 20, 24 24"
                stroke={variant === 'light' ? '#10b981' : variant === 'dark' ? '#4ea674' : '#4ea674'}
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.4"
              />
              <path
                d="M 14 18 Q 20 26, 24 32"
                stroke={variant === 'light' ? '#10b981' : variant === 'dark' ? '#4ea674' : '#4ea674'}
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.4"
              />

              {/* Layer 2 to Layer 3 connections */}
              <path
                d="M 24 16 Q 28 20, 34 24"
                stroke={variant === 'light' ? '#10b981' : variant === 'dark' ? '#5fad81' : '#5fad81'}
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.6"
              />
              <path
                d="M 24 24 L 34 24"
                stroke={variant === 'light' ? '#059669' : variant === 'dark' ? '#459071' : '#459071'}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 24 32 Q 28 28, 34 24"
                stroke={variant === 'light' ? '#10b981' : variant === 'dark' ? '#5fad81' : '#5fad81'}
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.6"
              />

              {/* Neural nodes - learning points */}
              {/* Input node */}
              <circle
                cx="14"
                cy="18"
                r="3.5"
                fill={variant === 'light' ? '#10b981' : variant === 'dark' ? '#4ea674' : '#4ea674'}
                stroke="white"
                strokeWidth="2"
              />

              {/* Hidden layer nodes */}
              <circle
                cx="24"
                cy="16"
                r="3"
                fill={variant === 'light' ? '#10b981' : variant === 'dark' ? '#5fad81' : '#5fad81'}
                stroke="white"
                strokeWidth="1.5"
              />
              <circle
                cx="24"
                cy="24"
                r="3.5"
                fill={variant === 'light' ? '#059669' : variant === 'dark' ? '#459071' : '#459071'}
                stroke="white"
                strokeWidth="2"
              />
              <circle
                cx="24"
                cy="32"
                r="3"
                fill={variant === 'light' ? '#10b981' : variant === 'dark' ? '#5fad81' : '#5fad81'}
                stroke="white"
                strokeWidth="1.5"
              />

              {/* Output node - glowing effect */}
              <circle
                cx="34"
                cy="24"
                r="4"
                fill={variant === 'light' ? '#059669' : variant === 'dark' ? '#10b981' : '#10b981'}
                stroke="white"
                strokeWidth="2"
              />

              {/* Glow effect for output */}
              <circle
                cx="34"
                cy="24"
                r="6"
                fill="none"
                stroke={variant === 'light' ? '#10b981' : variant === 'dark' ? '#4ea674' : '#4ea674'}
                strokeWidth="1"
                opacity="0.3"
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