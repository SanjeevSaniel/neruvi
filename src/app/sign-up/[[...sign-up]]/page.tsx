'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-white via-violet-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-lg">
              <img
                src="/flowmind-logo-2.png"
                alt="FlowMind Logo"
                className="w-10 h-10"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Join FlowMind</h1>
          <p className="text-slate-300">Start your AI-powered learning adventure</p>
        </div>
        
        <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-8 border border-white/20 shadow-2xl">
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-purple-600 hover:bg-purple-700 text-sm normal-case',
                card: 'bg-transparent shadow-none',
                headerTitle: 'text-white',
                headerSubtitle: 'text-slate-300',
                socialButtonsBlockButton: 'bg-white/10 border-white/20 text-white hover:bg-white/20',
                formFieldInput: 'bg-white/10 border-white/20 text-white placeholder:text-slate-400',
                formFieldLabel: 'text-white',
                footerActionLink: 'text-purple-300 hover:text-purple-200'
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}