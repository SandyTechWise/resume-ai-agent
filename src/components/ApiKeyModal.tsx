import React, { useState, useEffect, useCallback } from 'react';
import { LLMConfig, LLMProvider, DiscoveredModel } from '@/types/llm';
import { PROVIDER_METADATA, ProviderMetadata } from '@/constants/llm';
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
  CheckCircle2
} from 'lucide-react';

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: LLMConfig;
  onSaveConfig?: (config: LLMConfig) => void;
  apiKey?: string;
  onSaveKey?: (key: string) => void;
}

interface ModalDialogContentProps {
  onClose: () => void;
  config?: LLMConfig;
  onSaveConfig?: (config: LLMConfig) => void;
  propApiKey?: string;
  onSaveKey?: (key: string) => void;
}

const ApiKeyModalDialog: React.FC<ModalDialogContentProps> = ({
  onClose,
  config,
  onSaveConfig,
  propApiKey,
  onSaveKey
}) => {
  const initialProvider: LLMProvider = config?.provider || 'gemini';
  const [provider, setProvider] = useState<LLMProvider>(initialProvider);
  const [apiKey, setApiKey] = useState<string>(config?.apiKey || propApiKey || '');
  const [model, setModel] = useState<string>(config?.model || '');
  const [baseUrl, setBaseUrl] = useState<string>(
    config?.baseUrl || PROVIDER_METADATA[initialProvider]?.defaultBaseUrl || ''
  );
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

  const currentMeta: ProviderMetadata = PROVIDER_METADATA[provider];

  const fetchLiveModels = useCallback(async (
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
          activeOnly: false
        })
      });

      const data = await res.json() as { success?: boolean; models?: DiscoveredModel[]; error?: string };
      if (res.ok && data.success && Array.isArray(data.models) && data.models.length > 0) {
        setLiveModels(data.models);
        
        // Auto-select first active model if no model currently set or current model not found
        const currentModelExists = data.models.some((m: DiscoveredModel) => m.id === model);
        if (!currentModelExists && data.models[0]?.id) {
          setModel(data.models[0].id);
        }
      } else {
        setModelsFetchError(data.error || 'Failed to fetch live models from provider.');
        setLiveModels([]);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error connecting to model provider API';
      setModelsFetchError(errorMsg);
      setLiveModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [provider, apiKey, baseUrl, model]);

  // Initial live models query on mount if key exists
  useEffect(() => {
    const keyToQuery = config?.apiKey || propApiKey || '';
    if (keyToQuery && keyToQuery.trim().length > 5) {
      queueMicrotask(() => {
        void fetchLiveModels(initialProvider, keyToQuery, config?.baseUrl || PROVIDER_METADATA[initialProvider]?.defaultBaseUrl || '');
      });
    }
  }, [config?.apiKey, config?.baseUrl, initialProvider, propApiKey, fetchLiveModels]);

  // Keyboard accessibility: close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleProviderChange = (p: LLMProvider) => {
    setProvider(p);
    const newMeta = PROVIDER_METADATA[p];
    setModel('');
    setBaseUrl(newMeta?.defaultBaseUrl || '');
    setIsCustomModel(false);
    setTestStatus('idle');
    setModelTestStatus('idle');
    setLiveModels([]);
    setModelsFetchError(null);
    setSearchQuery('');

    if (apiKey && apiKey.trim().length > 5) {
      void fetchLiveModels(p, apiKey, newMeta?.defaultBaseUrl);
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

      const data = await res.json() as { modelTest?: { ok: boolean; error?: string }; error?: string };
      if (res.ok && data.modelTest?.ok) {
        setModelTestStatus('success');
        setModelTestMessage(`Verified! ${model} is active and callable on your account.`);
      } else {
        setModelTestStatus('error');
        setModelTestMessage(data.modelTest?.error || data.error || `Model "${model}" could not be verified.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Model verification ping failed';
      setModelTestStatus('error');
      setModelTestMessage(msg);
    }
  };

  const handleSave = () => {
    const finalConfig: LLMConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      baseUrl: baseUrl.trim() || currentMeta.defaultBaseUrl
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
            model: model.trim(),
            baseUrl: baseUrl.trim() || currentMeta.defaultBaseUrl
          }
        })
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Connection failed');
      }
      setTestStatus('success');
    } catch (e: unknown) {
      setTestStatus('error');
      setTestError(e instanceof Error ? e.message : 'Connection test failed');
    }
  };

  // Filtered displayed models based on activeOnly toggle & search query
  const displayedModels = liveModels.filter((m) => {
    if (activeOnly && m.status === 'deprecated') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return m.id.toLowerCase().includes(q) || m.label.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose} 
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="presentation"
    >
      <div 
        className="modal-card wide-modal" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-ai-engine"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <Cpu size={18} className="text-accent" />
            <h3 id="modal-title-ai-engine" className="modal-title">AI Engine & Dynamic Model Directory</h3>
          </div>
          <button 
            type="button" 
            className="btn-close-modal" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <p className="modal-description">
            Connect any AI provider. Enter your API key to <strong>dynamically retrieve the live models</strong> available directly on your provider account.
          </p>

          {/* Provider Selection */}
          <div className="input-group">
            <span className="field-label">1. Select AI Provider</span>
            <div className="provider-grid">
              {(Object.keys(PROVIDER_METADATA) as LLMProvider[]).map((p) => {
                const meta = PROVIDER_METADATA[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleProviderChange(p)}
                    className={`provider-chip ${provider === p ? 'provider-active' : ''}`}
                  >
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Input */}
          <div className="input-group">
            <div className="flex justify-between items-center">
              <label htmlFor="modal-provider-api-key" className="field-label">2. {currentMeta.label} API Key</label>
              <a
                href={currentMeta.docUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-accent underline flex items-center gap-1"
              >
                Get API Key <ExternalLink size={10} />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                id="modal-provider-api-key"
                type="password"
                className="input-text font-mono flex-1"
                placeholder={currentMeta.keyPlaceholder}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onBlur={() => { void fetchLiveModels(); }}
              />
              <button
                type="button"
                onClick={() => { void fetchLiveModels(); }}
                disabled={!apiKey || isLoadingModels}
                className="btn-fetch-models"
                title="Query your account to fetch available models dynamically"
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

          {/* Model Selection with Live Dynamic Feedback */}
          <div className="input-group">
            <div className="flex justify-between items-center mb-0.5">
              <div className="flex items-center gap-1.5">
                <label htmlFor={isCustomModel ? "modal-custom-model-input" : "modal-select-model-dropdown"} className="field-label mb-0">
                  3. Select Model
                </label>
                {liveModels.length > 0 && !isLoadingModels && (
                  <span className="live-models-tag">
                    <Radio size={10} className="text-success animate-pulse" />
                    <span>{displayedModels.length} Models Retrieved Dynamically</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModel(!isCustomModel)}
                className="text-xs text-accent underline"
              >
                {isCustomModel ? 'Pick from Retrieved List' : 'Enter Custom Model Identifier'}
              </button>
            </div>

            {/* Quick Filter & Active Toggle Bar */}
            {!isCustomModel && liveModels.length > 0 && (
              <div className="model-filter-row">
                <input
                  type="text"
                  placeholder="Filter retrieved models..."
                  className="model-search-input font-mono"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Filter retrieved models"
                />
                <label htmlFor="modal-toggle-active-models" className="model-toggle-label" title="Hide retired and unavailable models">
                  <input
                    id="modal-toggle-active-models"
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
                id="modal-custom-model-input"
                type="text"
                className="input-text font-mono"
                placeholder="e.g. meta/llama-3.3-70b-instruct or model-id"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setModelTestStatus('idle');
                }}
              />
            ) : (
              <select
                id="modal-select-model-dropdown"
                className="input-text"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setModelTestStatus('idle');
                }}
                disabled={isLoadingModels || (liveModels.length === 0 && !model)}
              >
                {liveModels.length > 0 ? (
                  displayedModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))
                ) : model ? (
                  <option value={model}>{model} (Saved Model)</option>
                ) : (
                  <option value="" disabled>
                    No models loaded — enter your API key and click &quot;Fetch Live Models&quot;
                  </option>
                )}
              </select>
            )}

            {/* Inline Model Verification Button */}
            {model && (
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
            )}

            {modelsFetchError && (
              <span className="text-warning text-xs mt-1 block">
                Notice: {modelsFetchError}
              </span>
            )}
          </div>

          {/* Base URL (for NVIDIA NIM, OpenRouter, Custom / Ollama) */}
          {(currentMeta.requiresBaseUrl || provider === 'groq' || provider === 'openrouter') && (
            <div className="input-group">
              <label htmlFor="modal-base-url-input" className="field-label flex items-center gap-1">
                <Server size={12} />
                <span>API Endpoint Base URL</span>
              </label>
              <input
                id="modal-base-url-input"
                type="text"
                className="input-text font-mono text-xs"
                placeholder={currentMeta.defaultBaseUrl || 'https://api...'}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
          )}

          {/* Full Connection Test Status Feedback */}
          {testStatus === 'success' && (
            <div className="security-notice" style={{ borderColor: '#10b981', color: '#6ee7b7' }}>
              <Check size={15} className="text-success" />
              <span>Pipeline Verified! Successfully contacted {currentMeta.label} ({model}).</span>
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
              Your credentials are saved locally in your browser (<code className="code-tag">localStorage</code>) and used solely for direct inference calls. Never committed or logged.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer justify-between">
          <button
            type="button"
            className="btn-secondary flex items-center gap-1"
            onClick={handleTestConnection}
            disabled={!apiKey || !model || testStatus === 'testing'}
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

export const ApiKeyModal: React.FC<AiConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  apiKey: propApiKey,
  onSaveKey
}) => {
  if (!isOpen) return null;

  return (
    <ApiKeyModalDialog
      onClose={onClose}
      config={config}
      onSaveConfig={onSaveConfig}
      propApiKey={propApiKey}
      onSaveKey={onSaveKey}
    />
  );
};
