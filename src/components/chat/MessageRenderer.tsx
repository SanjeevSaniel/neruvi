// components/chat/MessageRenderer.tsx
import { memo } from 'react';

interface MessageRendererProps {
  content: string;
  role: 'user' | 'assistant';
}

const MessageRenderer = memo(({ content, role }: MessageRendererProps) => {
  if (role === 'user') {
    return <div className='whitespace-pre-wrap text-white'>{content}</div>;
  }

  // For assistant messages - simple but effective rendering
  const renderContent = () => {
    const lines = content.split('\n');

    return lines.map((line, lineIndex) => {
      const trimmedLine = line.trim();

      // Handle headers
      if (trimmedLine.startsWith('### ')) {
        return (
          <h3
            key={lineIndex}
            className='text-lg font-semibold text-slate-800 mt-3 mb-2'>
            {trimmedLine.substring(4)}
          </h3>
        );
      }

      if (trimmedLine.startsWith('## ')) {
        return (
          <h2
            key={lineIndex}
            className='text-xl font-bold text-slate-900 mt-4 mb-2'>
            {trimmedLine.substring(3)}
          </h2>
        );
      }

      if (trimmedLine.startsWith('# ')) {
        return (
          <h1
            key={lineIndex}
            className='text-2xl font-bold text-slate-900 mt-4 mb-3'>
            {trimmedLine.substring(2)}
          </h1>
        );
      }

      // Handle lists
      if (trimmedLine.startsWith('- ')) {
        return (
          <div
            key={lineIndex}
            className='flex items-start mb-1'>
            <span className='mr-2 text-slate-500'>•</span>
            <span className='text-slate-700'>{trimmedLine.substring(2)}</span>
          </div>
        );
      }

      // Handle numbered lists
      if (/^\d+\.\s/.test(trimmedLine)) {
        return (
          <div
            key={lineIndex}
            className='flex items-start mb-1'>
            <span className='mr-2 text-slate-500'>
              {trimmedLine.match(/^\d+\./)?.[0]}
            </span>
            <span className='text-slate-700'>
              {trimmedLine.replace(/^\d+\.\s/, '')}
            </span>
          </div>
        );
      }

      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        return null; // Skip code block markers for now
      }

      // Handle regular paragraphs
      if (trimmedLine) {
        return (
          <p
            key={lineIndex}
            className='text-slate-700 mb-2 leading-relaxed'>
            {renderInlineFormatting(trimmedLine)}
          </p>
        );
      }

      // Empty lines
      return <br key={lineIndex} />;
    });
  };

  const renderInlineFormatting = (text: string) => {
    // Handle inline code first
    const parts = text.split('`');

    return parts.map((part, partIndex) => {
      if (partIndex % 2 === 1) {
        // Inside backticks - render as code
        return (
          <code
            key={partIndex}
            className='bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-sm font-mono'>
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
              className='font-semibold text-slate-900'>
              {boldPart}
            </strong>
          );
        }

        // Regular text
        return boldPart || null;
      });
    });
  };

  return <div className='prose prose-sm max-w-none'>{renderContent()}</div>;
});

MessageRenderer.displayName = 'MessageRenderer';
export default MessageRenderer;
