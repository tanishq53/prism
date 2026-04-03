// pages/index.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from '../components/Sidebar';
import Message from '../components/Message';
import InputBar from '../components/InputBar';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Prisma AI';
const SYSTEM_PROMPT = `You are Prisma, a highly capable and articulate AI assistant. You are helpful, precise, and concise. You use markdown formatting when it enhances clarity — including code blocks, tables, and lists. You are direct and confident.`;

const SUGGESTIONS = [
  '✦ Explain quantum entanglement simply',
  '⚡ Write a Python REST API',
  '✍ Help me draft a cold email',
  '🧠 Debug my React component',
];

// ── Storage helpers ──────────────────────────────────────────────────────────
const STORAGE_KEY = 'prisma_sessions_v2';

function loadSessions() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {}
}

function deriveTitle(content) {
  return content.trim().slice(0, 48) + (content.length > 48 ? '...' : '');
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState('');

  const abortRef = useRef(null);
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);

  // Fetch provider info
  useEffect(() => {
    fetch('/api/provider').then(r => r.json()).then(d => setProvider(d.provider)).catch(() => {});
  }, []);

  // Load sessions from localStorage
  useEffect(() => {
    const stored = loadSessions();
    setSessions(stored);
    if (stored.length > 0) setActiveId(stored[stored.length - 1].id);
  }, []);

  const activeSession = sessions.find((s) => s.id === activeId) || null;

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  // ── Session management ────────────────────────────────────────────────────
  const createSession = useCallback((firstMessage = null) => {
    const id = uuidv4();
    const newSession = {
      id,
      title: firstMessage ? deriveTitle(firstMessage) : 'New conversation',
      messages: [],
      createdAt: Date.now(),
    };
    setSessions((prev) => {
      const updated = [...prev, newSession];
      saveSessions(updated);
      return updated;
    });
    setActiveId(id);
    return id;
  }, []);

  const updateSession = useCallback((id, updater) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? updater(s) : s));
      saveSessions(updated);
      return updated;
    });
  }, []);

  const deleteSession = useCallback((id) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSessions(updated);
      if (id === activeId) {
        setActiveId(updated.length > 0 ? updated[updated.length - 1].id : null);
      }
      return updated;
    });
  }, [activeId]);

  // ── Send message ──────────────────────────────────────────────────────────
  const send = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setIsLoading(true);

    // Get or create session
    let sessionId = activeId;
    let isNew = false;

    if (!sessionId || !sessions.find((s) => s.id === sessionId)) {
      sessionId = uuidv4();
      isNew = true;
      const newSession = {
        id: sessionId,
        title: deriveTitle(trimmed),
        messages: [],
        createdAt: Date.now(),
      };
      setSessions((prev) => {
        const updated = [...prev, newSession];
        saveSessions(updated);
        return updated;
      });
      setActiveId(sessionId);
    }

    // Add user message
    const userMsg = { id: uuidv4(), role: 'user', content: trimmed };
    updateSession(sessionId, (s) => ({
      ...s,
      title: s.messages.length === 0 ? deriveTitle(trimmed) : s.title,
      messages: [...s.messages, userMsg],
    }));

    // Build messages array for API
    const currentSession = sessions.find((s) => s.id === sessionId);
    const history = currentSession ? currentSession.messages : [];
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      userMsg,
    ].map(({ role, content }) => ({ role, content }));

    // Placeholder AI message
    const aiMsgId = uuidv4();
    updateSession(sessionId, (s) => ({
      ...s,
      title: s.messages.length === 1 ? deriveTitle(trimmed) : s.title,
      messages: [
        ...s.messages,
        userMsg,
        { id: aiMsgId, role: 'assistant', content: '' },
      ],
    }));

    // Stream
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || res.statusText);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data:'));

        for (const line of lines) {
          const data = line.slice(5).trim();
          if (data === '[DONE]') break;
          try {
            const json = JSON.parse(data);
            if (json.token) {
              accumulated += json.token;
              const captured = accumulated;
              // Update the AI message content
              setSessions((prev) => {
                const updated = prev.map((s) => {
                  if (s.id !== sessionId) return s;
                  return {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === aiMsgId ? { ...m, content: captured } : m
                    ),
                  };
                });
                saveSessions(updated);
                return updated;
              });
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Stopped by user, keep what we have
      } else {
        const errMsg = err.message || 'Something went wrong';
        setSessions((prev) => {
          const updated = prev.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === aiMsgId
                  ? { ...m, content: `⚠️ **Error:** ${errMsg}\n\nCheck your API key and provider settings in Vercel environment variables.` }
                  : m
              ),
            };
          });
          saveSessions(updated);
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, activeId, sessions, updateSession]);

  const stopGeneration = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const messages = activeSession?.messages || [];
  const lastMsgId = messages[messages.length - 1]?.id;

  return (
    <>
      <Head>
        <title>{APP_NAME}</title>
      </Head>

      <div className="app-shell">
        {/* Sidebar */}
        <Sidebar
          sessions={sessions}
          activeId={activeId}
          onNew={() => {
            const id = uuidv4();
            const s = { id, title: 'New conversation', messages: [], createdAt: Date.now() };
            setSessions((prev) => { const u = [...prev, s]; saveSessions(u); return u; });
            setActiveId(id);
          }}
          onSelect={setActiveId}
          onDelete={deleteSession}
          provider={provider}
        />

        {/* Main */}
        <main className="chat-main">
          {/* Header */}
          <header className="chat-header">
            <div className="chat-header-left">
              <div className="model-pill">
                <div className="model-pill-dot" />
                {APP_NAME}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {messages.length > 0 && `${messages.length} message${messages.length !== 1 ? 's' : ''}`}
            </div>
          </header>

          {/* Messages */}
          <div className="messages-container" ref={messagesRef}>
            <div className="messages-inner">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-orb">✦</div>
                  <div className="empty-title">How can I help you?</div>
                  <div className="empty-subtitle">
                    Start a conversation — ask anything, explore ideas, write code, or solve problems.
                  </div>
                  <div className="suggestion-chips">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        className="chip"
                        onClick={() => send(s.replace(/^[^\s]+\s/, ''))}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <Message
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={isLoading && msg.id === lastMsgId && msg.role === 'assistant'}
                  />
                ))
              )}

              {/* Typing indicator before AI message arrives */}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="message-row assistant">
                  <div className="message-meta">
                    <div className="avatar ai">✦</div>
                    <span className="sender-name">Prisma</span>
                  </div>
                  <div className="message-bubble" style={{ background: 'var(--glass-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg)', backdropFilter: 'blur(12px)' }}>
                    <div className="typing-indicator">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <InputBar
            value={input}
            onChange={setInput}
            onSend={() => send()}
            onStop={stopGeneration}
            isLoading={isLoading}
          />
        </main>
      </div>
    </>
  );
}
