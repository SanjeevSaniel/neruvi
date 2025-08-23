'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  Code2, 
  MessageSquare, 
  Zap, 
  BookOpen, 
  Users, 
  ArrowRight,
  CheckCircle,
  Play,
  Github,
  Star,
  Download
} from 'lucide-react';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Advanced RAG system with semantic search and HyDE enhancement",
      color: "from-purple-400 to-pink-400"
    },
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "Streaming responses with expandable message details",
      color: "from-blue-400 to-cyan-400"
    },
    {
      icon: Code2,
      title: "Course-Specific",
      description: "Node.js and Python content with timestamp references",
      color: "from-green-400 to-emerald-400"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized vector search with instant context retrieval",
      color: "from-yellow-400 to-orange-400"
    }
  ];

  const stats = [
    { label: "Course Chunks", value: "61+", icon: BookOpen },
    { label: "AI Models", value: "2", icon: Brain },
    { label: "Response Time", value: "<2s", icon: Zap },
    { label: "Accuracy", value: "94%", icon: CheckCircle }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between p-6 lg:px-8"
      >
        <div className="flex items-center space-x-3">
          <motion.div
            animate={floatingVariants.animate}
            className="w-10 h-10 bg-gradient-to-br from-white via-violet-100 to-indigo-100 rounded-xl flex items-center justify-center shadow-lg"
          >
            <Image
              src="/flowmind-logo-2.png"
              alt="FlowMind Logo"
              width={32}
              height={32}
              className="drop-shadow-sm"
            />
          </motion.div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            FlowMind
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link 
            href="https://github.com/your-username/flowmind" 
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          >
            <Github className="w-5 h-5" />
            <span className="hidden sm:inline">GitHub</span>
          </Link>
          <SignInButton mode="modal">
            <button className="text-slate-300 hover:text-white transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 px-6 lg:px-8 pt-20 pb-32"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              variants={itemVariants}
              className="flex justify-center mb-8"
            >
              <motion.div
                animate={floatingVariants.animate}
                className="relative"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Brain className="w-12 h-12 text-white" />
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-purple-400 rounded-3xl blur-lg"
                />
              </motion.div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold mb-8 leading-tight"
            >
              <span className="bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                Master Programming
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                with AI Precision
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              FlowMind transforms your learning experience with{" "}
              <span className="text-purple-300 font-semibold">advanced RAG technology</span>,{" "}
              <span className="text-blue-300 font-semibold">real-time streaming</span>, and{" "}
              <span className="text-pink-300 font-semibold">intelligent course navigation</span>.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <SignUpButton mode="modal">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold text-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                >
                  <span className="flex items-center space-x-2">
                    <span>Start Learning</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity" />
                </motion.button>
              </SignUpButton>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center space-x-2 px-8 py-4 border border-purple-400/30 rounded-xl font-semibold text-lg hover:bg-purple-500/10 transition-all duration-300"
              >
                <Play className="w-5 h-5" />
                <span>Watch Demo</span>
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-center justify-center mb-3">
                    <stat.icon className="w-6 h-6 text-purple-300" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 px-6 lg:px-8 py-32 bg-black/20 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Experience the next generation of learning with cutting-edge technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className={`group relative p-6 rounded-2xl bg-gradient-to-br ${
                  currentFeature === index ? feature.color : 'from-white/5 to-white/10'
                } backdrop-blur-sm border border-white/10 transition-all duration-700`}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    currentFeature === index ? 'bg-white/20' : 'bg-purple-500/20'
                  }`}>
                    <feature.icon className={`w-6 h-6 ${
                      currentFeature === index ? 'text-white' : 'text-purple-300'
                    }`} />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                
                {currentFeature === index && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2"
                  >
                    <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Sparkles className="w-2 h-2 text-yellow-900" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 px-6 lg:px-8 py-32"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-slate-300 mb-12">
            Join thousands of developers mastering programming with AI-powered precision
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <SignUpButton mode="modal">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-12 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-purple-500/30 transition-all duration-300"
              >
                <span className="flex items-center space-x-3">
                  <Brain className="w-6 h-6" />
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity" />
              </motion.button>
            </SignUpButton>

            <div className="flex items-center space-x-2 text-slate-400">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                ))}
              </div>
              <span className="text-sm">Join 1,000+ learners</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <Image
              src="/flowmind-logo-2.png"
              alt="FlowMind"
              width={24}
              height={24}
            />
            <span className="text-slate-400">© 2025 FlowMind. All rights reserved.</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link href="#" className="text-slate-400 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-slate-400 hover:text-white transition-colors">
              Terms
            </Link>
            <Link 
              href="https://github.com/your-username/flowmind" 
              className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}