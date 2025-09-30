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
              {/* Pure white circular background - Arattai style */}
              <circle
                cx="24"
                cy="24"
                r="22"
                fill="white"
                stroke="none"
              />

              {/* Ultra-minimal single-stroke "N" - Arattai approach */}
              <path
                d="M 15 30 L 15 18 L 24 27 L 33 18 L 33 30"
                stroke={variant === 'light' ? '#10b981' : variant === 'dark' ? '#10b981' : '#10b981'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
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