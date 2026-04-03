// components/InputBar.js
import { useRef, useEffect } from 'react';

export default function InputBar({ value, onChange, onSend, onStop, isLoading, disabled }) {
  const ref = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + 'px';
    }
  }, [value]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSend();
    }
  };

  return (
    <div className="input-area">
      <div className="input-box">
        <div className="input-wrapper">
          <textarea
            ref={ref}
            className="chat-textarea"
            placeholder="Ask anything..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            disabled={disabled}
            rows={1}
          />

          {isLoading ? (
            <button className="stop-btn" onClick={onStop} title="Stop generating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={onSend}
              disabled={!value.trim() || disabled}
              title="Send (Enter)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          )}
        </div>
        <div className="input-hint">
          Enter to send &nbsp;·&nbsp; Shift+Enter for newline &nbsp;·&nbsp; Markdown supported
        </div>
      </div>
    </div>
  );
}
