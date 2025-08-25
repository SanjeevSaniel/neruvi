'use client';

import { SignIn } from '@clerk/nextjs';
import FlowMindLogo from '@/components/FlowMindLogo';
import KnowledgeWaveAnimation from '@/components/landing/KnowledgeWaveAnimation';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-violet-50/20 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Modern Wave Background */}
      <KnowledgeWaveAnimation className="opacity-20" />
      
      {/* Dynamic Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-300/20 to-violet-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-to-r from-violet-300/15 to-purple-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-2/3 right-1/4 w-64 h-64 bg-gradient-to-r from-purple-400/10 to-violet-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Modern Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-purple-100 to-violet-100 rounded-2xl border border-purple-200/50 shadow-sm">
              <FlowMindLogo size={32} animated={true} className="w-10 h-10" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent font-comfortaa lowercase tracking-tight" style={{ fontFamily: 'Comfortaa, ui-rounded, ui-sans-serif, system-ui, sans-serif' }}>
                flowmind
              </h1>
              <div className="text-xs text-purple-500 font-semibold tracking-wider uppercase">
                AI Learning Platform
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Welcome back
          </h2>
          <p className="text-gray-600 font-medium">
            Continue your AI-powered learning journey
          </p>
        </div>
        
        {/* Ultra-Modern Card */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-purple-200/50 shadow-2xl p-10 relative">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 rounded-3xl"></div>
          <div className="relative z-10">
          <SignIn 
            afterSignInUrl="/chat"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg font-medium transition-all duration-200 py-3",
                socialButtonsBlockButtonText: "font-medium text-sm",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-500 text-sm",
                formFieldLabel: "text-gray-700 font-medium text-sm",
                formFieldInput: "border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-0 transition-all duration-200 py-3",
                formButtonPrimary: "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl py-3 text-white",
                footerActionLink: "text-purple-600 hover:text-purple-700 font-medium text-sm",
                identityPreviewText: "text-gray-700",
                identityPreviewEditButtonIcon: "text-gray-500",
                formFieldSuccessText: "text-purple-600 text-xs",
                formFieldErrorText: "text-red-600 text-xs"
              },
              variables: {
                colorPrimary: "#9333ea",
                colorBackground: "rgba(255, 255, 255, 0.8)",
                colorInputBackground: "rgba(249, 250, 251, 0.8)",
                colorInputText: "#374151",
                colorText: "#374151",
                colorTextSecondary: "#6b7280",
                borderRadius: "16px",
                fontFamily: "'Figtree', ui-sans-serif, system-ui, sans-serif",
                fontSize: "16px",
                spacingUnit: "1.25rem"
              }
            }}
          />
          </div>
        </div>
      </div>
    </div>
  );
}