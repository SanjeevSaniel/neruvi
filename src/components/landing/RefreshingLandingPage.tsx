'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Database,
  FileText,
  Github,
  Linkedin,
  MessageCircle,
  Search,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import FlowMindLogo from '../FlowMindLogo';
import KnowledgeWaveAnimation from './KnowledgeWaveAnimation';
import { Button } from '../ui/button';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Modern Clerk appearance configuration
const clerkAppearance = {
  elements: {
    modalContent:
      'bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-purple-200/50',
    modalCloseButton:
      'text-gray-400 hover:text-purple-600 transition-colors cursor-pointer',
    headerTitle:
      'text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent font-comfortaa lowercase tracking-tight',
    headerSubtitle: 'text-gray-500 font-medium',
    socialButtonsBlockButton:
      'relative overflow-hidden bg-white border-2 border-gray-200 hover:border-purple-300 text-gray-700 rounded-2xl font-semibold transition-all duration-300 py-4 cursor-pointer group hover:shadow-lg',
    socialButtonsBlockButtonText: 'relative z-10 font-semibold',
    dividerLine:
      'bg-gradient-to-r from-transparent via-purple-200 to-transparent',
    dividerText: 'text-purple-500 font-medium text-sm bg-white px-4',
    formFieldLabel: 'text-gray-700 font-semibold text-sm tracking-wide',
    formFieldInput:
      'border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-0 focus:shadow-lg focus:shadow-purple-500/10 transition-all duration-300 py-4 bg-gray-50/50 focus:bg-white',
    formButtonPrimary:
      'relative overflow-hidden bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 hover:from-purple-700 hover:via-violet-700 hover:to-purple-800 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-purple-500/25 py-4 text-white cursor-pointer group hover:scale-105',
    footerActionLink:
      'text-purple-600 hover:text-purple-700 font-semibold cursor-pointer transition-colors duration-200 hover:underline decoration-2 underline-offset-2',
    userButtonPopoverActionButton:
      'hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 text-gray-700 hover:text-purple-700 rounded-2xl transition-all duration-200 cursor-pointer font-medium',
    identityPreviewText: 'text-gray-800 font-medium',
    identityPreviewEditButtonIcon: 'text-purple-500 hover:text-purple-600',
    formFieldSuccessText: 'text-purple-600 font-medium',
    formFieldErrorText: 'text-red-500 font-medium',
  },
  variables: {
    colorPrimary: '#9333ea',
    colorBackground: '#ffffff',
    colorInputBackground: 'rgba(249, 250, 251, 0.5)',
    colorInputText: '#374151',
    colorText: '#374151',
    colorTextSecondary: '#6b7280',
    borderRadius: '16px',
    fontFamily: "'Figtree', ui-sans-serif, system-ui, sans-serif",
    fontSize: '16px',
    spacingUnit: '1.25rem',
  },
};

