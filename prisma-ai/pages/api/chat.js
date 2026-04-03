// pages/api/chat.js
// Supports: OpenAI (streaming) + Anthropic (streaming)
// Deploy to Vercel — set env vars in dashboard, done.

export const config = {
  api: { responseLimit: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();

  try {
    if (provider === "openai") {
      await streamOpenAI(messages, res);
    } else if (provider === "anthropic") {
      await streamAnthropic(messages, res);
    } else {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }
  } catch (err) {
    console.error("Chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
}

// ── OpenAI Streaming ─────────────────────────────────────────────────────────
async function streamOpenAI(messages, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({ error: { message: upstream.statusText } }));
    throw new Error(err?.error?.message || "OpenAI API error");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter((l) => l.startsWith("data:"));

    for (const line of lines) {
      const data = line.slice(5).trim();
      if (data === "[DONE]") {
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      try {
        const json = JSON.parse(data);
        const token = json.choices?.[0]?.delta?.content;
        if (token) {
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      } catch (_) {}
    }
  }
  res.end();
}

// ── Anthropic Streaming ──────────────────────────────────────────────────────
async function streamAnthropic(messages, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-5";

  // Separate system prompt if first message is system
  let system = undefined;
  let chatMessages = messages;
  if (messages[0]?.role === "system") {
    system = messages[0].content;
    chatMessages = messages.slice(1);
  }

  const body = {
    model,
    max_tokens: 4096,
    stream: true,
    messages: chatMessages,
    ...(system ? { system } : {}),
  };

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({ error: { message: upstream.statusText } }));
    throw new Error(err?.error?.message || "Anthropic API error");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter((l) => l.startsWith("data:"));

    for (const line of lines) {
      const data = line.slice(5).trim();
      try {
        const json = JSON.parse(data);
        if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
          res.write(`data: ${JSON.stringify({ token: json.delta.text })}\n\n`);
        }
        if (json.type === "message_stop") {
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        }
      } catch (_) {}
    }
  }
  res.end();
}
