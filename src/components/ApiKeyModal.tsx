import React, { useState, useEffect } from 'react';
import { LLMConfig, LLMProvider, PROVIDER_PRESETS, DiscoveredModel } from '@/types/llm';
import { 
  Cpu, 
  ShieldCheck, 
  ExternalLink, 
  X, 
  Check, 
  Server, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  Radio, 
  Search, 
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: LLMConfig;
  onSaveConfig?: (config: LLMConfig) => void;
  apiKey?: string;
  onSaveKey?: (key: string) => void;
}

export const ApiKeyModal: React.FC<AiConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  apiKey: propApiKey,
  onSaveKey
}) => {
  const [provider, setProvider] = useState<LLMProvider>(config?.provider || 'gemini');
  const [apiKey, setApiKey] = useState<string>(config?.apiKey || propApiKey || '');
  const [model, setModel] = useState<string>(config?.model || PROVIDER_PRESETS.gemini.defaultModel);
  const [baseUrl, setBaseUrl] = useState<string>(config?.baseUrl || '');
  const [isCustomModel, setIsCustomModel] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  
  // Connection testing state
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string>('');

  // Live models & Filtering state
  const [liveModels, setLiveModels] = useState<DiscoveredModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [modelsFetchError, setModelsFetchError] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Individual model verification ping
  const [modelTestStatus, setModelTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [modelTestMessage, setModelTestMessage] = useState<string>('');

  useEffect(() => {
    if (config) {
      const activeP = config.provider || 'gemini';
      setProvider(activeP);
      const activeKey = config.apiKey || propApiKey || '';
      setApiKey(activeKey);
      
      // Auto-migrate retired gemini-2.5-flash
      let safeModel = config.model || PROVIDER_PRESETS[activeP].defaultModel;
      if (safeModel.includes('2.5-flash')) {
        safeModel = 'gemini-3.8-flash';
      }
      setModel(safeModel);
      setBaseUrl(config.baseUrl || PROVIDER_PRESETS[activeP].defaultBaseUrl || '');

      if (activeKey && activeKey.trim().length > 5) {
        fetchLiveModels(activeP, activeKey, config.baseUrl);
      }
    }
  }, [config, isOpen]);

  const currentPreset = PROVIDER_PRESETS[provider];

  const fetchLiveModels = async (
    targetProvider = provider,
    targetKey = apiKey,
    targetBaseUrl = baseUrl
  ) => {
    if (!targetKey || targetKey.trim().length < 5) return;

    setIsLoadingModels(true);
    setModelsFetchError(null);
    setModelTestStatus('idle');

    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: targetProvider,
          apiKey: targetKey.trim(),
          baseUrl: targetBaseUrl.trim() || undefined,
          activeOnly: false // Fetch all and filter client-side for immediate responsive toggling
        })
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.models) && data.models.length > 0) {
        setLiveModels(data.models);
        
        // If current model is deprecated or not available, auto-switch to top recommended active model
        const currentModelMeta = data.models.find((m: DiscoveredModel) => m.id === model);
        if (!currentModelMeta || currentModelMeta.status === 'deprecated') {
          const firstRecommended = data.models.find((m: DiscoveredModel) => m.isRecommended && m.status === 'active') || data.models.find((m: DiscoveredModel) => m.status === 'active');
          if (firstRecommended?.id) {
            setModel(firstRecommended.id);
          }
        }
      } else {
        setModelsFetchError(data.error || 'Failed to fetch live models');
        setLiveModels([]);
      }
    } catch (err: any) {
      console.warn('Live models fetch error:', err);
      setModelsFetchError(err.message || 'Error connecting to model provider API');
      setLiveModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleProviderChange = (p: LLMProvider) => {
    setProvider(p);
    const newPreset = PROVIDER_PRESETS[p];
    setModel(newPreset.defaultModel);
    setBaseUrl(newPreset.defaultBaseUrl || '');
    setIsCustomModel(false);
    setTestStatus('idle');
    setModelTestStatus('idle');
    setLiveModels([]);
    setModelsFetchError(null);
    setSearchQuery('');

    if (apiKey && apiKey.trim().length > 5) {
      fetchLiveModels(p, apiKey, newPreset.defaultBaseUrl);
    }
  };

  const handleTestSingleModel = async () => {
    if (!apiKey || !model) return;
    setModelTestStatus('testing');
    setModelTestMessage('');

    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim() || undefined,
          testModel: model.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.modelTest?.ok) {
        setModelTestStatus('success');
        setModelTestMessage(`Verified! ${model} is active and callable on your account.`);
      } else {
        setModelTestStatus('error');
        setModelTestMessage(data.modelTest?.error || data.error || `Model ${model} is unavailable.`);
      }
    } catch (err: any) {
      setModelTestStatus('error');
      setModelTestMessage(err.message || 'Model ping test failed');
    }
  };

  const handleSave = () => {
    const finalConfig: LLMConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || currentPreset.defaultModel,
      baseUrl: baseUrl.trim() || currentPreset.defaultBaseUrl
    };
    if (onSaveConfig) {
      onSaveConfig(finalConfig);
    }
    if (onSaveKey) {
      onSaveKey(apiKey.trim());
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestError('');
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: {
            basics: { name: 'Ping Test', headline: 'Ping', email: 'ping@test.com', phone: '123', location: 'Test' },
            summary: 'Ping test',
            experience: [],
            education: [],
            skills: [],
            projects: [],
            certifications: []
          },
          llmConfig: {
            provider,
            apiKey: apiKey.trim(),
            model: model.trim() || currentPreset.defaultModel,
            baseUrl: baseUrl.trim() || currentPreset.defaultBaseUrl
          }
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Connection failed');
      }
      setTestStatus('success');
    } catch (e: any) {
      setTestStatus('error');
      setTestError(e.message || 'Connection test failed');
    }
  };

  // Deprecated model warning check
  const isSelectedDeprecated = (() => {
    const clean = (model || '').toLowerCase();
    if (provider === 'gemini') {
      return (
        clean.includes('2.5-flash') || 
        clean.includes('1.0-') || 
        clean === 'gemini-pro' || 
        clean === 'gemini-pro-vision'
      );
    }
    const matched = liveModels.find(m => m.id === model);
    return matched?.status === 'deprecated';
  })();

  // Filtered displayed models based on activeOnly toggle & search query
  const displayedModels = (() => {
    const sourceList = liveModels.length > 0 
      ? liveModels 
      : currentPreset.popularModels.map(id => ({
          id,
          label: `${id} ${id === currentPreset.defaultModel ? '⭐ Recommended' : ''}`,
          status: 'active' as const,
          isRecommended: id === currentPreset.defaultModel
        }));

    return sourceList.filter(m => {
      if (activeOnly && m.status === 'deprecated') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return m.id.toLowerCase().includes(q) || m.label.toLowerCase().includes(q);
      }
      return true;
    });
  })();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <Cpu size={18} className="text-accent" />
            <h3 className="modal-title">AI Engine & Live Model Directory</h3>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <p className="modal-description">
            Connect any AI provider. Enter your API key and we will <strong>dynamically retrieve the latest available models</strong> directly from your provider account with automated deprecation filtering.
          </p>

          {/* Provider Selection */}
          <div className="input-group">
            <label className="field-label">1. Select AI Provider</label>
            <div className="provider-grid">
              {(Object.keys(PROVIDER_PRESETS) as LLMProvider[]).map((p) => {
                const preset = PROVIDER_PRESETS[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleProviderChange(p)}
                    className={`provider-chip ${provider === p ? 'provider-active' : ''}`}
                  >
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Input */}
          <div className="input-group">
            <div className="flex justify-between items-center">
              <label className="field-label">2. {currentPreset.label} API Key</label>
              {provider === 'gemini' && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent underline flex items-center gap-1"
                >
                  Get Gemini Key <ExternalLink size={10} />
                </a>
              )}
              {provider === 'nvidia' && (
                <a
                  href="https://build.nvidia.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent underline flex items-center gap-1"
                >
                  Get NVIDIA Key <ExternalLink size={10} />
                </a>
              )}
              {provider === 'anthropic' && (
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent underline flex items-center gap-1"
                >
                  Anthropic Console <ExternalLink size={10} />
                </a>
              )}
              {provider === 'groq' && (
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent underline flex items-center gap-1"
                >
                  Get Groq Key <ExternalLink size={10} />
                </a>
              )}
              {provider === 'openai' && (
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent underline flex items-center gap-1"
                >
                  OpenAI Console <ExternalLink size={10} />
                </a>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                className="input-text font-mono flex-1"
                placeholder={currentPreset.keyPlaceholder}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onBlur={() => fetchLiveModels()}
              />
              <button
                type="button"
                onClick={() => fetchLiveModels()}
                disabled={!apiKey || isLoadingModels}
                className="btn-fetch-models"
                title="Fetch currently available models from provider account"
              >
                {isLoadingModels ? (
                  <RefreshCw size={13} className="animate-spin text-accent" />
                ) : (
                  <RefreshCw size={13} />
                )}
                <span>{isLoadingModels ? 'Fetching...' : 'Fetch Live Models'}</span>
              </button>
            </div>
          </div>

          {/* Model Selection with Live Fetch Feedback & Filtering */}
          <div className="input-group">
            <div className="flex justify-between items-center mb-0.5">
              <div className="flex items-center gap-1.5">
                <label className="field-label mb-0">3. Select Model</label>
                {liveModels.length > 0 && !isLoadingModels && (
                  <span className="live-models-tag">
                    <Radio size={10} className="text-success animate-pulse" />
                    <span>{displayedModels.length} Models Available</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModel(!isCustomModel)}
                className="text-xs text-accent underline"
              >
                {isCustomModel ? 'Pick from List' : 'Type Custom Model'}
              </button>
            </div>

            {/* Quick Filter & Active Toggle Bar */}
            {!isCustomModel && (
              <div className="model-filter-row">
                <input
                  type="text"
                  placeholder="Filter models (e.g. 3.8, flash, gpt-4, haiku)..."
                  className="model-search-input font-mono"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <label className="model-toggle-label" title="Hide retired and unavailable models">
                  <input
                    type="checkbox"
                    checked={activeOnly}
                    onChange={(e) => setActiveOnly(e.target.checked)}
                  />
                  <span>Active Only</span>
                </label>
              </div>
            )}

            {isCustomModel ? (
              <input
                type="text"
                className="input-text font-mono"
                placeholder="e.g. gemini-3.8-flash, meta/llama-3.3-70b-instruct or fine-tune-id"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setModelTestStatus('idle');
                }}
              />
            ) : (
              <select
                className="input-text"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setModelTestStatus('idle');
                }}
                disabled={isLoadingModels}
              >
                {displayedModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}

            {/* Deprecation Warning Banner if selected model is known to be phased out */}
            {isSelectedDeprecated && (
              <div className="model-deprecation-warning">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>
                    <strong>Unavailable Model:</strong> {model} has been retired/restricted by the provider and will return 404 errors.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-switch-recommended"
                  onClick={() => {
                    setModel(currentPreset.defaultModel);
                    setModelTestStatus('idle');
                  }}
                >
                  Switch to {currentPreset.defaultModel}
                </button>
              </div>
            )}

            {/* Inline Model Verification Button */}
            <div className="flex items-center justify-between mt-1">
              <button
                type="button"
                onClick={handleTestSingleModel}
                disabled={!apiKey || !model || modelTestStatus === 'testing'}
                className="text-xs text-accent underline flex items-center gap-1 cursor-pointer"
              >
                {modelTestStatus === 'testing' ? (
                  <>
                    <RefreshCw size={11} className="animate-spin" />
                    <span>Verifying {model}...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={11} />
                    <span>Verify Selected Model ({model})</span>
                  </>
                )}
              </button>

              {modelTestStatus === 'success' && (
                <span className="model-ping-badge success">
                  <Check size={12} />
                  <span>{modelTestMessage}</span>
                </span>
              )}

              {modelTestStatus === 'error' && (
                <span className="model-ping-badge error">
                  <AlertCircle size={12} />
                  <span>{modelTestMessage}</span>
                </span>
              )}
            </div>

            {modelsFetchError && (
              <span className="text-warning text-xs mt-1 block">
                Notice: Could not fetch real-time directory ({modelsFetchError}). Falling back to standard catalog.
              </span>
            )}
          </div>

          {/* Base URL (for NVIDIA NIM, OpenRouter, Custom / Ollama) */}
          {(provider === 'nvidia' || provider === 'custom' || provider === 'openrouter' || provider === 'groq') && (
            <div className="input-group">
              <label className="field-label flex items-center gap-1">
                <Server size={12} />
                <span>API Endpoint Base URL</span>
              </label>
              <input
                type="text"
                className="input-text font-mono text-xs"
                placeholder={currentPreset.defaultBaseUrl || 'https://api...'}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
          )}

          {/* Full Connection Test Status Feedback */}
          {testStatus === 'success' && (
            <div className="security-notice" style={{ borderColor: '#10b981', color: '#6ee7b7' }}>
              <Check size={15} className="text-success" />
              <span>Full Pipeline Verified! Successfully contacted {currentPreset.label} ({model}).</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="error-alert">
              <AlertCircle size={15} />
              <span>{testError}</span>
            </div>
          )}

          {/* Security Notice */}
          <div className="security-notice">
            <ShieldCheck size={16} className="text-success" />
            <p>
              Your keys and configurations are saved locally in your browser (<code className="code-tag">localStorage</code>) and used solely for direct model inference.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer justify-between">
          <button
            type="button"
            className="btn-secondary flex items-center gap-1"
            onClick={handleTestConnection}
            disabled={!apiKey || testStatus === 'testing'}
          >
            {testStatus === 'testing' ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Full Connection Test</span>
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSave}>
              {saved ? (
                <>
                  <Check size={15} />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save & Apply</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
