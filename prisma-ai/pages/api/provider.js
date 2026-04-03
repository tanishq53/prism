// pages/api/provider.js
export default function handler(req, res) {
  const provider = process.env.AI_PROVIDER || 'openai';
  const model =
    provider === 'openai'
      ? process.env.OPENAI_MODEL || 'gpt-4o'
      : process.env.ANTHROPIC_MODEL || 'claude-opus-4-5';

  res.json({ provider, model });
}
