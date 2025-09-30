'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  FileText,
  Github,
  Heart,
  Linkedin,
  Loader2,
  MessageCircle,
  Search,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import NeruviBrandLogo from '../NeruviBrandLogo';
import KnowledgeWaveAnimation from './KnowledgeWaveAnimation';
import { PointerHighlight } from '@/components/ui/pointer-highlight';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Modern Clerk appearance configuration
// const clerkAppearance = {
//   elements: {
//     modalContent:
//       'bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-primary-200/50',
//     modalCloseButton:
//       'text-gray-400 hover:text-primary-600 transition-colors cursor-pointer',
//     headerTitle:
//       'text-3xl font-bold bg-gradient-to-r from-primary-500 to-secondary-900 bg-clip-text font-comfortaa lowercase tracking-tight',
//     socialButtonsBlockButton:
//       'relative overflow-hidden bg-white border-2 border-gray-200 hover:border-primary-300 rounded-2xl font-semibold transition-all duration-300 py-4 cursor-pointer group hover:shadow-lg',
//     socialButtonsBlockButtonText: 'relative z-10 font-semibold',
//     dividerLine:
//       'bg-gradient-to-r from-transparent via-primary-200 to-transparent',
//     dividerText: 'text-primary-500 font-medium text-sm bg-white px-4',
//     formFieldLabel: 'font-semibold text-sm tracking-wide',
//     formFieldInput:
//       'border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-0 focus:shadow-lg focus:shadow-primary-500/10 transition-all duration-300 py-4 bg-gray-50/50 focus:bg-white',
//     formButtonPrimary:
//       'relative overflow-hidden bg-gradient-to-r from-primary-500 via-secondary-900 to-primary-600 hover:from-primary-600 hover:via-secondary-800 hover:to-primary-700 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-primary-500/25 py-4 cursor-pointer group hover:scale-105',
//     footerActionLink:
//       'text-primary-600 hover:text-primary-700 font-semibold cursor-pointer transition-colors duration-200 hover:underline decoration-2 underline-offset-2',
//     userButtonPopoverActionButton:
//       'hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 hover:text-primary-700 rounded-2xl transition-all duration-200 cursor-pointer font-medium',
//     identityPreviewText: 'font-medium',
//     identityPreviewEditButtonIcon: 'text-primary-500 hover:text-primary-600',
//     formFieldSuccessText: 'text-primary-600 font-medium',
//     formFieldErrorText: 'text-red-500 font-medium',
//     // Hide the "You're signing back in to Clerk" text
//     headerSubtitle: 'hidden',
//     // Custom branding text
//     cardBox: 'shadow-none bg-transparent',
//     card: 'bg-transparent shadow-none',
//     rootBox: 'bg-transparent',
//   },
//   variables: {
//     colorPrimary: '#4ea674',
//     colorBackground: '#ffffff',
//     colorInputBackground: 'rgba(249, 250, 251, 0.5)',
//     colorInputText: '#374151',
//     colorText: '#374151',
//     colorTextSecondary: '#6b7280',
//     borderRadius: '16px',
//     fontFamily: "'Figtree', ui-sans-serif, system-ui, sans-serif",
//     fontSize: '16px',
//     spacingUnit: '1.25rem',
//   },
// };