export default function TranscriptLearningLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const workflowSteps = [
    {
      step: '01',
      title: 'Ask Your Question',
      description: 'Type any programming question in natural language',
      icon: MessageCircle,
      color: 'from-blue-500 to-blue-600',
      demo: 'How do I implement authentication in Node.js?',
    },
    {
      step: '02',
      title: 'AI Searches Transcripts',
      description:
        'QdrantDB finds relevant moments across all indexed transcript content',
      icon: Search,
      color: 'from-purple-500 to-purple-600',
      demo: 'Searching 10,000+ transcript segments...',
    },
    {
      step: '03',
      title: 'Get Timestamped Content',
      description:
        'Receive precise answers with exact transcript timestamps and context',
      icon: Clock,
      color: 'from-emerald-500 to-emerald-600',
      demo: 'Found in "Node.js Auth Tutorial" at 12:34',
    },
    {
      step: '04',
      title: 'Read Full Context',
      description:
        'Access the complete transcript section for comprehensive understanding',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      demo: 'Reading transcript from 12:34...',
    },
  ];

  const keyFeatures = [
    {
      icon: FileText,
      title: 'Transcript-First Learning',
      description:
        'Learn from detailed video transcripts with precise timing information',
      highlight: 'Smart Transcript Indexing',
    },
    {
      icon: Brain,
      title: 'Context-Aware AI',
      description:
        'AI understands transcript context and provides accurate, detailed answers',
      highlight: 'Advanced AI Understanding',
    },
    {
      icon: Clock,
      title: 'Precise Timestamps',
      description:
        'Jump directly to the transcript moment that answers your question',
      highlight: 'Exact Moment Navigation',
    },
    {
      icon: Database,
      title: 'QdrantDB Powered',
      description:
        'Lightning-fast vector search across massive transcript libraries',
      highlight: 'High-Performance Search',
    },
  ];

  const testimonialQuestions = [
    'How do I deploy a React app to Vercel?',
    "What's the difference between useEffect and useLayoutEffect?",
    'How to implement JWT authentication?',
    'What are the best practices for API design?',
    'How to optimize database queries?',
    "What's the difference between SQL and NoSQL?",
  ];

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Sync GSAP with Lenis
      if (lenisRef.current) {
        lenisRef.current.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
          lenisRef.current?.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      }

      // Hero animations
      const heroTl = gsap.timeline({ delay: 0.3 });
      heroTl
        .fromTo(
          '.hero-badge',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        )
        .fromTo(
          '.hero-title',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
          '-=0.3',
        )
        .fromTo(
          '.hero-subtitle',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
          '-=0.4',
        )
        .fromTo(
          '.hero-buttons',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
          '-=0.2',
        )
        .fromTo(
          '.hero-demo',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
          '-=0.3',
        );

      // Workflow steps animation
      gsap.fromTo(
        '.workflow-step',
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.2,
          scrollTrigger: {
            trigger: howItWorksRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        },
      );

      // Features animation
      gsap.fromTo(
        '.feature-card',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        },
      );

      // Demo animation
      gsap.fromTo(
        '.demo-element',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: demoRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % workflowSteps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [workflowSteps.length]);

  return (
    <div
      ref={containerRef}
      className='min-h-screen bg-white'>
      {/* Modern Navigation */}
      <nav className='sticky top-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-3 p-2'>
                <FlowMindLogo
                  size={32}
                  animated={true}
                  className='w-9 h-9'
                />
                <div>
                  <span
                    className='text-xl font-bold bg-clip-text text-black font-comfortaa lowercase'
                    style={{
                      fontFamily:
                        'Comfortaa, ui-rounded, ui-sans-serif, system-ui, sans-serif',
                    }}>
                    flowmind
                  </span>
                  <div className='text-xs text-purple-500 font-medium'>
                    AI POWERED LEARNING
                  </div>
                </div>
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <Link
                href='https://github.com/SanjeevSaniel/flowmind-ai-chat'
                className='flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-purple-50 group'>
                <Github className='w-4 h-4 group-hover:scale-110 transition-transform' />
                <span className='hidden sm:inline font-medium'>GitHub</span>
              </Link>

              <SignInButton
                mode='modal'
                appearance={clerkAppearance}>
                <Button
                  variant='outline'
                  className='relative overflow-hidden text-md transition-all duration-300 px-4 py-2 rounded-xl hover:bg-none font-medium cursor-pointer group'>
                  {/* <div className='absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300'></div> */}
                  <span className='relative z-10'>Sign In</span>
                </Button>
              </SignInButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Modern Hero Section */}
      <section
        ref={heroRef}
        className='relative bg-gradient-to-br from-white via-purple-50/20 to-violet-50/30 pt-20 pb-32 overflow-hidden'>
        {/* Dynamic Background Elements */}
        <div className='absolute inset-0 overflow-hidden'>
          <KnowledgeWaveAnimation className='opacity-30' />
          <div className='absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-violet-400/20 rounded-full blur-3xl animate-pulse' />
          <div
            className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-violet-400/15 to-purple-400/15 rounded-full blur-3xl animate-pulse'
            style={{ animationDelay: '2s' }}
          />
        </div>

        <div className='max-w-6xl mx-auto px-6 lg:px-8 relative z-10'>
          {/* Clean, Focused Layout */}
          <div className='grid lg:grid-cols-2 gap-16 items-center'>
            {/* Left Content - Typography Focus */}
            <div className='space-y-8'>
              {/* Modern Badge */}
              <div className='hero-badge inline-flex items-center space-x-3 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 px-6 py-3 rounded-2xl text-sm font-semibold border-purple-200/50 shadow-sm backdrop-blur-sm'>
                <div className='p-1 bg-white rounded-lg shadow-sm'>
                  <Brain className='w-4 h-4 text-purple-600' />
                </div>
                <span className='tracking-wide'>
                  AI-POWERED LEARNING PLATFORM
                </span>
              </div>

              {/* Modern Typography */}
              <div className='space-y-8'>
                <h1 className='hero-title text-5xl md:text-5xl lg:text-6xl font-medium text-gray-900 leading-[1.1] tracking-tight'>
                  Learn faster with{' '}
                  <span className='relative inline-block'>
                    <span className='bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 bg-clip-text text-transparent'>
                      AI-powered
                    </span>
                    <div className='absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-violet-400 rounded-full'></div>
                  </span>{' '}
                  course insights
                </h1>

                <p className='hero-subtitle text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl font-light'>
                  Get instant answers from programming course transcripts.
                  FlowMind&apos;s AI finds exactly what you need with{' '}
                  <span className='text-purple-600 font-medium'>
                    precise timestamps
                  </span>{' '}
                  and context.
                </p>
              </div>

              {/* Clean CTA Section */}
              <div className='space-y-4'>
                <div className='flex flex-col sm:flex-row gap-4'>
                  <SignUpButton
                    mode='modal'
                    appearance={clerkAppearance}>
                    <button className='group relative overflow-hidden bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 hover:from-purple-700 hover:via-violet-700 hover:to-purple-800 text-white px-6 py-3 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-2xl hover:shadow-purple-500/25 cursor-pointer'>
                      <div className='absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                      <span className='relative z-10'>
                        Start learning for free
                      </span>
                      <ArrowRight className='relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300' />
                      <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/50 to-violet-400/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10'></div>
                    </button>
                  </SignUpButton>
                </div>

                {/* <p className='text-sm text-gray-500'>
                  No credit card required • 61+ course segments available
                </p> */}
              </div>
            </div>

            {/* Right Content - Visual Demo */}
            <div className='relative'>
              {/* Clean Demo Card */}
              <div className='bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden'>
                {/* Simple Header */}
                <div className='bg-gray-50 px-6 py-4 border-b border-gray-200'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex space-x-2'>
                      <div className='w-3 h-3 bg-red-400 rounded-full'></div>
                      <div className='w-3 h-3 bg-yellow-400 rounded-full'></div>
                      <div className='w-3 h-3 bg-green-400 rounded-full'></div>
                    </div>
                    <div
                      className='text-sm font-medium text-gray-600'
                      style={{
                        fontFamily:
                          'Comfortaa, ui-rounded, ui-sans-serif, system-ui, sans-serif',
                      }}>
                      flowmind
                    </div>
                  </div>
                </div>

                {/* Clean Chat Interface */}
                <div className='p-6 space-y-4 bg-white min-h-[320px]'>
                  {/* User Question */}
                  <div className='flex justify-end'>
                    <div className='bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-3 rounded-2xl rounded-br-md max-w-xs text-sm'>
                      How do I implement authentication in Node.js?
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className='flex justify-start space-x-3'>
                    <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
                      <Brain className='w-4 h-4 text-purple-600' />
                    </div>
                    <div className='bg-gray-50 px-4 py-3 rounded-2xl rounded-bl-md max-w-md text-sm'>
                      <p className='text-gray-800 mb-3'>
                        I found detailed authentication implementation in our
                        Node.js course:
                      </p>

                      {/* Source Reference */}
                      <div className='bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2'>
                        <div className='flex items-center space-x-2 mb-1'>
                          <FileText className='w-4 h-4 text-purple-600' />
                          <span className='text-xs font-medium text-purple-800'>
                            Authentication Tutorial
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Clock className='w-3 h-3 text-purple-600' />
                          <span className='text-xs text-purple-700'>
                            Timestamp: 15:32
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Overleaf Inspired */}
      <section
        ref={howItWorksRef}
        className='py-20 bg-gray-50'>
        <div className='max-w-6xl mx-auto px-6 lg:px-8'>
          <div className='text-center mb-16 space-y-4'>
            <h2 className='text-3xl md:text-4xl font-light text-gray-900'>
              How it works
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed'>
              Simple steps to get instant answers from programming course
              content
            </p>
          </div>

          <div className='grid lg:grid-cols-2 gap-16 items-center'>
            {/* Steps */}
            <div className='space-y-8'>
              {workflowSteps.map((step, index) => (
                <div
                  key={index}
                  className={`workflow-step flex items-start space-x-4 p-6 rounded-2xl transition-all duration-500 ${
                    currentStep === index
                      ? 'bg-white shadow-lg border-2 border-purple-200'
                      : 'bg-white/50 hover:bg-white/80'
                  }`}>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <step.icon className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <span className='text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded'>
                        {step.step}
                      </span>
                      <h3 className='text-lg font-bold text-gray-900'>
                        {step.title}
                      </h3>
                    </div>
                    <p className='text-gray-600 mb-3'>{step.description}</p>
                    <div className='bg-gray-100 text-gray-700 text-sm px-3 py-2 rounded-lg font-mono'>
                      {step.demo}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Demo */}
            <div className='relative'>
              <div className='bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden'>
                <div className='bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white'>
                  <div className='flex items-center space-x-3 mb-4'>
                    <Search className='w-6 h-6' />
                    <h3 className='text-lg font-semibold'>
                      Transcript Search Demo
                    </h3>
                  </div>
                  <div className='bg-white/20 rounded-lg p-3'>
                    <p className='text-sm opacity-90'>
                      Searching through 50,000+ hours of programming tutorial
                      transcripts...
                    </p>
                  </div>
                </div>

                <div className='p-6 space-y-4'>
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer'>
                      <FileText className='w-5 h-5 text-blue-600' />
                      <div className='flex-1'>
                        <div className='text-sm font-medium text-gray-900'>
                          React Hooks Tutorial
                        </div>
                        <div className='text-xs text-gray-500'>
                          Timestamp: {(i + 1) * 12}:34
                        </div>
                      </div>
                      <Zap className='w-4 h-4 text-gray-400' />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features - Modern & Compact */}
      <section
        ref={featuresRef}
        className='py-16 bg-white relative overflow-hidden'>
        {/* Subtle Wave Background */}
        <div className='absolute inset-0 opacity-5'>
          <KnowledgeWaveAnimation />
        </div>

        <div className='max-w-6xl mx-auto px-6 lg:px-8 relative z-10'>
          <div className='text-center mb-12 space-y-4'>
            <h2 className='text-3xl md:text-4xl font-light text-gray-900'>
              Why choose flowmind?
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed'>
              Precision learning features designed for modern developers
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {keyFeatures.map((feature, index) => (
              <div
                key={index}
                className='feature-card group relative bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300'>
                <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors duration-300'>
                  <feature.icon className='w-5 h-5 text-purple-600' />
                </div>

                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  {feature.title}
                </h3>
                <p className='text-gray-600 text-sm mb-3 leading-relaxed'>
                  {feature.description}
                </p>

                <div className='inline-flex items-center text-xs font-medium text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200'>
                  <CheckCircle2 className='w-3 h-3 mr-1' />
                  {feature.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo - Compact */}
      <section
        ref={demoRef}
        className='py-16 bg-gray-50 relative overflow-hidden'>
        {/* Wave Animation Background */}
        <div className='absolute inset-0 opacity-8'>
          <KnowledgeWaveAnimation />
        </div>

        <div className='max-w-6xl mx-auto px-6 lg:px-8 relative z-10'>
          <div className='text-center mb-12 space-y-4'>
            <h2 className='text-3xl md:text-4xl font-light text-gray-900'>
              Try it yourself
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed'>
              Experience instant answers from programming course transcripts
            </p>
          </div>

          <div className='max-w-4xl mx-auto'>
            <div className='bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden'>
              <div className='bg-gradient-to-r from-purple-600 to-violet-600 text-white p-3 flex items-center space-x-3'>
                <Brain className='w-4 h-4' />
                <span
                  className='font-medium text-sm'
                  style={{
                    fontFamily:
                      'Comfortaa, ui-rounded, ui-sans-serif, system-ui, sans-serif',
                  }}>
                  flowmind demo
                </span>
              </div>

              <div className='p-6'>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  Popular questions
                </h3>
                <div className='grid md:grid-cols-2 gap-3'>
                  {testimonialQuestions.map((question, index) => (
                    <div
                      key={index}
                      className='demo-element group p-3 bg-gray-50 hover:bg-purple-50 rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer transition-all duration-300'>
                      <div className='flex items-center space-x-3'>
                        <MessageCircle className='w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors' />
                        <p className='text-sm text-gray-700 group-hover:text-gray-900 flex-1'>
                          {question}
                        </p>
                        <ChevronRight className='w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors' />
                      </div>
                    </div>
                  ))}
                </div>

                <div className='mt-6 text-center'>
                  <SignUpButton
                    mode='modal'
                    appearance={clerkAppearance}>
                    <button className='bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer'>
                      Try these questions free
                    </button>
                  </SignUpButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Modern & Compact */}
      <section
        ref={ctaRef}
        className='py-16 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 relative overflow-hidden'>
        {/* Subtle Wave Background */}
        <div className='absolute inset-0 opacity-10'>
          <KnowledgeWaveAnimation />
        </div>

        <div className='max-w-6xl mx-auto px-6 lg:px-8 text-center relative z-10'>
          <h2 className='text-3xl md:text-4xl font-light text-white mb-4'>
            Ready to transform your learning?
          </h2>
          <p className='text-lg text-purple-100 max-w-2xl mx-auto mb-8 leading-relaxed'>
            Get instant, precise answers from course transcripts with exact
            timestamps
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-8'>
            <SignUpButton
              mode='modal'
              appearance={clerkAppearance}>
              <button className='bg-white text-purple-600 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-3 cursor-pointer'>
                <span>Start learning free</span>
                <ArrowRight className='w-4 h-4' />
              </button>
            </SignUpButton>

            <button className='border-2 border-white text-white hover:bg-white hover:text-purple-600 px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-3 cursor-pointer'>
              <FileText className='w-4 h-4' />
              <span>View sample transcripts</span>
            </button>
          </div>

          <p className='text-purple-200 text-sm'>
            No credit card required • 61+ course segments available
          </p>
        </div>
      </section>

      {/* Footer - Compact */}
      <footer className='bg-gray-900 text-white py-12'>
        <div className='max-w-6xl mx-auto px-6 lg:px-8'>
          <div className='grid lg:grid-cols-2 gap-8 items-center'>
            <div className='space-y-4'>
              <div className='flex items-center space-x-3'>
                <FlowMindLogo
                  size={24}
                  animated={false}
                  className='w-7 h-7'
                />
                <div>
                  <span
                    className='text-xl font-medium font-comfortaa lowercase'
                    style={{
                      fontFamily:
                        'Comfortaa, ui-rounded, ui-sans-serif, system-ui, sans-serif',
                    }}>
                    flowmind
                  </span>
                  <div className='text-gray-400 text-xs'>
                    © 2025 AI-Powered Learning
                  </div>
                </div>
              </div>

              <div className='space-y-1'>
                <p className='text-gray-300 font-medium text-sm'>
                  Crafted with ❤️ by Sanjeev Saniel
                </p>
                <p className='text-gray-400 text-xs flex items-center space-x-2'>
                  <Brain className='w-3 h-3' />
                  <span>
                    Revolutionizing learning through AI transcript search
                  </span>
                </p>
              </div>
            </div>

            <div className='flex flex-wrap gap-3 justify-start lg:justify-end'>
              {[
                {
                  href: 'https://github.com/SanjeevSaniel',
                  icon: Github,
                  label: 'GitHub',
                },
                {
                  href: 'https://www.linkedin.com/in/sanjeevsaniel/',
                  icon: Linkedin,
                  label: 'LinkedIn',
                },
                {
                  href: 'https://x.com/SanjeevSaniel',
                  icon: X,
                  label: 'X.com',
                },
                {
                  href: 'https://github.com/SanjeevSaniel/flowmind-ai-chat',
                  icon: Code2,
                  label: 'Repository',
                },
              ].map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg text-gray-300 hover:text-white transition-all duration-300 text-sm'>
                  <link.icon className='w-4 h-4' />
                  <span className='text-sm font-medium'>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
