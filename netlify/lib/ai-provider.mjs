// AI provider layer. The Netlify function only calls `createProvider(env)`
// and `provider.generate(...)`; everything provider-specific lives here, so a
// different provider can be added as another adapter without touching the
// function or the React app.
import Anthropic from '@anthropic-ai/sdk';

export const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-5';

// Models that support the server-side refusal fallback (`fallbacks: "default"`).
const FALLBACK_MODELS = new Set(['claude-opus-5', 'claude-fable-5-1']);

const REQUEST_TIMEOUT_MS = 22_000;

/** Thrown for any provider failure. `kind` is safe to log; nothing here is sent to the browser. */
export class ProviderError extends Error {
  constructor(kind, message, { status, cause } = {}) {
    super(message, { cause });
    this.name = 'ProviderError';
    this.kind = kind; // config | auth | rate_limit | timeout | upstream | bad_output
    this.status = status;
  }
}

export function createProvider(env) {
  const name = (env.AI_PROVIDER || 'anthropic').trim().toLowerCase();
  if (!env.AI_API_KEY) {
    throw new ProviderError('config', 'AI_API_KEY is not set');
  }
  if (name === 'anthropic') {
    return createAnthropicProvider({ apiKey: env.AI_API_KEY, model: env.AI_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL });
  }
  throw new ProviderError('config', `Unsupported AI_PROVIDER "${name}"`);
}

function createAnthropicProvider({ apiKey, model }) {
  const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 1 });
  const useFallbacks = FALLBACK_MODELS.has(model);
  const supportsEffort = !model.includes('haiku');

  return {
    name: 'anthropic',
    model,
    /**
     * @param {{ system: string, messages: {role: 'user'|'assistant', content: string | {type: 'text', text: string}[]}[], schema: object, maxTokens: number }} input
     * @returns {Promise<{ data: unknown, refused: boolean, usage: object }>}
     */
    async generate({ system, messages, schema, maxTokens }) {
      const params = {
        model,
        max_tokens: maxTokens,
        // Stable system prompt with a cache breakpoint: repeat visitors'
        // requests reuse the cached knowledge context at a fraction of the cost.
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages,
        output_config: {
          ...(supportsEffort ? { effort: 'low' } : {}),
          format: { type: 'json_schema', schema },
        },
      };

      let response;
      try {
        response = useFallbacks
          ? await client.beta.messages.create({
              ...params,
              betas: ['server-side-fallback-2026-07-01'],
              fallbacks: 'default',
            })
          : await client.messages.create(params);
      } catch (error) {
        throw toProviderError(error);
      }

      const usage = {
        model: response.model,
        input: response.usage?.input_tokens,
        output: response.usage?.output_tokens,
        cacheRead: response.usage?.cache_read_input_tokens,
        cacheWrite: response.usage?.cache_creation_input_tokens,
      };

      if (response.stop_reason === 'refusal') {
        return { data: null, refused: true, usage };
      }
      if (response.stop_reason === 'max_tokens') {
        throw new ProviderError('bad_output', 'Response hit max_tokens before completing');
      }

      const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');
      try {
        return { data: JSON.parse(text), refused: false, usage };
      } catch (error) {
        throw new ProviderError('bad_output', 'Response was not valid JSON', { cause: error });
      }
    },
  };
}

function toProviderError(error) {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return new ProviderError('auth', 'Provider rejected the API key', { status: error.status });
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new ProviderError('rate_limit', 'Provider rate limit reached', { status: error.status });
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new ProviderError('timeout', 'Provider request timed out');
  }
  if (error instanceof Anthropic.BadRequestError || error instanceof Anthropic.NotFoundError) {
    // Usually a configuration problem (e.g. an invalid AI_MODEL).
    return new ProviderError('config', `Provider rejected the request: ${error.message}`, { status: error.status });
  }
  if (error instanceof Anthropic.APIError) {
    return new ProviderError('upstream', `Provider error: ${error.message}`, { status: error.status });
  }
  return new ProviderError('upstream', 'Unexpected provider failure', { cause: error });
}
