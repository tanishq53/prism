// components/Message.js
import { useState, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

// ── Code Block with copy ─────────────────────────────────────────────────────
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const lang = /language-(\w+)/.exec(className || '')?.[1] || 'text';
  const code = String(children).replace(/\n$/, '');

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-lang">{lang}</span>
        <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
          {copied ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={lang}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '16px',
          fontSize: '12.5px',
          lineHeight: '1.65',
          background: '#0d0d1a',
          fontFamily: "'JetBrains Mono', monospace",
        }}
        codeTagProps={{ style: { fontFamily: "'JetBrains Mono', monospace" } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// ── Markdown renderer ────────────────────────────────────────────────────────
const mdComponents = {
  code({ node, inline, className, children, ...props }) {
    if (inline) return <code className={className} {...props}>{children}</code>;
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
};

// ── Message ──────────────────────────────────────────────────────────────────
function Message({ role, content, isStreaming }) {
  const isUser = role === 'user';

  return (
    <div className={`message-row ${role}`}>
      <div className="message-meta" style={{ flexDirection: isUser ? 'row-reverse' : 'row' }}>
        <div className={`avatar ${isUser ? 'user' : 'ai'}`}>
          {isUser ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          ) : '✦'}
        </div>
        <span className="sender-name">{isUser ? 'You' : 'Prisma'}</span>
      </div>

      <div className="message-bubble">
        {isUser ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
        ) : (
          <>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {content}
            </ReactMarkdown>
            {isStreaming && <span className="streaming-cursor" />}
          </>
        )}
      </div>
    </div>
  );
}

export default memo(Message);
