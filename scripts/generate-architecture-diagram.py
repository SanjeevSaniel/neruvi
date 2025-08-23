#!/usr/bin/env python3
"""
Generate FlowMind Architecture Diagram
Creates a visual representation of the FlowMind app architecture
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, ConnectionPatch
import numpy as np

# Set up the figure
fig, ax = plt.subplots(1, 1, figsize=(16, 12))
ax.set_xlim(0, 16)
ax.set_ylim(0, 12)
ax.axis('off')

# Define colors
colors = {
    'frontend': '#E8F4FD',
    'frontend_border': '#1976D2',
    'state': '#FFF3E0', 
    'state_border': '#F57C00',
    'api': '#E8F5E8',
    'api_border': '#388E3C',
    'ai': '#F3E5F5',
    'ai_border': '#7B1FA2',
    'data': '#FFF8E1',
    'data_border': '#FBC02D',
    'arrow': '#666666'
}

# Helper function to create rounded rectangle
def create_component(x, y, width, height, text, color_key, ax, fontsize=9):
    # Create rounded rectangle
    box = FancyBboxPatch(
        (x, y), width, height,
        boxstyle="round,pad=0.05",
        facecolor=colors[color_key],
        edgecolor=colors[f"{color_key}_border"],
        linewidth=2
    )
    ax.add_patch(box)
    
    # Add text
    ax.text(x + width/2, y + height/2, text, 
            ha='center', va='center', fontsize=fontsize, 
            weight='bold', wrap=True)

# Helper function to create arrow
def create_arrow(start, end, ax):
    arrow = ConnectionPatch(start, end, "data", "data",
                          arrowstyle="->", shrinkA=5, shrinkB=5, 
                          mutation_scale=20, fc=colors['arrow'], 
                          ec=colors['arrow'], alpha=0.7)
    ax.add_patch(arrow)

# Title
ax.text(8, 11.5, 'FlowMind Architecture Flow', ha='center', va='center', 
        fontsize=20, weight='bold', color='#2D3748')

# Layer 1: Frontend Components (Top)
frontend_y = 9.5
create_component(1, frontend_y, 2, 1, '🎨 User Interface\nChatInterface', 'frontend', ax)
create_component(3.5, frontend_y, 2, 1, '🏠 Welcome\nScreen', 'frontend', ax)
create_component(6, frontend_y, 2, 1, '📚 Course\nSelector', 'frontend', ax)
create_component(8.5, frontend_y, 2, 1, '💭 Messages\nContainer', 'frontend', ax)
create_component(11, frontend_y, 2, 1, '📋 Message\nDetail Panel', 'frontend', ax)
create_component(13.5, frontend_y, 2, 1, '⌨️ Chat Input\n& Header', 'frontend', ax)

# Layer 2: State Management
state_y = 7.5
create_component(7, state_y, 2.5, 1, '🗃️ Zustand Store\nConversation State', 'state', ax)

# Layer 3: API Layer
api_y = 5.5
create_component(2, api_y, 2.5, 1, '🔌 Chat API\n/api/chat', 'api', ax)
create_component(5.5, api_y, 2.5, 1, '🧠 RAG System\nRetrieval Logic', 'api', ax)
create_component(9, api_y, 2.5, 1, '💾 Local RAG\nFallback', 'api', ax)
create_component(12, api_y, 2.5, 1, '🔍 Qdrant\nVector DB', 'api', ax)

# Layer 4: AI Services
ai_y = 3.5
create_component(3, ai_y, 2.5, 1, '🤖 OpenAI API\nGPT-4o-mini', 'ai', ax)
create_component(6.5, ai_y, 2.5, 1, '📊 Embeddings\ntext-embedding', 'ai', ax)
create_component(10, ai_y, 2.5, 1, '📝 HyDE System\nQuery Enhancement', 'ai', ax)

# Layer 5: Data Layer
data_y = 1.5
create_component(2, data_y, 2, 1, '📹 VTT\nTranscripts', 'data', ax)
create_component(4.5, data_y, 2, 1, '📦 Content\nChunks', 'data', ax)
create_component(7, data_y, 2, 1, '🗂️ Vector Store\nEmbeddings', 'data', ax)
create_component(9.5, data_y, 2, 1, '📋 Metadata\nTimestamps', 'data', ax)
create_component(12, data_y, 2.5, 1, '🎯 Search Results\nRelevance Scoring', 'data', ax)

# Add flow arrows
# Frontend to State
create_arrow((2, frontend_y), (8, state_y + 1), ax)
create_arrow((7, frontend_y), (8, state_y + 1), ax)
create_arrow((9.5, frontend_y), (8.5, state_y + 1), ax)

# Frontend to API
create_arrow((2, frontend_y), (3, api_y + 1), ax)
create_arrow((14.5, frontend_y), (3.5, api_y + 1), ax)

# State to API
create_arrow((8, state_y), (6.5, api_y + 1), ax)

# API Internal Flow
create_arrow((3.5, api_y), (6.5, api_y + 0.5), ax)
create_arrow((7, api_y), (10, api_y + 0.5), ax)
create_arrow((8, api_y), (13, api_y + 0.5), ax)

# API to AI
create_arrow((3.5, api_y), (4, ai_y + 1), ax)
create_arrow((6.5, api_y), (7.5, ai_y + 1), ax)
create_arrow((7, api_y), (11, ai_y + 1), ax)

# Data Processing Flow
create_arrow((3, data_y + 1), (5.5, data_y + 1), ax)
create_arrow((5.5, data_y + 1), (8, data_y + 1), ax)
create_arrow((8, data_y + 1), (10.5, data_y + 1), ax)
create_arrow((10, data_y + 1), (13, data_y + 1), ax)

# AI to Data
create_arrow((7.5, ai_y), (8, data_y + 1), ax)
create_arrow((11, ai_y), (13, data_y + 1), ax)

# Return flows (dotted)
create_arrow((8, data_y + 1), (6.5, api_y), ax)
create_arrow((4, ai_y), (3, api_y), ax)

# Add layer labels
ax.text(0.2, frontend_y + 0.5, 'Frontend\nLayer', ha='left', va='center', 
        fontsize=10, weight='bold', color=colors['frontend_border'])
ax.text(0.2, state_y + 0.5, 'State\nLayer', ha='left', va='center', 
        fontsize=10, weight='bold', color=colors['state_border'])
ax.text(0.2, api_y + 0.5, 'API\nLayer', ha='left', va='center', 
        fontsize=10, weight='bold', color=colors['api_border'])
ax.text(0.2, ai_y + 0.5, 'AI\nServices', ha='left', va='center', 
        fontsize=10, weight='bold', color=colors['ai_border'])
ax.text(0.2, data_y + 0.5, 'Data\nLayer', ha='left', va='center', 
        fontsize=10, weight='bold', color=colors['data_border'])

# Add key features text
features_text = """
🚀 Key Features:
• Real-time streaming responses
• Semantic search with embeddings  
• HyDE query enhancement
• Course-specific conversations
• Two-column expandable layout
• Markdown export functionality
"""

ax.text(0.5, 0.5, features_text, ha='left', va='bottom', 
        fontsize=8, bbox=dict(boxstyle="round,pad=0.3", 
        facecolor='#F7FAFC', edgecolor='#E2E8F0'))

# Save the diagram
plt.tight_layout()
plt.savefig('public/architecture-diagram.png', dpi=300, bbox_inches='tight', 
            facecolor='white', edgecolor='none')
plt.savefig('public/architecture-diagram.svg', format='svg', bbox_inches='tight',
            facecolor='white', edgecolor='none')

print("✅ Architecture diagram generated successfully!")
print("📁 Saved as: public/architecture-diagram.png & .svg")