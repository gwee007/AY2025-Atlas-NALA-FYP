import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/**
 * MarkdownRenderer component with LaTeX/Math equation support
 * Renders markdown content with proper KaTeX rendering for mathematical expressions
 * 
 * Supports:
 * - Inline math: $equation$
 * - Display math: $$equation$$
 * - All standard markdown formatting
 * 
 * @param {string} children - The markdown content to render
 * @param {object} components - Custom components for markdown elements (optional)
 * @param {object} props - Additional props passed to ReactMarkdown
 */
export default function MarkdownRenderer({ children, components, ...props }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={components}
      {...props}
    >
      {children}
    </ReactMarkdown>
  );
}
