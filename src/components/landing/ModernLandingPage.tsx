'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Brain, 
  Sparkles, 
  Code2, 
  MessageSquare, 
  Zap, 
  ArrowRight,
  Github,
  Layers,
  Shield,
  Cpu,
  Workflow,
  PlayCircle,
  CheckCircle2,
  Star,
  Users
} from 'lucide-react';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ModernLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const features = [
    {
      icon: Brain,
      title: "Smart RAG System",
      description: "Advanced retrieval with HyDE and semantic search for precise course content matching",
      color: "from-blue-400/20 to-cyan-400/20",
      iconColor: "text-blue-500",
      gradient: "from-blue-50 to-cyan-50"
    },
    {
      icon: MessageSquare,
      title: "Real-time Streaming",
      description: "Lightning-fast responses with expandable message details and context awareness",
      color: "from-purple-400/20 to-pink-400/20", 
      iconColor: "text-purple-500",
      gradient: "from-purple-50 to-pink-50"
    },
    {
      icon: Code2,
      title: "Course Navigation",
      description: "Intelligent Node.js and Python content with timestamp references and sections",
      color: "from-emerald-400/20 to-green-400/20",
      iconColor: "text-emerald-500",
      gradient: "from-emerald-50 to-green-50"
    },
    {
      icon: Zap,
      title: "Instant Context",
      description: "Sub-second search with optimized vector embeddings and relevance scoring",
      color: "from-orange-400/20 to-yellow-400/20",
      iconColor: "text-orange-500",
      gradient: "from-orange-50 to-yellow-50"
    },
    {
      icon: Layers,
      title: "Two-Column UI",
      description: "Claude-style expandable interface with detailed message exploration",
      color: "from-indigo-400/20 to-blue-400/20",
      iconColor: "text-indigo-500",
      gradient: "from-indigo-50 to-blue-50"
    },
    {
      icon: Workflow,
      title: "Smart Export",
      description: "Export conversations in markdown with proper formatting and attribution",
      color: "from-teal-400/20 to-cyan-400/20",
      iconColor: "text-teal-500",
      gradient: "from-teal-50 to-cyan-50"
    }
  ];

  // Removed stats section for cleaner design

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
      // Hero animations - Vite-style
      const tl = gsap.timeline({ delay: 0.5 });
      
      tl.fromTo('.hero-logo', 
        { scale: 0, rotation: -180, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 1, ease: 'back.out(1.7)' }
      )
      .fromTo('.hero-title',
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.5'
      )
      .fromTo('.hero-subtitle',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.3'
      )
      .fromTo('.hero-buttons',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.2'
      );

      // Floating elements animation - more fluid
      gsap.to('.floating', {
        y: -15,
        x: 5,
        rotation: 2,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.3
      });

      // Features grid animation - more fluid
      ScrollTrigger.create({
        trigger: '.features-grid',
        start: 'top 85%',
        onEnter: () => {
          gsap.fromTo('.feature-card',
            { y: 60, opacity: 0, scale: 0.95, rotationY: 15 },
            { 
              y: 0, 
              opacity: 1, 
              scale: 1,
              rotationY: 0,
              duration: 0.8,
              ease: 'power2.out',
              stagger: 0.15
            }
          );
        }
      });

      // Gradient orbs animation - more fluid
      gsap.to('.gradient-orb', {
        rotation: 360,
        duration: 25,
        repeat: -1,
        ease: 'none'
      });

      gsap.to('.gradient-orb', {
        x: 'random(-80, 80)',
        y: 'random(-50, 50)',
        scale: 'random(0.8, 1.2)',
        duration: 'random(15, 20)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 2
      });

      // Continuous subtle movements
      gsap.to('.hero-logo', {
        y: 'random(-3, 3)',
        x: 'random(-2, 2)',
        rotation: 'random(-1, 1)',
        duration: 'random(3, 5)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className='min-h-screen bg-white overflow-hidden relative'>
      {/* Subtle gradient background */}
      <div className='absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30' />

      {/* Animated gradient orbs */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='gradient-orb absolute top-10 left-10 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl' />
        <div className='gradient-orb absolute top-1/2 right-10 w-80 h-80 bg-gradient-to-r from-pink-200/30 to-orange-200/30 rounded-full blur-3xl' />
        <div className='gradient-orb absolute bottom-10 left-1/3 w-64 h-64 bg-gradient-to-r from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl' />
      </div>

      {/* Interactive cursor effect */}
      <div
        className='fixed w-6 h-6 pointer-events-none z-50 mix-blend-multiply'
        style={{
          transform: `translate(${mousePosition.x - 12}px, ${
            mousePosition.y - 12
          }px)`,
          transition: 'transform 0.1s ease-out',
        }}>
        <div className='w-full h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20' />
      </div>

      {/* Navigation */}
      <nav className='relative z-20 flex items-center justify-between p-6 lg:px-12'>
        <div className='flex items-center space-x-3'>
          <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg'>
            <Image
              src='/flowmind-logo-2.png'
              alt='FlowMind Logo'
              width={20}
              height={20}
              className='drop-shadow-sm'
            />
          </div>
          <span className='text-lg font-bold text-slate-800'>FlowMind</span>
        </div>

        <div className='flex items-center space-x-6'>
          <Link
            href='https://github.com/your-username/flowmind'
            className='flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors text-sm'>
            <Github className='w-4 h-4' />
            <span className='hidden sm:inline'>GitHub</span>
          </Link>
          <SignInButton mode='modal'>
            <button className='text-sm text-slate-600 hover:text-slate-900 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100'>
              Sign In
            </button>
          </SignInButton>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className='relative z-10 px-6 lg:px-12 pt-16 pb-24'>
        <div className='max-w-5xl mx-auto text-center'>
          {/* Logo */}
          <div className='hero-logo mb-8'>
            <div className='w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl floating'>
              <Brain className='w-10 h-10 text-white' />
            </div>
          </div>

          {/* Title */}
          <div className='hero-title mb-6'>
            <h1 className='text-5xl md:text-7xl font-bold leading-tight mb-4'>
              <span className='bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent'>
                Learn Programming
              </span>
              <br />
              <span className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent'>
                with AI Precision
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <div className='hero-subtitle mb-12'>
            <p className='text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed'>
              Experience the future of learning with{' '}
              <span className='font-semibold text-blue-600'>
                advanced RAG technology
              </span>
              ,{' '}
              <span className='font-semibold text-purple-600'>
                real-time streaming
              </span>
              , and{' '}
              <span className='font-semibold text-indigo-600'>
                intelligent course navigation
              </span>
              .
            </p>
          </div>

          {/* Buttons */}
          <div className='hero-buttons flex flex-col sm:flex-row gap-4 justify-center items-center mb-16'>
            <SignUpButton mode='modal'>
              <button className='group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105'>
                <span className='flex items-center space-x-2'>
                  <span>Start Learning</span>
                  <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                </span>
              </button>
            </SignUpButton>

            <button className='group flex items-center space-x-2 px-8 py-4 border border-slate-300 text-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-all duration-300 transform hover:scale-105'>
              <PlayCircle className='w-5 h-5' />
              <span>Watch Demo</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        className='relative z-10 px-6 lg:px-12 py-24 bg-gradient-to-b from-white to-slate-50'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'>
              Powered by Advanced AI
            </h2>
            <p className='text-xl text-slate-600 max-w-2xl mx-auto'>
              Experience next-generation learning with cutting-edge technology
              and intelligent features
            </p>
          </div>

          <div className='features-grid grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {features.map((feature, index) => (
              <div
                key={index}
                className='feature-card group relative p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105'>
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
                <div className='relative z-10'>
                  <div className='flex items-center justify-center mb-4'>
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center shadow-lg`}>
                      <feature.icon
                        className={`w-6 h-6 ${feature.iconColor}`}
                      />
                    </div>
                  </div>
                  <h3 className='text-xl font-bold mb-3 text-slate-900'>
                    {feature.title}
                  </h3>
                  <p className='text-slate-600 leading-relaxed text-sm'>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        className='relative z-10 px-6 lg:px-12 py-24 bg-gradient-to-br from-slate-50 to-blue-50'>
        <div className='max-w-4xl mx-auto text-center'>
          <div className='floating mb-8'>
            <div className='w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl'>
              <Sparkles className='w-8 h-8 text-white' />
            </div>
          </div>

          <h2 className='text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'>
            Ready to Transform Your Learning?
          </h2>
          <p className='text-xl text-slate-600 mb-12 max-w-2xl mx-auto'>
            Join developers mastering programming with AI-powered precision and
            intelligent course navigation
          </p>

          <div className='flex flex-col sm:flex-row gap-6 justify-center items-center mb-12'>
            <SignUpButton mode='modal'>
              <button className='group relative px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105'>
                <span className='flex items-center space-x-3'>
                  <Brain className='w-6 h-6' />
                  <span>Get Started Free</span>
                  <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                </span>
              </button>
            </SignUpButton>

            <div className='flex items-center space-x-3 text-slate-500'>
              <div className='flex -space-x-2'>
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className='w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold'>
                    <Users className='w-3 h-3' />
                  </div>
                ))}
              </div>
              <span className='text-sm font-medium'>Join 1,000+ learners</span>
            </div>
          </div>

          {/* Social proof */}
          <div className='flex justify-center items-center space-x-6 text-slate-400'>
            <div className='flex items-center space-x-1'>
              <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
              <span className='text-sm font-medium text-slate-600'>
                4.9/5 Rating
              </span>
            </div>
            <div className='w-1 h-1 bg-slate-300 rounded-full' />
            <div className='flex items-center space-x-1'>
              <CheckCircle2 className='w-4 h-4 text-green-500' />
              <span className='text-sm font-medium text-slate-600'>
                Free to Start
              </span>
            </div>
            <div className='w-1 h-1 bg-slate-300 rounded-full' />
            <div className='flex items-center space-x-1'>
              <Shield className='w-4 h-4 text-blue-500' />
              <span className='text-sm font-medium text-slate-600'>
                Secure & Private
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='relative z-10 border-t border-slate-200 px-6 lg:px-12 py-12 bg-white'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <div className='flex items-center space-x-3 mb-6 md:mb-0'>
              <div className='w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center'>
                <Image
                  src='/flowmind-logo-2.png'
                  alt='FlowMind'
                  width={16}
                  height={16}
                />
              </div>
              <span className='text-slate-600'>
                © 2025 FlowMind. All rights reserved.
              </span>
            </div>

            <div className='flex items-center space-x-8'>
              <Link
                href='#'
                className='text-slate-500 hover:text-slate-700 transition-colors text-sm'>
                Privacy
              </Link>
              <Link
                href='#'
                className='text-slate-500 hover:text-slate-700 transition-colors text-sm'>
                Terms
              </Link>
              <Link
                href='https://github.com/your-username/flowmind'
                className='flex items-center space-x-2 text-slate-500 hover:text-slate-700 transition-colors text-sm'>
                <Github className='w-4 h-4' />
                <span>GitHub</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}