import fs from 'fs/promises';

export interface EnhancedVTTSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  content: string;
  speaker?: string;
  confidence: number;
  metadata: {
    hasCode: boolean;
    isQuestion: boolean;
    isAnswer: boolean;
    technicalTerms: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface ParsedVTTFile {
  segments: EnhancedVTTSegment[];
  metadata: {
    totalDuration: number;
    totalSegments: number;
    speakers: string[];
    averageSegmentLength: number;
    technicalDensity: number;
  };
}

export class EnhancedVTTParser {
  private technicalTerms = {
    nodejs: [
      'express', 'middleware', 'router', 'async', 'await', 'promise', 'callback',
      'npm', 'node', 'server', 'api', 'http', 'request', 'response', 'json',
      'mongodb', 'mongoose', 'jwt', 'authentication', 'cors', 'helmet'
    ],
    python: [
      'function', 'class', 'method', 'variable', 'list', 'dict', 'tuple',
      'import', 'from', 'def', 'return', 'lambda', 'comprehension',
      'django', 'flask', 'pandas', 'numpy', 'matplotlib', 'scikit-learn'
    ],
    general: [
      'algorithm', 'data structure', 'loop', 'condition', 'variable',
      'object', 'array', 'string', 'number', 'boolean', 'error', 'debug'
    ]
  };

  async parseVTTFile(
    filePath: string,
    course: 'nodejs' | 'python' = 'nodejs'
  ): Promise<ParsedVTTFile> {
    try {
      console.log(`📖 Enhanced parsing VTT file: ${filePath}`);
      
      const content = await fs.readFile(filePath, 'utf-8');
      const segments = this.parseVTTContent(content, course);
      const metadata = this.calculateMetadata(segments);
      
      console.log(`✅ Parsed ${segments.length} enhanced segments`);
      
      return { segments, metadata };
    } catch (error) {
      console.error(`❌ Failed to parse VTT file ${filePath}:`, error);
      throw error;
    }
  }

  private parseVTTContent(content: string, course: 'nodejs' | 'python'): EnhancedVTTSegment[] {
    const lines = content.split('\n');
    const segments: EnhancedVTTSegment[] = [];
    let currentSegment: Partial<EnhancedVTTSegment> = {};
    let segmentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip WEBVTT header and empty lines
      if (!line || line === 'WEBVTT' || line.startsWith('NOTE')) {
        continue;
      }

      // Parse timestamp line
      if (line.includes('-->')) {
        const [startStr, endStr] = line.split('-->').map(s => s.trim());
        const startTime = this.parseTimestamp(startStr);
        const endTime = this.parseTimestamp(endStr);

        if (startTime !== null && endTime !== null) {
          currentSegment = {
            id: `segment_${segmentIndex++}`,
            startTime,
            endTime,
            duration: endTime - startTime,
            content: '',
          };
        }
        continue;
      }

      // Parse content lines
      if (currentSegment.startTime !== undefined && line) {
        // Handle speaker detection
        const speakerMatch = line.match(/^(\w+):\s*(.+)/) || line.match(/^\[(\w+)\]\s*(.+)/);
        
        if (speakerMatch) {
          currentSegment.speaker = speakerMatch[1];
          currentSegment.content = (currentSegment.content || '') + speakerMatch[2] + ' ';
        } else {
          currentSegment.content = (currentSegment.content || '') + line + ' ';
        }

        // Check if this is the last line of the segment
        const nextLine = lines[i + 1]?.trim();
        if (!nextLine || nextLine.includes('-->') || nextLine.startsWith('NOTE')) {
          // Finalize segment
          const enhancedSegment = this.enhanceSegment(
            currentSegment as EnhancedVTTSegment,
            course
          );
          
          if (enhancedSegment.content.trim().length > 0) {
            segments.push(enhancedSegment);
          }
          
          currentSegment = {};
        }
      }
    }

    return segments;
  }

  private enhanceSegment(
    segment: EnhancedVTTSegment,
    course: 'nodejs' | 'python'
  ): EnhancedVTTSegment {
    const content = segment.content.trim();
    
    // Detect technical terms
    const courseTerms = this.technicalTerms[course];
    const generalTerms = this.technicalTerms.general;
    const allTerms = [...courseTerms, ...generalTerms];
    
    const technicalTerms = allTerms.filter(term =>
      content.toLowerCase().includes(term.toLowerCase())
    );

    // Analyze content type
    const hasCode = this.detectCode(content);
    const isQuestion = this.detectQuestion(content);
    const isAnswer = this.detectAnswer(content);
    
    // Determine difficulty
    const difficulty = this.assessDifficulty(content, technicalTerms);
    
    // Assess sentiment
    const sentiment = this.assessSentiment(content);
    
    // Calculate confidence based on content quality
    const confidence = this.calculateConfidence(segment, technicalTerms);

    return {
      ...segment,
      content,
      confidence,
      metadata: {
        hasCode,
        isQuestion,
        isAnswer,
        technicalTerms,
        sentiment,
        difficulty,
      },
    };
  }

  private detectCode(content: string): boolean {
    const codePatterns = [
      /\b(function|const|let|var|if|for|while|class|def|import|return)\b/gi,
      /[{}\[\]();]/g,
      /=>/g,
      /\.\w+\(/g, // Method calls
      /console\.log|print\(/gi,
    ];

    return codePatterns.some(pattern => pattern.test(content));
  }

  private detectQuestion(content: string): boolean {
    const questionPatterns = [
      /\b(what|how|why|when|where|which|who|can|could|would|should|is|are|do|does|will)\b.*\?/gi,
      /\?$/,
      /\bhow to\b/gi,
      /\bwhat is\b/gi,
    ];

    return questionPatterns.some(pattern => pattern.test(content));
  }

  private detectAnswer(content: string): boolean {
    const answerPatterns = [
      /\b(so|well|actually|basically|essentially|the answer is|you can|we can|this is|here)\b/gi,
      /\b(let me|let's|I'll|we'll)\b/gi,
      /\b(for example|like this|such as)\b/gi,
    ];

    return answerPatterns.some(pattern => pattern.test(content));
  }

  private assessDifficulty(content: string, technicalTerms: string[]): 'beginner' | 'intermediate' | 'advanced' {
    let score = 0;
    
    // Technical term density
    score += Math.min(technicalTerms.length, 5);
    
    // Advanced concepts
    const advancedPatterns = [
      /\b(algorithm|complexity|optimization|refactor|architecture|design pattern)\b/gi,
      /\b(async|await|promise|callback|closure|prototype)\b/gi,
      /\b(decorator|generator|metaclass|comprehension)\b/gi,
    ];
    
    advancedPatterns.forEach(pattern => {
      if (pattern.test(content)) score += 2;
    });
    
    // Intermediate concepts
    const intermediatePatterns = [
      /\b(function|class|method|object|array|loop)\b/gi,
      /\b(api|database|server|client)\b/gi,
    ];
    
    intermediatePatterns.forEach(pattern => {
      if (pattern.test(content)) score += 1;
    });
    
    if (score >= 8) return 'advanced';
    if (score >= 4) return 'intermediate';
    return 'beginner';
  }

  private assessSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['great', 'good', 'excellent', 'perfect', 'awesome', 'easy', 'simple', 'clear'];
    const negativeWords = ['difficult', 'hard', 'complex', 'problem', 'error', 'issue', 'wrong', 'bad'];
    
    const contentLower = content.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateConfidence(segment: EnhancedVTTSegment, technicalTerms: string[]): number {
    let confidence = 0.5; // Base confidence
    
    // Duration factor (sweet spot around 10-30 seconds)
    if (segment.duration >= 10 && segment.duration <= 30) {
      confidence += 0.2;
    } else if (segment.duration >= 5) {
      confidence += 0.1;
    }
    
    // Content length factor
    const wordCount = segment.content.split(/\s+/).length;
    if (wordCount >= 10 && wordCount <= 100) {
      confidence += 0.15;
    }
    
    // Technical content bonus
    confidence += Math.min(0.2, technicalTerms.length * 0.05);
    
    // Speaker identification bonus
    if (segment.speaker) {
      confidence += 0.05;
    }
    
    return Math.min(1.0, confidence);
  }

  private calculateMetadata(segments: EnhancedVTTSegment[]): ParsedVTTFile['metadata'] {
    const totalDuration = Math.max(...segments.map(s => s.endTime)) - Math.min(...segments.map(s => s.startTime));
    const speakers = [...new Set(segments.filter(s => s.speaker).map(s => s.speaker!))];
    const averageSegmentLength = segments.reduce((sum, s) => sum + s.duration, 0) / segments.length;
    const technicalSegments = segments.filter(s => s.metadata.technicalTerms.length > 0);
    const technicalDensity = technicalSegments.length / segments.length;

    return {
      totalDuration,
      totalSegments: segments.length,
      speakers,
      averageSegmentLength,
      technicalDensity,
    };
  }

  private parseTimestamp(timestamp: string): number | null {
    const cleanTimestamp = timestamp.replace(/[<>]/g, '').trim();
    
    // Handle different VTT timestamp formats
    // Format: HH:MM:SS.mmm or MM:SS.mmm
    const timeRegex = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})\.(\d{3})$/;
    const match = cleanTimestamp.match(timeRegex);
    
    if (!match) {
      console.warn(`⚠️ Could not parse timestamp: "${timestamp}"`);
      return null;
    }
    
    const [, hours, minutes, seconds, milliseconds] = match;
    
    const h = parseInt(hours || '0') || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    const ms = parseInt(milliseconds) || 0;
    
    return h * 3600 + m * 60 + s + ms / 1000;
  }

  // Advanced filtering methods
  filterByDifficulty(
    segments: EnhancedVTTSegment[],
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): EnhancedVTTSegment[] {
    return segments.filter(s => s.metadata.difficulty === difficulty);
  }

  filterBySpeaker(segments: EnhancedVTTSegment[], speaker: string): EnhancedVTTSegment[] {
    return segments.filter(s => s.speaker === speaker);
  }

  filterByTechnicalContent(segments: EnhancedVTTSegment[], minTerms: number = 1): EnhancedVTTSegment[] {
    return segments.filter(s => s.metadata.technicalTerms.length >= minTerms);
  }

  filterByContentType(
    segments: EnhancedVTTSegment[],
    type: 'code' | 'questions' | 'answers'
  ): EnhancedVTTSegment[] {
    switch (type) {
      case 'code':
        return segments.filter(s => s.metadata.hasCode);
      case 'questions':
        return segments.filter(s => s.metadata.isQuestion);
      case 'answers':
        return segments.filter(s => s.metadata.isAnswer);
      default:
        return segments;
    }
  }
}

export const enhancedVTTParser = new EnhancedVTTParser();