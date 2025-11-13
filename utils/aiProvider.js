const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

// AI provider abstraction with Groq support (OpenAI-compatible Chat Completions)
// Securely reads API keys from environment variables. Do not hardcode secrets in repo.

function readConfig(baseDir) {
  try {
    const cfg = fs.readJsonSync(path.join(baseDir, "config.json"));
    return cfg;
  } catch {
    return {};
  }
}

async function groqChat(messages, opts = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const primary = opts.model || "llama-3.3-70b-versatile";
  const fallback = "llama-3.1-8b-instant";
  const temperature = typeof opts.temperature === "number" ? opts.temperature : 0.7;
  const max_tokens = typeof opts.maxTokens === "number" ? opts.maxTokens : 512;

  async function call(model) {
    const payload = { model, messages, temperature, max_tokens, stream: false };
    const res = await axios.post(url, payload, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 20000
    });
    const txt = res.data?.choices?.[0]?.message?.content?.trim();
    if (!txt) throw new Error("Empty AI response");
    return txt;
  }

  try {
    return await call(primary);
  } catch (e) {
    // try fallback model if the primary is unavailable
    const status = e.response?.status;
    const message = e.response?.data?.error?.message || e.message;
    if (!opts.model && (status === 404 || status === 400 || /model/i.test(message || ""))) {
      return await call(fallback);
    }
    const reason = status ? `${status} ${message}` : message;
    throw new Error(reason || "Groq request failed");
  }
}

async function grokChat(messages, opts = {}) {
  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY (or GROK_API_KEY) not set");
  const url = "https://api.x.ai/v1/chat/completions";
  const model = opts.model || "grok-2-latest";
  const temperature = typeof opts.temperature === "number" ? opts.temperature : 0.7;
  const max_tokens = typeof opts.maxTokens === "number" ? opts.maxTokens : 512;
  const payload = { model, messages, temperature, max_tokens, stream: false };
  const res = await axios.post(url, payload, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    timeout: 20000
  });
  const txt = res.data?.choices?.[0]?.message?.content?.trim();
  if (!txt) throw new Error("Empty AI response");
  return txt;
}

module.exports = {
  // opts: { provider, model, temperature, maxTokens }
  async chat({ baseDir, messages, opts = {} }) {
    const cfg = readConfig(baseDir || __dirname);
    const aiCfg = cfg.AI || {};
    const envDefault = process.env.XAI_API_KEY || process.env.GROK_API_KEY ? "grok" : (process.env.GROQ_API_KEY ? "groq" : "http");
    const provider = (opts.provider || aiCfg.provider || envDefault).toLowerCase();

    if (provider === "grok") {
      try {
        return await grokChat(messages, { model: opts.model || aiCfg.model, temperature: opts.temperature, maxTokens: opts.maxTokens });
      } catch (e) {
        // fallback chain to groq/http
      }
    }

    if (provider === "groq") {
      try {
        return await groqChat(messages, { model: opts.model || aiCfg.model, temperature: opts.temperature, maxTokens: opts.maxTokens });
      } catch (e) {
        // fallback below
      }
    }

    // Fallback HTTP (legacy): simple GET with q= prompt (used in existing ai.js)
    try {
      const encodedApi = "aHR0cHM6Ly9hcGlzLWtlaXRoLnZlcmNlbC5hcHAvYWkvZGVlcHNlZWtWMz9xPQ==";
      const apiUrl = Buffer.from(encodedApi, "base64").toString("utf-8");
      const prompt = messages.map(m => `${m.role === 'system' ? 'System' : m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`).join("\n");
      const res = await axios.get(`${apiUrl}${encodeURIComponent(prompt)}`, { timeout: 20000 });
      const out = res.data?.result || res.data?.response || res.data?.message || "";
      return out || "Sorry, I couldn't generate a reply right now.";
    } catch (e) {
      return "Sorry, AI is busy right now. Please try again.";
    }
  }
};
