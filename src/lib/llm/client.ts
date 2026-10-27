import { LLMConfig, PROVIDER_PRESETS } from '@/types/llm';

export interface GenerateTextOptions {
  config: LLMConfig;
  systemPrompt?: string;
  userPrompt: string;
  jsonMode?: boolean;
}

export async function generateTextWithLLM({
  config,
  systemPrompt,
  userPrompt,
  jsonMode = false
}: GenerateTextOptions): Promise<string> {
  const provider = config.provider || 'gemini';
  const preset = PROVIDER_PRESETS[provider];
  const model = config.model || preset?.defaultModel || 'gpt-4o-mini';
  const apiKey = config.apiKey;

  if (!apiKey) {
    throw new Error(`API Key is missing for provider: ${provider}`);
  }

  // 1. Google Gemini Provider
  if (provider === 'gemini') {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\nUSER REQUEST:\n${userPrompt}`
      : userPrompt;

    // Automatically normalize deprecated or legacy Gemini models
    let targetModel = model ? model.replace(/^models\//, '') : 'gemini-3.8-flash';
    const lowerModel = targetModel.toLowerCase();
    if (
      lowerModel.includes('2.5-flash') ||
      lowerModel.includes('1.0-') ||
      lowerModel === 'gemini-1.0' ||
      lowerModel === 'gemini-pro' ||
      lowerModel === 'gemini-pro-vision'
    ) {
      console.warn(`Redirecting retired model ${targetModel} to active flagship gemini-3.8-flash`);
      targetModel = 'gemini-3.8-flash';
    }

    try {
      const res = await ai.models.generateContent({
        model: targetModel,
        contents: fullPrompt,
        config: jsonMode ? { responseMimeType: 'application/json' } : undefined
      });

      const output = res.text || '';
      return cleanJsonResponse(output);
    } catch (err: any) {
      const errString = `${err?.message || ''} ${err?.status || ''} ${JSON.stringify(err || {})}`;
      // Self-healing: if model is retired/not found, auto-fallback to active flagship or stable 1.5-flash
      if (
        errString.includes('no longer available') || 
        errString.includes('404') || 
        errString.includes('NOT_FOUND') ||
        errString.includes('not found')
      ) {
        console.warn(`Gemini model ${targetModel} returned 404/deprecated. Self-healing auto-fallback executing...`);
        try {
          const fallbackModel = targetModel === 'gemini-3.8-flash' ? 'gemini-1.5-flash' : 'gemini-3.8-flash';
          const res = await ai.models.generateContent({
            model: fallbackModel,
            contents: fullPrompt,
            config: jsonMode ? { responseMimeType: 'application/json' } : undefined
          });
          const output = res.text || '';
          return cleanJsonResponse(output);
        } catch (fallbackErr: any) {
          console.warn('Fallback failed, attempting universal gemini-1.5-flash safety net...');
          const res = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: fullPrompt,
            config: jsonMode ? { responseMimeType: 'application/json' } : undefined
          });
          const output = res.text || '';
          return cleanJsonResponse(output);
        }
      }
      
      let userFriendly = err?.message || 'Gemini API call failed';
      try {
        const parsed = JSON.parse(userFriendly);
        if (parsed?.error?.message) userFriendly = parsed.error.message;
      } catch {}
      throw new Error(userFriendly);
    }
  }

  // 2. Anthropic Claude Provider
  if (provider === 'anthropic') {
    const baseUrl = config.baseUrl || preset?.defaultBaseUrl || 'https://api.anthropic.com/v1';
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/messages`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-haiku-20241022',
        max_tokens: 4096,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const content = data.content?.[0]?.text || '';
    return cleanJsonResponse(content);
  }

  // 3. OpenAI & OpenAI-Compatible Endpoints (NVIDIA NIM, Groq, OpenRouter, Custom / Ollama)
  const baseUrl = (config.baseUrl || preset?.defaultBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const endpoint = `${baseUrl}/chat/completions`;

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const bodyPayload: any = {
    model,
    messages,
    temperature: 0.2
  };

  if (jsonMode && (provider === 'openai' || provider === 'groq' || provider === 'openrouter')) {
    bodyPayload.response_format = { type: 'json_object' };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(provider === 'openrouter' ? { 'HTTP-Referer': 'https://resumeagent.ai', 'X-Title': 'ResumeAgent AI' } : {})
    },
    body: JSON.stringify(bodyPayload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${preset?.label || provider} API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return cleanJsonResponse(text);
}

function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  // Strip ```json and ``` if returned
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}
