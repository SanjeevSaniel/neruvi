#!/usr/bin/env node
/**
 * Generate FlowMind Architecture Diagram using SVG
 * Creates a visual representation of the FlowMind app architecture
 */

const fs = require('fs');
const path = require('path');

// SVG template for the architecture diagram
const svgDiagram = `
<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="frontendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#E8F4FD;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#BBDEFB;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="stateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#FFF3E0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFCC02;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="apiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#E8F5E8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#A5D6A7;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#F3E5F5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#CE93D8;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="dataGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#FFF8E1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFEB3B;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Title -->
  <text x="600" y="30" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #2D3748;">🧠 FlowMind Architecture Flow</text>
  
  <!-- Frontend Layer -->
  <rect x="50" y="60" width="1100" height="100" rx="10" fill="url(#frontendGrad)" stroke="#1976D2" stroke-width="2"/>
  <text x="70" y="85" style="font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #1976D2;">🎨 FRONTEND LAYER</text>
  
  <!-- Frontend Components -->
  <rect x="70" y="100" width="160" height="40" rx="5" fill="#FFFFFF" stroke="#1976D2" stroke-width="1"/>
  <text x="150" y="125" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #1976D2;">ChatInterface 🎨</text>
  
  <rect x="250" y="100" width="160" height="40" rx="5" fill="#FFFFFF" stroke="#1976D2" stroke-width="1"/>
  <text x="330" y="125" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #1976D2;">WelcomeScreen 🏠</text>
  
  <rect x="430" y="100" width="160" height="40" rx="5" fill="#FFFFFF" stroke="#1976D2" stroke-width="1"/>
  <text x="510" y="125" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #1976D2;">CourseSelector 📚</text>
  
  <rect x="610" y="100" width="160" height="40" rx="5" fill="#FFFFFF" stroke="#1976D2" stroke-width="1"/>
  <text x="690" y="125" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #1976D2;">MessagesContainer 💭</text>
  
  <rect x="790" y="100" width="160" height="40" rx="5" fill="#FFFFFF" stroke="#1976D2" stroke-width="1"/>
  <text x="870" y="125" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #1976D2;">MessageDetailPanel 📋</text>
  
  <rect x="970" y="100" width="160" height="40" rx="5" fill="#FFFFFF" stroke="#1976D2" stroke-width="1"/>
  <text x="1050" y="125" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #1976D2;">ChatInput ⌨️</text>
  
  <!-- State Management Layer -->
  <rect x="350" y="200" width="500" height="80" rx="10" fill="url(#stateGrad)" stroke="#F57C00" stroke-width="2"/>
  <text x="370" y="225" style="font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #F57C00;">🗃️ STATE MANAGEMENT</text>
  <text x="600" y="250" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 12px; fill: #F57C00;">Zustand Conversation Store</text>
  
  <!-- API Layer -->
  <rect x="50" y="320" width="1100" height="100" rx="10" fill="url(#apiGrad)" stroke="#388E3C" stroke-width="2"/>
  <text x="70" y="345" style="font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #388E3C;">🔌 API LAYER</text>
  
  <!-- API Components -->
  <rect x="100" y="360" width="200" height="40" rx="5" fill="#FFFFFF" stroke="#388E3C" stroke-width="1"/>
  <text x="200" y="385" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #388E3C;">Chat API Route 🔌</text>
  
  <rect x="320" y="360" width="200" height="40" rx="5" fill="#FFFFFF" stroke="#388E3C" stroke-width="1"/>
  <text x="420" y="385" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #388E3C;">RAG System 🧠</text>
  
  <rect x="540" y="360" width="200" height="40" rx="5" fill="#FFFFFF" stroke="#388E3C" stroke-width="1"/>
  <text x="640" y="385" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #388E3C;">Local RAG 💾</text>
  
  <rect x="760" y="360" width="200" height="40" rx="5" fill="#FFFFFF" stroke="#388E3C" stroke-width="1"/>
  <text x="860" y="385" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #388E3C;">Qdrant Client 🔍</text>
  
  <!-- AI Services Layer -->
  <rect x="50" y="460" width="1100" height="100" rx="10" fill="url(#aiGrad)" stroke="#7B1FA2" stroke-width="2"/>
  <text x="70" y="485" style="font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #7B1FA2;">🤖 AI SERVICES</text>
  
  <!-- AI Components -->
  <rect x="150" y="500" width="250" height="40" rx="5" fill="#FFFFFF" stroke="#7B1FA2" stroke-width="1"/>
  <text x="275" y="525" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #7B1FA2;">OpenAI API GPT-4o-mini 🤖</text>
  
  <rect x="420" y="500" width="250" height="40" rx="5" fill="#FFFFFF" stroke="#7B1FA2" stroke-width="1"/>
  <text x="545" y="525" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #7B1FA2;">Embeddings text-embedding 📊</text>
  
  <rect x="690" y="500" width="250" height="40" rx="5" fill="#FFFFFF" stroke="#7B1FA2" stroke-width="1"/>
  <text x="815" y="525" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #7B1FA2;">HyDE System 📝</text>
  
  <!-- Data Layer -->
  <rect x="50" y="600" width="1100" height="100" rx="10" fill="url(#dataGrad)" stroke="#FBC02D" stroke-width="2"/>
  <text x="70" y="625" style="font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #FBC02D;">💾 DATA LAYER</text>
  
  <!-- Data Components -->
  <rect x="100" y="640" width="150" height="40" rx="5" fill="#FFFFFF" stroke="#FBC02D" stroke-width="1"/>
  <text x="175" y="665" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #FBC02D;">VTT Files 📹</text>
  
  <rect x="270" y="640" width="150" height="40" rx="5" fill="#FFFFFF" stroke="#FBC02D" stroke-width="1"/>
  <text x="345" y="665" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #FBC02D;">Chunks 📦</text>
  
  <rect x="440" y="640" width="150" height="40" rx="5" fill="#FFFFFF" stroke="#FBC02D" stroke-width="1"/>
  <text x="515" y="665" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #FBC02D;">Vectors 🗂️</text>
  
  <rect x="610" y="640" width="150" height="40" rx="5" fill="#FFFFFF" stroke="#FBC02D" stroke-width="1"/>
  <text x="685" y="665" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #FBC02D;">Metadata 📋</text>
  
  <rect x="780" y="640" width="200" height="40" rx="5" fill="#FFFFFF" stroke="#FBC02D" stroke-width="1"/>
  <text x="880" y="665" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 11px; fill: #FBC02D;">Search Results 🎯</text>
  
  <!-- Flow Arrows -->
  <!-- Frontend to State -->
  <line x1="150" y1="140" x2="450" y2="200" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="330" y1="140" x2="550" y2="200" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="690" y1="140" x2="650" y2="200" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
  
  <!-- State to API -->
  <line x1="600" y1="280" x2="420" y2="360" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
  
  <!-- API to AI -->
  <line x1="200" y1="400" x2="275" y2="500" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="420" y1="400" x2="545" y2="500" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="640" y1="400" x2="815" y2="500" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
  
  <!-- AI to Data -->
  <line x1="545" y1="540" x2="515" y2="640" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
  
  <!-- Data Flow -->
  <line x1="175" y1="680" x2="345" y2="680" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="345" y1="680" x2="515" y2="680" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="515" y1="680" x2="685" y2="680" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="685" y1="680" x2="880" y2="680" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
  
  <!-- Flow Labels -->
  <text x="50" y="750" style="font-family: Arial, sans-serif; font-size: 12px; fill: #666;">📊 Data Flow: VTT → Chunks → Embeddings → Vector Store → Search → Context → Response</text>
  <text x="50" y="770" style="font-family: Arial, sans-serif; font-size: 12px; fill: #666;">🔄 User Flow: Input → API → RAG → AI → Stream → UI Update</text>
  
  <!-- Arrow marker definition -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#666"/>
    </marker>
  </defs>
</svg>
`;

// Write the SVG file
const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'architecture-diagram.svg');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the SVG file
fs.writeFileSync(svgPath, svgDiagram);

console.log('✅ Architecture diagram generated successfully!');
console.log('📁 Saved as: public/architecture-diagram.svg');
console.log('🌐 View it at: http://localhost:3000/architecture-diagram.svg');