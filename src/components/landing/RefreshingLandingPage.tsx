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
  PlayCircle,
  Search,
  Sparkles,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import FlowMindLogo from '../FlowMindLogo';
import KnowledgeWaveAnimation from './KnowledgeWaveAnimation';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

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
      {/* Navigation */}
      <nav className='sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center space-x-3'>
              <FlowMindLogo
                size={28}
                animated={true}
                className='w-8 h-8'
              />
              <div>
                <span className='text-xl font-bold text-gray-900 font-comfortaa lowercase' style={{ fontFamily: 'Comfortaa, ui-rounded, ui-sans-serif, system-ui, sans-serif' }}>
                  flowmind
                </span>
                <div className='text-xs text-gray-500 font-medium'>
                  AI Powered Learning
                </div>
              </div>
            </div>

            <div className='flex items-center space-x-6'>
              <Link
                href='https://github.com/SanjeevSaniel/flowmind-ai-chat'
                className='flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50'>
                <Github className='w-4 h-4' />
                <span className='hidden sm:inline font-medium'>GitHub</span>
              </Link>

              <SignInButton mode='modal'>
                <button className='text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 font-medium'>
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className='relative bg-gradient-to-b from-blue-50 via-purple-50/30 to-white pt-20 pb-32 overflow-hidden'>
        
        {/* Knowledge Wave Background Animation */}
        <KnowledgeWaveAnimation className="opacity-40" />
        
        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/80 pointer-events-none" />
        
        <div className='max-w-7xl mx-auto px-6 lg:px-8 relative z-10'>
          <div className='text-center mb-16'>
            {/* Enhanced Badge */}
            <div className='hero-badge inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-lg backdrop-blur-sm border border-blue-200/50'>
              <Brain className='w-4 h-4' />
              <span>AI-Powered Knowledge Discovery Platform</span>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse ml-1" />
            </div>

            {/* Enhanced Main Title */}
            <h1 className='hero-title text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-8'>
              Transform Knowledge Into
              <br />
              <span className='bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'>
                Instant Understanding
              </span>
            </h1>

            {/* Enhanced Subtitle */}
            <p className='hero-subtitle text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-12'>
              Experience the future of learning with AI that understands your questions and delivers 
              <span className="font-semibold text-purple-700"> precise answers from curated course content</span> with 
              exact timestamps. No more endless searching - just pure, focused learning.
            </p>

            {/* Enhanced CTA Buttons */}
            <div className='hero-buttons flex flex-col sm:flex-row gap-4 justify-center items-center mb-16'>
              <SignUpButton mode='modal'>
                <button className='group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-3'>
                  <Brain className='w-5 h-5 group-hover:scale-110 transition-transform' />
                  <span>Start Learning with AI</span>
                  <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                </button>
              </SignUpButton>

              <button className='group flex items-center space-x-3 px-8 py-4 border-2 border-purple-200 text-purple-700 hover:border-purple-300 hover:bg-purple-50 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm'>
                <PlayCircle className='w-5 h-5 group-hover:scale-110 transition-transform' />
                <span>Experience Demo</span>
                <Sparkles className='w-4 h-4 opacity-60' />
              </button>
            </div>

            {/* Knowledge Flow Indicators */}
            <div className="flex justify-center items-center space-x-8 mb-8">
              {[
                { icon: Database, label: "Course Content", count: "61+" },
                { icon: Brain, label: "AI Processing", count: "24/7" },
                { icon: Clock, label: "Instant Answers", count: "<2s" }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-md">
                    <item.icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-700">{item.count}</div>
                    <div className="text-xs text-gray-600 font-medium">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Demo Preview */}
            <div className='hero-demo max-w-4xl mx-auto'>
              <div className='bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden'>
                {/* Chat Interface Header */}
                <div className='bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center space-x-3'>
                  <div className='flex space-x-2'>
                    <div className='w-3 h-3 bg-red-400 rounded-full'></div>
                    <div className='w-3 h-3 bg-yellow-400 rounded-full'></div>
                    <div className='w-3 h-3 bg-green-400 rounded-full'></div>
                  </div>
                  <div className='text-sm font-medium text-gray-600'>
                    FlowMind AI Chat
                  </div>
                </div>

                {/* Chat Demo */}
                <div className='p-6 space-y-4 bg-gradient-to-br from-gray-50 to-white min-h-[300px]'>
                  {/* User Question */}
                  <div className='flex justify-end mb-4'>
                    <div className='bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-br-md max-w-xs'>
                      <p className='text-sm'>
                        How do I implement JWT authentication in Express.js?
                      </p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className='flex justify-start space-x-3'>
                    <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0'>
                      <Brain className='w-4 h-4 text-white' />
                    </div>
                    <div className='bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md max-w-md shadow-sm'>
                      <p className='text-sm text-gray-800 mb-3'>
                        I found the perfect explanation for JWT authentication
                        in Express.js! Here&apos;s what the tutorial covers:
                      </p>

                      {/* Transcript Reference */}
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2'>
                        <div className='flex items-center space-x-2 mb-2'>
                          <FileText className='w-4 h-4 text-blue-600' />
                          <span className='text-xs font-semibold text-blue-800'>
                            Express.js Authentication Tutorial
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Clock className='w-3 h-3 text-blue-600' />
                          <span className='text-xs text-blue-700'>
                            Transcript at 15:32 - JWT Implementation
                          </span>
                          <button className='ml-auto'>
                            <FileText className='w-4 h-4 text-blue-600 hover:text-blue-800 transition-colors' />
                          </button>
                        </div>
                      </div>

                      {/* Transcript Preview */}
                      <div className='bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2'>
                        <p className='text-xs text-gray-700 font-mono leading-relaxed'>
                          &quot;Now let&apos;s implement JWT authentication.
                          First, we&apos;ll create middleware to verify tokens.
                          Install jsonwebtoken package, then create a function
                          that checks the Authorization header...&quot;
                        </p>
                      </div>

                      <p className='text-xs text-gray-600'>
                        The transcript covers middleware setup, token
                        generation, and route protection with practical
                        examples.
                      </p>
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  <div className='flex justify-start space-x-3'>
                    <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
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
                      <p className='text-sm text-gray-500'>
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
            <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
              How FlowMind Works
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
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
                      ? 'bg-white shadow-lg border-2 border-blue-200'
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

      {/* Key Features */}
      <section
        ref={featuresRef}
        className='py-24 bg-white'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
              Why Choose FlowMind?
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              Revolutionary features that make learning from transcripts
              effortless and efficient
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {keyFeatures.map((feature, index) => (
              <div
                key={index}
                className='feature-card group relative bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300'>
                <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300'>
                  <feature.icon className='w-6 h-6 text-white' />
                </div>

                <h3 className='text-lg font-bold text-gray-900 mb-3'>
                  {feature.title}
                </h3>
                <p className='text-gray-600 text-sm mb-4'>
                  {feature.description}
                </p>

                <div className='inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full'>
                  <CheckCircle2 className='w-3 h-3 mr-1' />
                  {feature.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section
        ref={demoRef}
        className='py-24 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
              Try It Yourself
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              See how FlowMind answers common programming questions with
              transcript timestamps
            </p>
          </div>

          <div className='max-w-4xl mx-auto'>
            <div className='bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden'>
              <div className='bg-gray-900 text-white p-4 flex items-center space-x-3'>
                <Terminal className='w-5 h-5' />
                <span className='font-mono text-sm'>
                  FlowMind Interactive Demo
                </span>
              </div>

              <div className='p-8'>
                <h3 className='text-lg font-semibold text-gray-900 mb-6'>
                  Popular Questions
                </h3>
                <div className='grid md:grid-cols-2 gap-4'>
                  {testimonialQuestions.map((question, index) => (
                    <div
                      key={index}
                      className='demo-element group p-4 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-300'>
                      <div className='flex items-center space-x-3'>
                        <MessageCircle className='w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors' />
                        <p className='text-sm text-gray-700 group-hover:text-gray-900'>
                          {question}
                        </p>
                        <ChevronRight className='w-4 h-4 text-gray-300 group-hover:text-blue-500 ml-auto transition-colors' />
                      </div>
                    </div>
                  ))}
                </div>

                <div className='mt-8 text-center'>
                  <SignUpButton mode='modal'>
                    <button className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg'>
                      Try These Questions Free
                    </button>
                  </SignUpButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        ref={ctaRef}
        className='py-24 bg-gradient-to-r from-blue-600 to-purple-600'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8 text-center'>
          <h2 className='text-4xl md:text-5xl font-bold text-white mb-6'>
            Ready to Transform Your Learning?
          </h2>
          <p className='text-xl text-blue-100 max-w-3xl mx-auto mb-12'>
            Stop wasting time searching through hours of content. Get instant,
            precise answers from detailed transcripts with exact timestamps.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-12'>
            <SignUpButton mode='modal'>
              <button className='bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-3'>
                <span>Start Learning Free</span>
                <ArrowRight className='w-5 h-5' />
              </button>
            </SignUpButton>

            <button className='border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-3'>
              <FileText className='w-5 h-5' />
              <span>View Sample Transcripts</span>
            </button>
          </div>

          <p className='text-blue-200 text-sm'>
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 text-white py-16'>
        <div className='max-w-7xl mx-auto px-6 lg:px-8'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            <div className='space-y-6'>
              <div className='flex items-center space-x-3'>
                <FlowMindLogo
                  size={28}
                  animated={false}
                  className='w-8 h-8'
                />
                <div>
                  <span className='text-2xl font-bold font-comfortaa lowercase' style={{ fontFamily: 'Comfortaa, ui-rounded, ui-sans-serif, system-ui, sans-serif' }}>flowmind</span>
                  <div className='text-gray-400 text-sm'>
                    © 2025 Transcript Learning AI
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <p className='text-gray-300 font-semibold'>
                  Crafted with ❤️ by Sanjeev Saniel
                </p>
                <p className='text-gray-400 flex items-center space-x-2'>
                  <FileText className='w-4 h-4' />
                  <span>
                    Revolutionizing transcript-based learning through AI
                  </span>
                </p>
              </div>
            </div>

            <div className='flex flex-wrap gap-4 justify-start lg:justify-end'>
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
                  className='flex items-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg text-gray-300 hover:text-white transition-all duration-300'>
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
