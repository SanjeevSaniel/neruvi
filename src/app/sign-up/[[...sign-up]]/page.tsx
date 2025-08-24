'use client';

import { SignUp } from '@clerk/nextjs';
import Image from 'next/image';
import FlowMindLogo from '@/components/FlowMindLogo';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
      {/* Subtle gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-r from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <FlowMindLogo size={32} animated={true} className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Join FlowMind</h1>
          <p className="text-slate-600">Start your AI-powered learning adventure</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-2xl">
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm normal-case rounded-xl shadow-lg hover:shadow-xl transition-all duration-300',
                card: 'bg-transparent shadow-none',
                headerTitle: 'text-slate-900 text-2xl font-bold',
                headerSubtitle: 'text-slate-600',
                socialButtonsBlockButton: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-300',
                formFieldInput: 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300',
                formFieldLabel: 'text-slate-700 font-medium',
                footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium'
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}