export default function TranscriptLearningLanding() {
  const [isNavigating, setIsNavigating] = useState(false);
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
      color: 'from-primary-500 to-secondary-900',
      demo: 'How do I implement authentication in Node.js?',
    },
    {
      step: '02',
      title: 'AI Searches Transcripts',
      description:
        'QdrantDB finds relevant moments across all indexed transcript content',
      icon: Search,
      color: 'from-primary-500 to-secondary-900',
      demo: 'Searching 10,000+ transcript segments...',
    },
    {
      step: '03',
      title: 'Get Timestamped Content',
      description:
        'Receive precise answers with exact transcript timestamps and context',
      icon: Clock,
      color: 'from-primary-500 to-secondary-900',
      demo: 'Found in "Node.js Auth Tutorial" at 12:34',
    },
    {
      step: '04',
      title: 'Read Full Context',
      description:
        'Access the complete transcript section for comprehensive understanding',
      icon: FileText,
      color: 'from-primary-500 to-secondary-900',
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
      {/* Navigation */}
      <nav className='sticky top-0 z-50 bg-white/95 backdrop-blur-sm'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <NeruviBrandLogo
              size='md'
              showIcon={true}
              showTagline={false}
            />

            <div className='flex items-center space-x-6'>
              <Link
                href='https://github.com/SanjeevSaniel/flowmind-ai-chat'
                className='flex items-center space-x-2 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50'
                style={{ color: '#4ea674' }}>
                <Github className='w-4 h-4' />
                <span className='hidden sm:inline font-medium'>GitHub</span>
              </Link>
              <Link href='/sign-in'>
                <Button className='relative overflow-hidden bg-[#4ea674] hover:bg-[#5cbb85] px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer group'>
                  <div className='absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                  <span className='relative z-10 text-sm'>Sign In</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className='relative bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/40 pt-16 pb-24 overflow-hidden'>
        {/* Dynamic Background Elements */}
        <div className='absolute inset-0 overflow-hidden'>
          <KnowledgeWaveAnimation className='opacity-40' />
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary-400/25 to-secondary-400/25 rounded-full blur-3xl animate-pulse' />
          <div
            className='absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-gradient-to-r from-secondary-400/20 to-primary-400/20 rounded-full blur-3xl animate-pulse'
            style={{ animationDelay: '2s' }}
          />
          <div
            className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[24rem] h-[24rem] bg-gradient-to-r from-primary-300/15 to-secondary-300/15 rounded-full blur-3xl animate-pulse'
            style={{ animationDelay: '4s' }}
          />
        </div>

        <div className='max-w-7xl mx-auto px-6 lg:px-8 relative z-10'>
          {/* Clean, Focused Layout */}
          <div className='grid lg:grid-cols-2 gap-16 items-center'>
            {/* Left Content - Typography Focus */}
            <div className='space-y-6'>
              {/* Modern Badge */}
              <div className='hero-badge inline-flex items-center space-x-3 bg-gradient-to-r from-primary-100 via-secondary-100 to-primary-200 text-[#374151] px-4 py-2 rounded-full text-xs font-bold shadow-md backdrop-blur-sm hover:shadow-xl transition-all duration-300'>
                <div className='p-2 bg-white rounded-full shadow-md'>
                  <Brain className='w-3 h-3 text-primary-600' />
                </div>
                <span className='tracking-wider'>
                  AI-POWERED LEARNING PLATFORM
                </span>
              </div>

              {/* Modern Typography */}
              <div className='space-y-6'>
                <h1
                  className='hero-title text-4xl md:text-5xl lg:text-6xl font-light leading-[1.15] tracking-tight'
                  style={{ color: '#459071' }}>
                  The home of{' '}
                  <PointerHighlight
                    rectangleClassName='bg-gradient-to-r from-primary-100 to-secondary-100 dark:bg-gradient-to-r dark:from-primary-900 dark:to-secondary-900 border-primary-300 dark:border-primary-600 leading-loose'
                    pointerClassName='text-primary-500 h-4 w-4'
                    containerClassName='inline-block mx-1'>
                    <span className='relative z-10 bg-gradient-to-r from-primary-500 via-secondary-900 to-primary-600 text-foreground font-bold font-comfortaa'>
                      AI-powered
                    </span>
                  </PointerHighlight>{' '}
                  learning
                </h1>

                <p
                  className='hero-subtitle text-lg md:text-xl leading-relaxed max-w-2xl font-light mt-6'
                  style={{ color: '#374151' }}>
                  Access precise answers from extensive programming course
                  transcripts. Neruvi delivers contextual insights with{' '}
                  <span className='text-primary-700 font-medium bg-gradient-to-r from-primary-50 to-secondary-50 px-2 py-1 rounded-md'>
                    exact timestamps
                  </span>{' '}
                  and comprehensive understanding.
                </p>
              </div>

              {/* Clean CTA Section */}
              <div className='space-y-4'>
                <div className='flex flex-col sm:flex-row gap-4'>
                  <Link href='/sign-up'>
                    <Button
                      onClick={() => setIsNavigating(true)}
                      disabled={isNavigating}
                      size="lg"
                      className='group relative overflow-hidden text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-500 ease-out flex items-center justify-center space-x-3 shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-100 cursor-pointer transform disabled:opacity-75 disabled:cursor-not-allowed'
                      style={{
                        background:
                          'linear-gradient(135deg, #4ea674 0%, #459071 50%, #5fad81 100%)',
                        boxShadow:
                          '0 20px 60px -10px rgba(78, 166, 116, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                      }}>
                      {/* Shimmer effect */}
                      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out'></div>

                      {/* Overlay gradient */}
                      <div className='absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out'></div>

                      {isNavigating ? (
                        <>
                          <Loader2 className='relative z-10 w-5 h-5 animate-spin' style={{ color: 'white' }} />
                          <span className='relative z-10'>Loading...</span>
                        </>
                      ) : (
                        <>
                          <span className='relative z-10 transition-all duration-300 group-hover:tracking-wide'>
                            Start learning
                          </span>
                          <ArrowRight
                            className='relative z-10 w-5 h-5 transition-all duration-500 ease-out group-hover:translate-x-2 group-hover:scale-110'
                            style={{ color: 'white' }}
                          />
                        </>
                      )}

                      {/* Outer glow */}
                      <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/40 to-green-400/40 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out -z-10 scale-95 group-hover:scale-110'></div>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            {/* Right Content - Visual Demo */}
            <div className='relative'>
              {/* Clean Demo Card */}
              <div className='bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary-200/50 overflow-hidden hover:shadow-primary-500/10 transition-all duration-500 hover:scale-[1.02]'>
                {/* Simple Header */}
                <div className='bg-gradient-to-r from-primary-50 to-secondary-50 px-6 py-4 border-b border-primary-200/50'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex space-x-2'>
                      <div className='w-3 h-3 bg-red-400 rounded-full'></div>
                      <div className='w-3 h-3 bg-yellow-400 rounded-full'></div>
                      <div className='w-3 h-3 bg-green-400 rounded-full'></div>
                    </div>
                    <div
                      className='text-sm font-medium lowercase tracking-wide'
                      style={{
                        fontFamily:
                          'Comfortaa, ui-rounded, ui-sans-serif, system-ui, sans-serif !important',
                        color: '#4ea674',
                      }}>
                      neruvi
                    </div>
                  </div>
                </div>

                {/* Clean Chat Interface */}
                <div className='p-4 space-y-4 bg-white min-h-[280px]'>
                  {/* User Question */}
                  <div className='flex justify-end'>
                    <div
                      className='bg-gradient-to-r from-primary-500 via-secondary-900 to-primary-600 px-5 py-3 rounded-2xl rounded-br-md max-w-xs text-sm font-medium shadow-lg'
                      style={{ color: '#4b5563' }}>
                      How do I implement authentication in Node.js?
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className='flex justify-start space-x-3'>
                    <div className='w-10 h-10 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-md'>
                      <Brain className='w-5 h-5 text-[#1f2937]' />
                    </div>
                    <div className='bg-gradient-to-r from-gray-50 to-primary-50/30 px-5 py-4 rounded-2xl rounded-bl-md max-w-md text-sm border border-primary-100/50 shadow-sm'>
                      <p
                        className='mb-4 font-medium'
                        style={{ color: '#1f2937' }}>
                        I found detailed authentication implementation in our
                        Node.js course:
                      </p>

                      {/* Source Reference */}
                      <div className='bg-gradient-to-r from-primary-100 to-secondary-100 border border-primary-300/50 text-[#4b5563] rounded-xl p-4 mb-2 shadow-sm'>
                        <div className='flex items-center space-x-2 mb-2'>
                          <FileText className='w-5 h-5 text-primary-700' />
                          <span className='text-sm font-bold text-primary-800'>
                            Authentication Tutorial
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Clock className='w-4 h-4 text-primary-600' />
                          <span className='text-sm text-primary-700 font-semibold'>
                            Timestamp: 15:32
                          </span>
                          <button className='ml-auto'>
                            <FileText className='w-4 h-4 text-primary-600 hover:text-primary-800 transition-colors' />
                          </button>
                        </div>
                      </div>

                      {/* Transcript Preview */}
                      <div className='bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2'>
                        <p
                          className='text-xs font-mono leading-relaxed'
                          style={{ color: '#4b5563' }}>
                          &quot;Now let&apos;s implement JWT authentication.
                          First, we&apos;ll create middleware to verify tokens.
                          Install jsonwebtoken package, then create a function
                          that checks the Authorization header...&quot;
                        </p>
                      </div>

                      <p
                        className='text-xs'
                        style={{ color: '#459071' }}>
                        The transcript covers middleware setup, token
                        generation, and route protection with practical
                        examples.
                      </p>
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  <div className='flex justify-start space-x-3'>
                    <div className='w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-900 rounded-full flex items-center justify-center'>
                      <div className='flex space-x-1'>
                        <div className='w-1 h-1 bg-white rounded-full animate-pulse'></div>
                        <div
                          className='w-1 h-1 bg-white rounded-full animate-pulse'
                          style={{ animationDelay: '0.2s' }}></div>
                        <div
                          className='w-1 h-1 bg-white rounded-full animate-pulse'
                          style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                    <div className='bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md'>
                      <p
                        className='text-sm'
                        style={{ color: '#4ea674' }}>
                        AI is analyzing transcripts...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        ref={howItWorksRef}
        className='py-24 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2
              className='text-4xl md:text-5xl font-medium mb-6'
              style={{ color: '#459071' }}>
              How Neruvi Works
            </h2>
            <p
              className='text-xl max-w-3xl mx-auto'
              style={{ color: '#374151' }}>
              Our AI-powered system transforms how you learn from transcript
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
                      ? 'bg-white shadow-lg border-2 border-primary-200'
                      : 'bg-white/50 hover:bg-white/80'
                  }`}>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <step.icon
                      className='w-6 h-6'
                      style={{ color: '#394150' }}
                    />
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <span
                        className='text-xs font-bold px-2 py-1 rounded'
                        style={{
                          color: '#459071',
                          backgroundColor: '#f0f9f3',
                        }}>
                        {step.step}
                      </span>
                      <h3
                        className='text-lg font-bold'
                        style={{ color: '#459071' }}>
                        {step.title}
                      </h3>
                    </div>
                    <p
                      className='mb-3'
                      style={{ color: '#4b5563' }}>
                      {step.description}
                    </p>
                    <div
                      className='bg-gray-100 text-sm px-3 py-2 rounded-lg font-mono'
                      style={{ color: '#459071' }}>
                      {step.demo}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Demo */}
            <div className='relative'>
              <div className='bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden'>
                <div
                  className='bg-gradient-to-r from-primary-500 to-secondary-900 p-6'
                  style={{ color: '#459071' }}>
                  <div className='flex items-center space-x-3 mb-4'>
                    <Search
                      className='w-6 h-6'
                      style={{ color: '#459071' }}
                    />
                    <h3 className='text-lg font-medium'>
                      Transcript Search Demo
                    </h3>
                  </div>
                  <div className='bg-white/20 rounded-lg p-3'>
                    <p className='text-sm text-[#4d5562] opacity-90'>
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
                      <FileText
                        className='w-5 h-5 text-primary-600'
                        style={{ color: '#394150' }}
                      />
                      <div className='flex-1'>
                        <div
                          className='text-sm font-medium'
                          style={{ color: '#459071' }}>
                          React Hooks Tutorial
                        </div>
                        <div
                          className='text-xs'
                          style={{ color: '#6b7280' }}>
                          Timestamp: {(i + 1) * 12}:34
                        </div>
                      </div>
                      <Zap
                        className='w-4 h-4'
                        style={{ color: '#459071' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section
        ref={featuresRef}
        className='py-24 bg-white'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2
              className='text-4xl md:text-5xl font-medium mb-6'
              style={{ color: '#459071' }}>
              Why Choose Neruvi?
            </h2>
            <p
              className='text-xl max-w-3xl mx-auto'
              style={{ color: '#374151' }}>
              Revolutionary features that make learning from transcripts
              effortless and efficient
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {keyFeatures.map((feature, index) => (
              <div
                key={index}
                className='feature-card group relative bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300'>
                <div className='w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300'>
                  <feature.icon
                    className='w-6 h-6'
                    style={{ color: '#4b5563' }}
                  />
                </div>

                <h3
                  className='text-lg font-bold mb-3'
                  style={{ color: '#459071' }}>
                  {feature.title}
                </h3>
                <p
                  className='text-sm mb-4'
                  style={{ color: '#4b5563' }}>
                  {feature.description}
                </p>

                <div className='inline-flex items-center text-xs font-semibold text-[#4b5563] bg-primary-50 px-3 py-1 rounded-full'>
                  <CheckCircle2 className='w-3 h-3 mr-1' />
                  {feature.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      {/* <section
        ref={demoRef}
        className='py-24 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl md:text-5xl font-bold mb-6' style={{color: '#459071'}}>
              Try It Yourself
            </h2>
            <p className='text-xl max-w-3xl mx-auto' style={{color: '#374151'}}>
              See how Neruvi answers common programming questions with
              transcript timestamps
            </p>
          </div>

          <div className='max-w-4xl mx-auto'>
            <div className='bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden'>
              <div className='bg-gray-900 p-4 flex items-center space-x-3' style={{color: 'white'}}>
                <Terminal className='w-5 h-5' style={{color: '#459071'}} />
                <span className='font-mono text-sm'>
                  Neruvi Interactive Demo
                </span>
              </div>

              <div className='p-8'>
                <h3 className='text-lg font-semibold mb-6' style={{color: '#459071'}}>
                  Popular Questions
                </h3>
                <div className='grid md:grid-cols-2 gap-4'>
                  {testimonialQuestions.map((question, index) => (
                    <div
                      key={index}
                      className='demo-element group p-4 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-300'>
                      <div className='flex items-center space-x-3'>
                        <MessageCircle className='w-4 h-4 transition-colors' style={{color: '#459071'}} />
                        <p className='text-sm' style={{color: '#4b5563'}}>
                          {question}
                        </p>
                        <ChevronRight className='w-4 h-4 ml-auto transition-colors' style={{color: '#459071'}} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className='mt-8 text-center'>
                  <SignUpButton 
                    mode='modal'
                    appearance={clerkAppearance}
>
                    <button className='px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg' style={{background: 'linear-gradient(to right, #4ea674, #459071)', color: 'white'}}>
                      Try These Questions Free
                    </button>
                  </SignUpButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Final CTA */}
      <section
        ref={ctaRef}
        className='py-24 bg-gradient-to-r from-primary-500 to-secondary-900'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8 text-center'>
          <h2 className='text-4xl md:text-5xl text-[#459071] font-medium mb-6'>
            Ready to Transform Your Learning?
          </h2>
          <p className='text-xl text-[#394150] max-w-3xl mx-auto mb-12'>
            Stop wasting time searching through hours of content. Get instant,
            precise answers from detailed transcripts with exact timestamps.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-12'>
            <Link href='/sign-up'>
              <Button
                onClick={(e) => {
                  const target = e.currentTarget;
                  target.classList.add('pointer-events-none', 'opacity-75');
                  const textSpan = target.querySelector('.button-text');
                  const arrow = target.querySelector('.button-arrow');
                  const loader = target.querySelector('.button-loader');
                  if (textSpan && arrow && loader) {
                    textSpan.classList.add('opacity-0');
                    arrow.classList.add('opacity-0');
                    loader.classList.remove('hidden');
                    loader.classList.add('flex');
                  }
                }}
                className='group relative overflow-hidden text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-500 ease-out flex items-center justify-center space-x-3 shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-100 cursor-pointer transform'
                style={{
                  background:
                    'linear-gradient(135deg, #4ea674 0%, #459071 50%, #5fad81 100%)',
                  boxShadow:
                    '0 20px 60px -10px rgba(78, 166, 116, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                }}>
                {/* Shimmer effect */}
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out'></div>

                {/* Overlay gradient */}
                <div className='absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out'></div>

                <span className='button-text relative z-10 transition-all duration-300 group-hover:tracking-wide'>
                  Start learning
                </span>
                <ArrowRight
                  className='button-arrow relative z-10 w-5 h-5 transition-all duration-500 ease-out group-hover:translate-x-2 group-hover:scale-110'
                  style={{ color: 'white' }}
                />

                {/* Loading spinner */}
                <div className='button-loader absolute inset-0 hidden items-center justify-center z-10'>
                  <div className='w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin'></div>
                </div>

                {/* Outer glow */}
                <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/40 to-green-400/40 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out -z-10 scale-95 group-hover:scale-110'></div>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Compact Footer */}
      <footer
        className='bg-gray-900 py-8'
        style={{ color: 'white' }}>
        <div className='max-w-7xl mx-auto px-6 lg:px-8 '>
          {/* Main content row */}
          <div className='flex flex-col lg:flex-row items-center justify-between gap-6 mb-6'>
            <div className='flex flex-col items-start'>
              <NeruviBrandLogo
                size='sm'
                showIcon={true}
                showTagline={false}
                variant='light'
              />
              <p className='text-xs text-white/60 flex items-center gap-1.5 ml-1'>
                <FileText className='w-3 h-3' />
                Revolutionizing learning through AI
              </p>
            </div>

            {/* Social links - compact icons only */}
            <div className='flex items-center gap-3'>
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
                  title={link.label}
                  className='p-2.5 rounded-lg transition-all duration-300 hover:scale-110'
                  style={{
                    backgroundColor: 'rgba(69, 144, 113, 0.2)',
                    color: '#4ea674',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#459071';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'rgba(69, 144, 113, 0.2)';
                    e.currentTarget.style.color = '#4ea674';
                  }}>
                  <link.icon className='w-4 h-4' />
                </Link>
              ))}
            </div>
          </div>

          <Separator className='mb-2' />

          <div className='flex justify-between items-center'>
            <div className='flex flex-col items-center lg:items-start gap-1'>
              <p className='flex text-sm font-medium text-white/50'>
                Crafted with{' '}
                <span className='mx-1 mt-0.5'>
                  <Heart size={14} />
                </span>{' '}
                by Sanjeev Saniel
              </p>
            </div>

            {/* Copyright - single line */}
            <div className='text-center'>
              <p className='text-xs text-white/50'>
                © {new Date().getFullYear()} Neruvi. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
