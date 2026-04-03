# ✦ Prisma AI — Premium AI Chat Interface

A stunning, production-ready AI chatbot with dark glassmorphism design, streaming responses, markdown rendering, VS Code-style code highlighting, and persistent chat history.

---

## ✨ Features

- **Streaming responses** — token-by-token output like ChatGPT
- **Markdown rendering** — headers, lists, bold, italics, tables, blockquotes
- **VS Code code highlighting** — syntax highlighting for 100+ languages with copy button
- **Chat history** — persists in localStorage, grouped by Today / Yesterday / This week
- **Glassmorphism UI** — deep dark theme with glowing orbs, frosted glass panels
- **Multi-provider** — switch between OpenAI (GPT-4o) and Anthropic (Claude) via env var
- **Zero local backend** — deploy to Vercel in 2 minutes

---

## 🚀 Deploy to Vercel (2 minutes)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
gh repo create prisma-ai --public --push
# or manually create a repo and push
```

### Step 2 — Connect to Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Click **Deploy** — Vercel auto-detects Next.js

### Step 3 — Set Environment Variables
In Vercel Dashboard → Your Project → **Settings → Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `AI_PROVIDER` | `openai` or `anthropic` |
| `OPENAI_API_KEY` | `sk-...` (if using OpenAI) |
| `OPENAI_MODEL` | `gpt-4o` (optional, default: gpt-4o) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (if using Anthropic) |
| `ANTHROPIC_MODEL` | `claude-opus-4-5` (optional) |
| `NEXT_PUBLIC_APP_NAME` | `Prisma AI` (optional branding) |

### Step 4 — Redeploy
After adding env vars, click **Redeploy** → your chatbot is live! 🎉

---

## 💻 Local Development

```bash
# Clone & install
npm install

# Copy env file
cp .env.example .env.local
# Fill in your API key in .env.local

# Run dev server
npm run dev
# → http://localhost:3000
```

---

## 🔧 Customization

### Change AI Provider
Set `AI_PROVIDER=anthropic` to use Claude, or `AI_PROVIDER=openai` for GPT.

### Change Model
- OpenAI: Set `OPENAI_MODEL=gpt-4-turbo` or `gpt-3.5-turbo`
- Anthropic: Set `ANTHROPIC_MODEL=claude-3-5-sonnet-20241022`

### System Prompt
Edit `SYSTEM_PROMPT` in `pages/index.js` to customize the AI's personality.

### Branding
Set `NEXT_PUBLIC_APP_NAME` env var to rename the app. Edit `styles/globals.css` to change colors.

### Color Scheme
All colors are CSS variables in `:root` inside `styles/globals.css`. The main accent is `--accent: #7b6fff` (electric violet).

---

## 📁 File Structure

```
prisma-ai/
├── pages/
│   ├── index.js          # Main chat page
│   ├── _app.js           # App wrapper
│   ├── _document.js      # HTML document & fonts
│   └── api/
│       ├── chat.js       # AI streaming API route
│       └── provider.js   # Provider info endpoint
├── components/
│   ├── Sidebar.js        # Chat history sidebar
│   ├── Message.js        # Message bubble + markdown
│   └── InputBar.js       # Text input with send/stop
├── styles/
│   └── globals.css       # All styles (design system)
├── vercel.json           # Vercel config (60s timeout)
├── .env.example          # Environment variable template
└── package.json
```

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (Pages Router) |
| Styling | Vanilla CSS with CSS variables |
| Markdown | react-markdown + remark-gfm |
| Code highlighting | react-syntax-highlighter (vscDarkPlus) |
| Fonts | Sora (UI) + JetBrains Mono (code) |
| Storage | localStorage (no database needed) |
| Deployment | Vercel |

---

## 📝 Notes

- Chat history is stored in the **browser's localStorage** — private per device, no account needed
- API keys are **never exposed to the browser** — all AI calls go through the Next.js API route
- The streaming uses **Server-Sent Events (SSE)** for real-time token delivery
- Supports **Shift+Enter** for newlines in the input

---

Made with ✦ — deploy, use, customize freely.
