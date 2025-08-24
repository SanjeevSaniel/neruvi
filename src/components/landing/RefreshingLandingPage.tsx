'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  Github,
  Sparkles,
  Zap,
  MessageSquare,
  Code2,
  Brain,
  Linkedin,
  Twitter,
} from 'lucide-react';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import Link from 'next/link';
import FlowMindLogo from '../FlowMindLogo';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function RefreshingLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Advanced RAG system with semantic search',
    },
    {
      icon: MessageSquare,
      title: 'Real-time Chat',
      description: 'Streaming responses with instant feedback',
    },
    {
      icon: Code2,
      title: 'Course Navigation',
      description: 'Node.js & Python with timestamps',
    },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Hero entrance animation
      const tl = gsap.timeline({ delay: 0.3 });

      tl.fromTo(
        '.hero-content',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
      ).fromTo(
        '.feature-card',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.1 },
        '-=0.4'
      );

      // Floating animations
      gsap.to('.floating', {
        y: -8,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.5,
      });

      // Sparkle animation
      gsap.to('.sparkle', {
        rotation: 360,
        duration: 8,
        repeat: -1,
        ease: 'none',
        stagger: 2,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-purple-50 overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #faf7ff 0%, #ffffff 20%, #f3f0ff 100%)'
      }}
    >
      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-200/20 to-lavender-200/20 rounded-full blur-2xl floating" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-lavender-300/25 to-purple-300/25 rounded-full blur-xl floating" />
        <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-gradient-to-r from-purple-300/20 to-lavender-400/20 rounded-full blur-lg floating" />
      </div>

      {/* Cursor glow effect */}
      <div
        className="fixed w-4 h-4 pointer-events-none z-50 mix-blend-multiply opacity-30"
        style={{
          transform: `translate(${mousePosition.x - 8}px, ${mousePosition.y - 8}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        <div className="w-full h-full bg-gradient-to-r from-purple-400 to-lavender-400 rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 lg:px-8 py-4">
        <div className="flex items-center space-x-3">
          <FlowMindLogo size={24} animated={false} className="w-8 h-8" />
          <span className="text-lg font-bold bg-gradient-to-r from-purple-700 to-lavender-600 bg-clip-text text-transparent">
            FlowMind
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="https://github.com/SanjeevSaniel/flowmind-ai-chat"
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-all duration-300 text-sm hover:bg-purple-50 px-3 py-2 rounded-lg transform hover:scale-105"
          >
            <Github className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
            <span className="hidden sm:inline">GitHub</span>
          </Link>
          <SignInButton mode="modal">
            <button className="text-sm text-purple-600 hover:text-purple-800 transition-all duration-300 px-3 py-1.5 rounded-lg hover:bg-purple-50 transform hover:scale-105 hover:shadow-md">
              Sign In
            </button>
          </SignInButton>
        </div>
      </nav>

      {/* Hero Section - Compact */}
      <section className="relative z-10 px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center hero-content">
          {/* Logo with sparkles */}
          <div className="relative mb-6 flex justify-center">
            <div className="relative">
              <FlowMindLogo size={48} animated={true} className="w-16 h-16 floating" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-purple-400 sparkle" />
              <Sparkles className="absolute -bottom-1 -left-1 w-3 h-3 text-lavender-400 sparkle" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            <span className="bg-gradient-to-r from-purple-800 via-purple-600 to-lavender-600 bg-clip-text text-transparent">
              Learn Programming
            </span>
            <br />
            <span className="bg-gradient-to-r from-lavender-600 via-purple-500 to-purple-700 bg-clip-text text-transparent">
              with AI Precision
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-purple-700 max-w-2xl mx-auto leading-relaxed mb-8">
            Experience intelligent learning with{' '}
            <span className="font-semibold text-purple-800">advanced RAG</span>,{' '}
            <span className="font-semibold text-lavender-700">real-time streaming</span>, and{' '}
            <span className="font-semibold text-purple-600">smart navigation</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
            <SignUpButton mode="modal">
              <button className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-lavender-600 text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 hover:brightness-110">
                <span className="flex items-center space-x-2">
                  <span>Start Learning</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 to-lavender-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            </SignUpButton>

            <SignInButton mode="modal">
              <button className="group flex items-center space-x-2 px-6 py-3 border border-purple-200 text-purple-700 rounded-xl font-semibold text-base hover:bg-gradient-to-r hover:from-purple-50 hover:to-lavender-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:border-purple-300">
                <Zap className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span>Quick Access</span>
              </button>
            </SignInButton>
          </div>

          {/* Quick Features */}
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card group p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-100 shadow-md hover:shadow-xl hover:bg-white/80 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-lavender-500 flex items-center justify-center group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-purple-800 mb-1 group-hover:text-purple-900 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-xs text-purple-600 leading-relaxed group-hover:text-purple-700 transition-colors duration-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="relative z-10 border-t border-purple-100 px-6 lg:px-8 py-8 mt-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center space-y-6">
            {/* Main branding */}
            <div className="flex items-center space-x-3">
              <FlowMindLogo size={20} animated={false} className="w-6 h-6" />
              <span className="text-purple-600 font-medium">© 2025 FlowMind</span>
            </div>

            {/* Creator info */}
            <div className="text-center">
              <p className="text-purple-700 font-medium mb-2">Crafted with ❤️ by Sanjeev Saniel</p>
              <div className="flex items-center justify-center space-x-1 text-purple-500">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-xs">Open Source AI Learning Platform</span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex items-center space-x-4">
              <Link
                href="https://github.com/SanjeevSaniel"
                className="group flex items-center space-x-2 text-purple-500 hover:text-purple-700 transition-all duration-300 hover:bg-purple-50 px-3 py-2 rounded-lg transform hover:scale-105"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-sm hidden sm:inline">GitHub</span>
              </Link>
              
              <Link
                href="https://www.linkedin.com/in/sanjeevsaniel/"
                className="group flex items-center space-x-2 text-purple-500 hover:text-purple-700 transition-all duration-300 hover:bg-purple-50 px-3 py-2 rounded-lg transform hover:scale-105"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm hidden sm:inline">LinkedIn</span>
              </Link>
              
              <Link
                href="https://x.com/SanjeevSaniel"
                className="group flex items-center space-x-2 text-purple-500 hover:text-purple-700 transition-all duration-300 hover:bg-purple-50 px-3 py-2 rounded-lg transform hover:scale-105"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-sm hidden sm:inline">Twitter</span>
              </Link>

              <Link
                href="https://github.com/SanjeevSaniel/flowmind-ai-chat"
                className="group flex items-center space-x-2 text-purple-500 hover:text-purple-700 transition-all duration-300 hover:bg-purple-50 px-3 py-2 rounded-lg transform hover:scale-105"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-sm">Repository</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}