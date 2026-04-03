// components/Sidebar.js
import { useState } from 'react';

export default function Sidebar({
  sessions,
  activeId,
  onNew,
  onSelect,
  onDelete,
  provider,
}) {
  const [hovered, setHovered] = useState(null);

  // Group sessions by today / yesterday / older
  const grouped = groupSessions(sessions);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">✦</div>
        <span className="logo-text">
          {process.env.NEXT_PUBLIC_APP_NAME || 'Prisma AI'}
        </span>
      </div>

      {/* New Chat */}
      <button className="new-chat-btn" onClick={onNew}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New conversation
      </button>

      {/* Chat History */}
      <div className="chat-list">
        {sessions.length === 0 ? (
          <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            No conversations yet
          </div>
        ) : (
          Object.entries(grouped).map(([label, items]) =>
            items.length > 0 ? (
              <div key={label}>
                <div className="sidebar-section-label">{label}</div>
                {items.map((s) => (
                  <div
                    key={s.id}
                    className={`chat-item ${s.id === activeId ? 'active' : ''}`}
                    onClick={() => onSelect(s.id)}
                    onMouseEnter={() => setHovered(s.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span className="chat-item-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <span className="chat-item-title">{s.title}</span>
                    <button
                      className="chat-item-delete"
                      onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                      title="Delete"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : null
          )
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="provider-badge">
          <div className="provider-dot" />
          <span className="provider-label">
            {provider ? `via ${provider}` : 'Configuring...'}
          </span>
        </div>
      </div>
    </aside>
  );
}

function groupSessions(sessions) {
  const now = Date.now();
  const day = 86400000;

  const today = [], yesterday = [], week = [], older = [];

  for (const s of [...sessions].reverse()) {
    const diff = now - s.createdAt;
    if (diff < day) today.push(s);
    else if (diff < 2 * day) yesterday.push(s);
    else if (diff < 7 * day) week.push(s);
    else older.push(s);
  }

  return { Today: today, Yesterday: yesterday, 'This week': week, Older: older };
}
