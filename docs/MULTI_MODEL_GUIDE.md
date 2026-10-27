# Multi-Model AI Guide: ResumeAgent.AI

ResumeAgent.AI is built on an open, provider-agnostic LLM client (`src/lib/llm/client.ts`). You can switch between providers in real time via the Web UI or via the Sub-Agent API without changing application code.

---

## 1. Supported Providers & Configuration

### A. Google Gemini
- **Preset Model**: `gemini-2.5-flash` (or `gemini-1.5-pro`)
- **Key Format**: `AIzaSy...`
- **How to Get**: [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Environment Variable**: `GEMINI_API_KEY`
- **Strengths**: Large context window (2M tokens), high extraction accuracy, fast JSON mode.

### B. OpenAI
- **Preset Model**: `gpt-4o-mini` (or `gpt-4o`)
- **Key Format**: `sk-proj-...`
- **How to Get**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Environment Variable**: `OPENAI_API_KEY`
- **Endpoint**: `https://api.openai.com/v1/chat/completions`

### C. Anthropic Claude
- **Preset Model**: `claude-3-5-haiku-20241022` (or `claude-3-7-sonnet-20250219`)
- **Key Format**: `sk-ant-api03-...`
- **How to Get**: [Anthropic Console](https://console.anthropic.com/)
- **Environment Variable**: `ANTHROPIC_API_KEY`
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Strengths**: Outstanding professional writing tone, highly natural XYZ bullet phrasing.

### D. NVIDIA NIM
- **Preset Model**: `meta/llama-3.1-70b-instruct` or `meta/llama-3.3-70b-instruct`
- **Key Format**: `nvapi-...`
- **How to Get**: [NVIDIA Build](https://build.nvidia.com)
- **Base URL**: `https://integrate.api.nvidia.com/v1`
- **Environment Variable**: `NVIDIA_API_KEY`

### E. Groq (Ultra-Fast)
- **Preset Model**: `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`
- **Key Format**: `gsk_...`
- **How to Get**: [Groq Console](https://console.groq.com/keys)
- **Base URL**: `https://api.groq.com/openai/v1`
- **Strengths**: 500+ tokens/second inference speed.

### F. Local Ollama / Self-Hosted Models
- **Preset Model**: `llama3.2`, `deepseek-r1`, `mistral`, `qwen2.5`
- **Base URL**: `http://localhost:11434/v1`
- **API Key**: Any dummy string (e.g. `ollama`)
- **Strengths**: 100% private, zero cost, completely offline.

---

## 2. Server `.env.local` Example

If you want the server to automatically use your keys without entering them in the web UI, create a `.env.local` file in the project root:

```env
# Primary Provider (Pick one or configure all)
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
NVIDIA_API_KEY=nvapi-...
GROQ_API_KEY=gsk_...
```

---

## 3. How to Test Connection in the Web UI

1. Open `http://localhost:3000`.
2. Click the **"Configure AI"** button in the top navigation bar.
3. Select your provider chip.
4. Enter your API key and choose a model.
5. Click **"Test Connection"** — the app will perform a live verification ping against that provider.
6. Click **"Save & Apply"**.
