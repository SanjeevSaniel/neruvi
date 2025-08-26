// components/chat/EnhancedMessageRenderer.tsx
import { memo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Play, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

interface EnhancedMessageRendererProps {
  content: string;
  role: 'user' | 'assistant';
}

interface CodeBlockProps {
  language: string;
  code: string;
  isDark?: boolean;
}

const CodeBlock = memo(({ language, code, isDark = true }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const getLanguageIcon = (lang: string) => {
    const icons: Record<string, string> = {
      javascript: '🟨',
      typescript: '🔷', 
      python: '🐍',
      bash: '💻',
      shell: '💻',
      json: '📋',
      html: '🌐',
      css: '🎨',
      sql: '🗄️',
      yaml: '📄',
      markdown: '📝',
      dockerfile: '🐳',
    };
    return icons[lang.toLowerCase()] || '📄';
  };

  const getLanguageDisplayName = (lang: string) => {
    const names: Record<string, string> = {
      javascript: 'JavaScript',
      js: 'JavaScript',
      typescript: 'TypeScript',
      ts: 'TypeScript',
      python: 'Python',
      py: 'Python',
      bash: 'Bash',
      shell: 'Shell',
      json: 'JSON',
      html: 'HTML',
      css: 'CSS',
      sql: 'SQL',
      yaml: 'YAML',
      yml: 'YAML',
      markdown: 'Markdown',
      md: 'Markdown',
      dockerfile: 'Dockerfile',
    };
    return names[lang.toLowerCase()] || lang;
  };

  const normalizedLanguage = language.toLowerCase();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='my-4 rounded-xl overflow-hidden shadow-lg border border-slate-200'
    >
      {/* Code header */}
      <div className='bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-4 py-3 flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <span className='text-lg'>{getLanguageIcon(normalizedLanguage)}</span>
          <span className='font-medium text-sm' style={{color: '#dcefe2'}}>
            {getLanguageDisplayName(normalizedLanguage)}
          </span>
        </div>
        <div className='flex items-center space-x-2'>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              copied
                ? 'bg-green-600'
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
            style={copied ? {backgroundColor: '#10b981', color: 'white'} : {color: '#dcefe2'}}
          >
            {copied ? (
              <>
                <Check className='w-3 h-3' />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className='w-3 h-3' />
                <span>Copy</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Code content */}
      <div className='relative'>
        <SyntaxHighlighter
          language={normalizedLanguage}
          style={isDark ? vscDarkPlus : vs}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            fontSize: '14px',
            lineHeight: '1.5',
            backgroundColor: isDark ? '#1e1e1e' : '#f8f9fa',
            border: 'none',
          }}
          showLineNumbers={code.split('\n').length > 5}
          wrapLines={true}
          wrapLongLines={true}
        >
          {code.trim()}
        </SyntaxHighlighter>
        
        {/* Language indicator only - removed runnable button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='absolute top-2 right-2 bg-slate-600/90 text-xs px-2 py-1 rounded-md'
          style={{color: 'white'}}
        >
          <span>{getLanguageDisplayName(normalizedLanguage)}</span>
        </motion.div>
      </div>
    </motion.div>
  );
});

CodeBlock.displayName = 'CodeBlock';

const EnhancedMessageRenderer = memo(({ content, role }: EnhancedMessageRendererProps) => {
  if (role === 'user') {
    return (
      <div className='whitespace-pre-wrap leading-relaxed' style={{color: 'white'}}>
        {content}
      </div>
    );
  }

  // Enhanced rendering for assistant messages
  const renderContent = () => {
    const lines = content.split('\n');
    const result: React.ReactNode[] = [];
    let i = 0;
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];
    let codeLanguage = '';

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle code block start
      if (trimmedLine.startsWith('```') && !inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = trimmedLine.substring(3).trim() || 'text';
        codeBlockLines = [];
        i++;
        continue;
      }

      // Handle code block end
      if (trimmedLine.startsWith('```') && inCodeBlock) {
        inCodeBlock = false;
        result.push(
          <CodeBlock
            key={`code-${i}`}
            language={codeLanguage}
            code={codeBlockLines.join('\n')}
          />
        );
        codeBlockLines = [];
        codeLanguage = '';
        i++;
        continue;
      }

      // Inside code block
      if (inCodeBlock) {
        codeBlockLines.push(line);
        i++;
        continue;
      }

      // Handle headers with better styling
      if (trimmedLine.startsWith('### ')) {
        result.push(
          <motion.h3
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className='text-lg font-semibold mt-4 mb-2 flex items-center space-x-2'
            style={{color: '#459071'}}
          >
            <span className='w-1 h-6 bg-blue-500 rounded-full'></span>
            <span>{trimmedLine.substring(4)}</span>
          </motion.h3>
        );
      } else if (trimmedLine.startsWith('## ')) {
        result.push(
          <motion.h2
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className='text-xl font-bold mt-5 mb-3 flex items-center space-x-2'
            style={{color: '#459071'}}
          >
            <span className='w-1.5 h-7 bg-purple-500 rounded-full'></span>
            <span>{trimmedLine.substring(3)}</span>
          </motion.h2>
        );
      } else if (trimmedLine.startsWith('# ')) {
        result.push(
          <motion.h1
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className='text-2xl font-bold mt-6 mb-4 flex items-center space-x-2'
            style={{color: '#459071'}}
          >
            <span className='w-2 h-8 bg-violet-600 rounded-full'></span>
            <span>{trimmedLine.substring(2)}</span>
          </motion.h1>
        );
      } else if (trimmedLine.startsWith('- ')) {
        result.push(
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className='flex items-start mb-2 pl-2'
          >
            <span className='mr-3 mt-2 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0'></span>
            <span className='leading-relaxed' style={{color: '#1f2937'}}>
              {renderInlineFormatting(trimmedLine.substring(2))}
            </span>
          </motion.div>
        );
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        const number = trimmedLine.match(/^\d+/)?.[0];
        result.push(
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className='flex items-start mb-2 pl-2'
          >
            <span className='mr-3 mt-0.5 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0'>
              {number}
            </span>
            <span className='leading-relaxed' style={{color: '#1f2937'}}>
              {renderInlineFormatting(trimmedLine.replace(/^\d+\.\s/, ''))}
            </span>
          </motion.div>
        );
      } else if (trimmedLine.startsWith('> ')) {
        // Blockquotes
        result.push(
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className='border-l-4 border-blue-300 bg-blue-50 pl-4 py-2 my-3 rounded-r-lg'
          >
            <span className='italic' style={{color: '#1f2937'}}>
              {renderInlineFormatting(trimmedLine.substring(2))}
            </span>
          </motion.div>
        );
      } else if (trimmedLine) {
        result.push(
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className='mb-3 leading-relaxed'
            style={{color: '#1f2937'}}
          >
            {renderInlineFormatting(trimmedLine)}
          </motion.p>
        );
      } else {
        result.push(<br key={i} />);
      }

      i++;
    }

    // Handle case where content ends with an open code block
    if (inCodeBlock && codeBlockLines.length > 0) {
      result.push(
        <CodeBlock
          key={`code-final`}
          language={codeLanguage}
          code={codeBlockLines.join('\n')}
        />
      );
    }

    return result;
  };

  const renderInlineFormatting = (text: string): React.ReactNode => {
    // Handle inline code first
    const parts = text.split('`');

    return parts.map((part, partIndex) => {
      if (partIndex % 2 === 1) {
        // Inside backticks - render as inline code
        return (
          <code
            key={partIndex}
            className='bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm font-mono border border-purple-200'
          >
            {part}
          </code>
        );
      }

      // Handle bold formatting
      const boldParts = part.split('**');
      return boldParts.map((boldPart, boldIndex) => {
        if (boldIndex % 2 === 1) {
          // Inside ** - render as bold
          return (
            <strong
              key={`${partIndex}-${boldIndex}`}
              className='font-semibold'
              style={{color: '#459071'}}
            >
              {boldPart}
            </strong>
          );
        }

        // Handle italic formatting
        const italicParts = boldPart.split('*');
        return italicParts.map((italicPart, italicIndex) => {
          if (italicIndex % 2 === 1) {
            return (
              <em
                key={`${partIndex}-${boldIndex}-${italicIndex}`}
                className='italic'
                style={{color: '#1f2937'}}
              >
                {italicPart}
              </em>
            );
          }

          // Handle timestamp highlighting
          return renderTimestampFormatting(italicPart, `${partIndex}-${boldIndex}-${italicIndex}`);
        });
      });
    });
  };

  const renderTimestampFormatting = (text: string, keyPrefix: string): React.ReactNode => {
    if (!text) return null;

    // Regex to match timestamp patterns like "at 5:23", "timestamp 12:45", "course at 3:15", etc.
    const timestampRegex = /(\b(?:at|timestamp|course\s+at|section\s+at|video\s+at|covered\s+at|explained\s+at|mentioned\s+at|discussed\s+at|introduced\s+at|expanded\s+upon\s+at)\s+)(\d{1,2}:\d{2}(?::\d{2})?)\b/gi;
    
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = timestampRegex.exec(text)) !== null) {
      // Add text before the timestamp
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText) {
          parts.push(beforeText);
        }
      }

      // Add the highlighted timestamp
      const prefix = match[1]; // "at ", "course at ", etc.
      const timestamp = match[2]; // "5:23", "12:45", etc.
      
      parts.push(
        <motion.span
          key={`${keyPrefix}-timestamp-${match.index}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className='inline-flex items-center space-x-1 px-2 py-1 rounded-lg border-2 transition-all duration-200 hover:shadow-lg cursor-pointer'
          style={{
            background: 'linear-gradient(135deg, #f0f9f4, #dcfce7)',
            borderColor: '#4ea674',
            color: '#459071'
          }}
          whileHover={{
            scale: 1.05,
            boxShadow: '0 4px 12px rgba(78, 166, 116, 0.3)'
          }}
          title={`Course reference: ${prefix}${timestamp}`}
        >
          <span className='text-sm font-medium' style={{ color: '#1f2937' }}>
            {prefix}
          </span>
          <span className='text-sm font-bold px-1.5 py-0.5 rounded-md' style={{
            backgroundColor: '#459071',
            color: 'white'
          }}>
            {timestamp}
          </span>
        </motion.span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last timestamp
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText) {
        parts.push(remainingText);
      }
    }

    // If no timestamps were found, return the original text
    return parts.length > 1 ? parts : text;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className='prose prose-sm max-w-none'
    >
      {renderContent()}
    </motion.div>
  );
});

EnhancedMessageRenderer.displayName = 'EnhancedMessageRenderer';
export default EnhancedMessageRenderer;