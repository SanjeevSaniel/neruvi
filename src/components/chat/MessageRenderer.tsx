// components/chat/MessageRenderer.tsx
import { memo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MessageRendererProps {
  content: string;
  role: 'user' | 'assistant';
}

const MessageRenderer = memo(({ content, role }: MessageRendererProps) => {
  if (role === 'user') {
    return <div className='whitespace-pre-wrap text-white'>{content}</div>;
  }

  // For assistant messages - enhanced rendering with code blocks
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
        codeLanguage = trimmedLine.substring(3).trim();
        codeBlockLines = [];
        i++;
        continue;
      }

      // Handle code block end
      if (trimmedLine.startsWith('```') && inCodeBlock) {
        inCodeBlock = false;
        result.push(
          <div key={`code-${i}`} className='my-4'>
            <div className='bg-slate-900 rounded-t-lg px-4 py-2 text-xs text-slate-300 font-mono border-b border-slate-700'>
              {codeLanguage || 'code'}
            </div>
            <pre className='bg-slate-800 rounded-b-lg p-4 text-sm text-slate-100 font-mono overflow-x-auto'>
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
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

      // Handle headers
      if (trimmedLine.startsWith('### ')) {
        result.push(
          <h3
            key={i}
            className='text-lg font-semibold text-slate-800 mt-3 mb-2'>
            {trimmedLine.substring(4)}
          </h3>
        );
      } else if (trimmedLine.startsWith('## ')) {
        result.push(
          <h2
            key={i}
            className='text-xl font-bold text-slate-900 mt-4 mb-2'>
            {trimmedLine.substring(3)}
          </h2>
        );
      } else if (trimmedLine.startsWith('# ')) {
        result.push(
          <h1
            key={i}
            className='text-2xl font-bold text-slate-900 mt-4 mb-3'>
            {trimmedLine.substring(2)}
          </h1>
        );
      } else if (trimmedLine.startsWith('- ')) {
        result.push(
          <div
            key={i}
            className='flex items-start mb-1'>
            <span className='mr-2 text-slate-500'>•</span>
            <span className='text-slate-700'>{renderInlineFormatting(trimmedLine.substring(2))}</span>
          </div>
        );
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        result.push(
          <div
            key={i}
            className='flex items-start mb-1'>
            <span className='mr-2 text-slate-500'>
              {trimmedLine.match(/^\d+\./)?.[0]}
            </span>
            <span className='text-slate-700'>
              {renderInlineFormatting(trimmedLine.replace(/^\d+\.\s/, ''))}
            </span>
          </div>
        );
      } else if (trimmedLine) {
        result.push(
          <p
            key={i}
            className='text-slate-700 mb-2 leading-relaxed'>
            {renderInlineFormatting(trimmedLine)}
          </p>
        );
      } else {
        result.push(<br key={i} />);
      }

      i++;
    }

    // Handle case where content ends with an open code block
    if (inCodeBlock && codeBlockLines.length > 0) {
      result.push(
        <div key={`code-final`} className='my-4'>
          <div className='bg-slate-900 rounded-t-lg px-4 py-2 text-xs text-slate-300 font-mono border-b border-slate-700'>
            {codeLanguage || 'code'}
          </div>
          <pre className='bg-slate-800 rounded-b-lg p-4 text-sm text-slate-100 font-mono overflow-x-auto'>
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        </div>
      );
    }

    return result;
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
