import { NextRequest, NextResponse } from 'next/server';
import { LLMProvider, PROVIDER_PRESETS, DiscoveredModel } from '@/types/llm';

export async function POST(req: NextRequest) {
  let provider: LLMProvider = 'gemini';
  try {
    const body = await req.json();
    provider = body.provider || 'gemini';
    const { 
      apiKey, 
      baseUrl, 
      activeOnly = true,
      testModel
    } = body as {
      apiKey: string;
      baseUrl?: string;
      activeOnly?: boolean;
      testModel?: string;
    };

    if (!apiKey || apiKey.trim().length < 3) {
      return NextResponse.json(
        { error: 'A valid API key is required to retrieve models.' },
        { status: 400 }
      );
    }

    const cleanKey = apiKey.trim();
    const preset = PROVIDER_PRESETS[provider];

    // Optional Quick Model Availability Ping
    if (testModel) {
      try {
        if (provider === 'gemini') {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: cleanKey });
          await ai.models.generateContent({
            model: testModel,
            contents: 'hi',
            config: { maxOutputTokens: 2 }
          });
          return NextResponse.json({
            success: true,
            modelTest: { model: testModel, ok: true }
          });
        }
      } catch (testErr: any) {
        let msg = testErr?.message || 'Model verification failed';
        try {
          const parsed = JSON.parse(msg);
          if (parsed?.error?.message) msg = parsed.error.message;
        } catch {
          // not json
        }
        return NextResponse.json({
          success: false,
          modelTest: { model: testModel, ok: false, error: msg }
        });
      }
    }

    let discoveredModels: DiscoveredModel[] = [];

    // 1. Google Gemini Live Models
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${err}`);
      }
      const data = await res.json();
      const rawList = data.models || [];

      const isGeminiDeprecated = (cleanId: string) => {
        const lower = cleanId.toLowerCase();
        // Specifically catch gemini-2.5-flash (which Google phased out for new users),
        // gemini-1.0 series, legacy gemini-pro, PaLM bison models, embedding, aqa, imagen, learnlm
        return (
          lower.includes('2.5-flash') ||
          lower.includes('1.0-') ||
          lower === 'gemini-1.0' ||
          lower === 'gemini-pro' ||
          lower === 'gemini-pro-vision' ||
          lower.includes('bison') ||
          lower.includes('embedding') ||
          lower.includes('aqa') ||
          lower.includes('imagen') ||
          lower.includes('learnlm')
        );
      };

      const parsedGemini = rawList
        .filter((m: any) => {
          const isGeneration = m.supportedGenerationMethods?.includes('generateContent');
          return isGeneration;
        })
        .map((m: any) => {
          const cleanId = m.name.replace(/^models\//, '');
          const deprecated = isGeminiDeprecated(cleanId);
          const isRecommended = cleanId.includes('3.8-flash') || cleanId === 'gemini-1.5-flash';
          
          let category: 'flagship' | 'fast' | 'reasoning' | 'general' | 'legacy' = 'general';
          if (deprecated) category = 'legacy';
          else if (cleanId.includes('3.8') || cleanId.includes('3.5')) category = 'flagship';
          else if (cleanId.includes('flash')) category = 'fast';
          else if (cleanId.includes('pro')) category = 'reasoning';

          let badge = '';
          if (cleanId.includes('3.8-flash')) badge = ' ⭐ Recommended Flagship';
          else if (cleanId === 'gemini-1.5-flash') badge = ' ⚡ Fast & Stable';
          else if (cleanId === 'gemini-1.5-pro') badge = ' 🧠 Deep Reasoning';
          else if (cleanId.includes('2.0-flash')) badge = ' 🚀 Next-Gen Multimodal';
          else if (deprecated) badge = ' ⚠️ Deprecated (Unavailable)';

          return {
            id: cleanId,
            label: `${m.displayName || cleanId}${badge}`,
            displayName: m.displayName || cleanId,
            description: m.description,
            isRecommended,
            status: deprecated ? ('deprecated' as const) : ('active' as const),
            category
          };
        });

      // Filter activeOnly if requested (default true)
      discoveredModels = activeOnly
        ? parsedGemini.filter((m: DiscoveredModel) => m.status === 'active')
        : parsedGemini;

      // Ensure flagship models exist in list even if provider returned legacy snapshot list
      const essentialGemini = [
        { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash ⭐ Recommended Flagship', displayName: 'Gemini 3.8 Flash', isRecommended: true, status: 'active' as const, category: 'flagship' as const },
        { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash ⚡ Fast & Stable', displayName: 'Gemini 1.5 Flash', isRecommended: true, status: 'active' as const, category: 'fast' as const },
        { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro 🧠 Deep Reasoning', displayName: 'Gemini 1.5 Pro', isRecommended: false, status: 'active' as const, category: 'reasoning' as const },
        { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash 🚀 Next-Gen Multimodal', displayName: 'Gemini 2.0 Flash', isRecommended: false, status: 'active' as const, category: 'flagship' as const }
      ];

      essentialGemini.forEach((def) => {
        if (!discoveredModels.some((m) => m.id === def.id)) {
          discoveredModels.unshift(def);
        }
      });

      // Sort so recommended & flagship models appear first
      discoveredModels.sort((a, b) => {
        const aId = a.id.toLowerCase();
        const bId = b.id.toLowerCase();
        if (aId.includes('3.8-flash')) return -1;
        if (bId.includes('3.8-flash')) return 1;
        if (aId.includes('1.5-flash')) return -1;
        if (bId.includes('1.5-flash')) return 1;
        if (a.status === 'active' && b.status === 'deprecated') return -1;
        if (a.status === 'deprecated' && b.status === 'active') return 1;
        return aId.localeCompare(bId);
      });
    }

    // 2. Anthropic Claude Live Models
    else if (provider === 'anthropic') {
      const targetBase = baseUrl || preset?.defaultBaseUrl || 'https://api.anthropic.com/v1';
      const url = `${targetBase.replace(/\/+$/, '')}/models`;
      const res = await fetch(url, {
        headers: {
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01'
        }
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic API error (${res.status}): ${err}`);
      }
      const data = await res.json();
      const rawList = data.data || [];
      discoveredModels = rawList.map((m: any) => {
        const id = m.id;
        const isRecommended = id.includes('3-5-haiku') || id.includes('3-7-sonnet');
        let badge = '';
        if (id.includes('3-5-haiku')) badge = ' ⚡ Recommended (Ultra-Fast)';
        else if (id.includes('3-7-sonnet')) badge = ' ⭐ Latest Flagship';
        else if (id.includes('3-5-sonnet')) badge = ' 🧠 Frontier Reasoning';

        return {
          id: m.id,
          label: `${m.display_name || m.id}${badge}`,
          displayName: m.display_name || m.id,
          isRecommended,
          status: 'active' as const,
          category: (id.includes('haiku') ? 'fast' : id.includes('sonnet') ? 'flagship' : 'general') as any
        };
      });

      discoveredModels.sort((a, b) => {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return a.id.localeCompare(b.id);
      });
    }

    // 3. OpenAI & OpenAI-Compatible (OpenAI, NVIDIA NIM, Groq, OpenRouter, Custom / Ollama)
    else {
      const targetBase = (baseUrl || preset?.defaultBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const url = `${targetBase}/models`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          ...(provider === 'openrouter' ? { 'HTTP-Referer': 'https://resumeagent.ai', 'X-Title': 'ResumeAgent AI' } : {})
        }
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`${preset?.label || provider} API error (${res.status}): ${err}`);
      }

      const data = await res.json();
      const rawList = data.data || [];

      // Filter out non-chat models (embeddings, audio, image models, legacy completions)
      const ignoredTokens = [
        'dall-e', 'whisper', 'tts', 'embedding', 'moderation', 
        'babbage', 'davinci', 'curie', 'canary', 'instruct', 'realtime', 'audio'
      ];

      discoveredModels = rawList
        .filter((m: any) => {
          const id = (m.id || '').toLowerCase();
          return !ignoredTokens.some(t => id.includes(t));
        })
        .map((m: any) => {
          const id = m.id;
          const lower = id.toLowerCase();
          const isRecommended = lower.includes('4o-mini') || lower.includes('llama-3.3-70b') || lower.includes('llama-3.1-70b');
          
          let badge = '';
          if (lower.includes('4o-mini')) badge = ' ⚡ Recommended Fast';
          else if (lower.includes('4o')) badge = ' ⭐ Flagship';
          else if (lower.includes('o3-mini') || lower.includes('o1-mini')) badge = ' 🧠 Deep Reasoning';
          else if (lower.includes('llama-3.3-70b')) badge = ' ⭐ Flagship Versatile';

          return {
            id: m.id,
            label: `${m.name || m.id}${badge}`,
            displayName: m.name || m.id,
            isRecommended,
            status: 'active' as const,
            category: (lower.includes('mini') || lower.includes('instant') ? 'fast' : lower.includes('o1') || lower.includes('o3') ? 'reasoning' : 'flagship') as any
          };
        });

      // Sort models so that modern flagship models appear first
      discoveredModels.sort((a, b) => {
        const aId = a.id.toLowerCase();
        const bId = b.id.toLowerCase();
        const isFlagshipA = aId.includes('gpt-4') || aId.includes('claude-3') || aId.includes('llama-3') || aId.includes('gemini') || aId.includes('deepseek');
        const isFlagshipB = bId.includes('gpt-4') || bId.includes('claude-3') || bId.includes('llama-3') || bId.includes('gemini') || bId.includes('deepseek');
        if (isFlagshipA && !isFlagshipB) return -1;
        if (!isFlagshipA && isFlagshipB) return 1;
        return aId.localeCompare(bId);
      });
    }

    return NextResponse.json({
      success: true,
      provider,
      activeOnly,
      count: discoveredModels.length,
      models: discoveredModels
    });
  } catch (error: any) {
    console.error('Error fetching live models:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to retrieve live models from provider.',
        fallbackModels: (provider && PROVIDER_PRESETS[provider as LLMProvider]) 
          ? PROVIDER_PRESETS[provider as LLMProvider].popularModels 
          : PROVIDER_PRESETS.gemini.popularModels
      },
      { status: 500 }
    );
  }
}
