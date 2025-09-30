'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import NeruviBrandLogo from '@/components/NeruviBrandLogo';

export default function SignInPage() {
  return (
    <div className='min-h-screen bg-white flex'>
      {/* Left Side - Enhanced Branding */}
      <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/40 flex-col justify-center items-center p-12 relative overflow-hidden'>
        {/* Dynamic Background Elements - matching landing page */}
        <div className='absolute inset-0 overflow-hidden'>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary-400/25 to-secondary-400/25 rounded-full blur-3xl animate-pulse'></div>
          <div
            className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-secondary-400/20 to-primary-400/20 rounded-full blur-3xl animate-pulse'
            style={{ animationDelay: '2s' }}></div>
          <div
            className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-primary-300/15 to-secondary-300/15 rounded-full blur-3xl animate-pulse'
            style={{ animationDelay: '4s' }}></div>
        </div>

        <div className='relative z-10 max-w-lg text-center'>
          {/* Logo Section */}
          <div className='mb-16'>
            <NeruviBrandLogo size="xl" showIcon={true} showTagline={true} className="justify-center" />
            <div className='w-32 h-1 bg-gradient-to-r from-primary-500 to-secondary-900 mx-auto rounded-full mt-6'></div>
          </div>

          {/* Welcome Message */}
          <div>
            <h2
              className='text-3xl md:text-4xl font-light mb-6'
              style={{ color: '#459071' }}>
              Welcome Back!
            </h2>
            <p className='text-xl text-[#394150] leading-relaxed font-light max-w-md mx-auto'>
              Continue your AI-powered learning journey with personalized
              guidance.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className='w-full lg:w-1/2 flex flex-col justify-center items-center p-8'>
        <div className='w-full max-w-sm'>
          {/* Mobile Logo */}
          <div className='lg:hidden text-center mb-8'>
            <div className='mx-auto mb-4 flex justify-center'>
              <NeruviBrandLogo size="md" showIcon={true} showTagline={false} />
            </div>
          </div>

          {/* Back to Home */}
          <div className='mb-8'>
            <Link
              href='/'
              className='text-sm text-slate-500 hover:text-slate-700 transition-colors'>
              ← Back to Home
            </Link>
          </div>
          <SignIn
            routing='path'
            path='/sign-in'
            signUpUrl='/sign-up'
            afterSignInUrl='/'
            redirectUrl='/'
            forceRedirectUrl='/'
            appearance={{
              elements: {
                card: 'shadow-none bg-transparent',
                headerTitle: 'text-slate-900 text-2xl font-semibold mb-2',
                headerSubtitle: 'text-slate-600 text-sm mb-6',
                formButtonPrimary:
                  'bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 w-full',
                socialButtonsBlockButton:
                  'border border-slate-300 hover:border-slate-400 bg-white hover:bg-gray-50 text-slate-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 w-full mb-3',
                socialButtonsBlockButtonText: 'text-sm font-medium',
                socialButtonsBlock: 'space-y-3 mb-6',
                socialButtonsProviderIcon: 'w-5 h-5 mr-3',
                formFieldInput:
                  'border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-3 text-slate-900 placeholder:text-slate-400 transition-colors duration-200',
                formFieldLabel: 'text-slate-700 font-medium text-sm mb-2',
                footerActionLink:
                  'text-blue-600 hover:text-blue-700 font-medium',
                dividerLine: 'border-slate-200',
                dividerText: 'text-slate-500 text-sm',
                rootBox: 'w-full',
                cardBox: 'w-full',
              },
              variables: {
                colorPrimary: '#2563eb',
                colorBackground: '#ffffff',
                colorInputBackground: '#ffffff',
                colorInputText: '#1e293b',
                colorText: '#1e293b',
                colorTextSecondary: '#64748b',
                fontFamily: "'Figtree', ui-sans-serif, system-ui, sans-serif",
                fontSize: '14px',
                spacingUnit: '1rem',
                borderRadius: '0.5rem',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}