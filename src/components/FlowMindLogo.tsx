// components/ui/FlowMindLogo.tsx
import Image from 'next/image';
interface FlowMindLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

const FlowMindLogo = ({}: FlowMindLogoProps) => {
  return (
    <div className='w-10 h-10 bg-gradient-to-br from-white via-violet-100 to-indigo-100 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg'>
      <Image
        src='/flowmind-logo-2.png'
        alt='FlowMind Logo'
        width={50}
        height={50}
      />
    </div>
  );
};

export default FlowMindLogo;
