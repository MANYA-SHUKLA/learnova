import { FEATURE_FLAGS, isFeatureEnabled } from '@learnova/feature-flags';
import { env } from '../../config/env.js';
import { AIError } from '../../utils/errors/index.js';
import { logger } from '../../utils/logger/index.js';

const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_TIMEOUT_MS = 45_000;

export interface GeminiGenerateOptions {
  prompt: string;
  maxOutputTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

interface GeminiPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  error?: { message?: string; status?: string };
}

export function ensureGeminiEnabled(): { apiKey: string; model: string } {
  if (!isFeatureEnabled(FEATURE_FLAGS.ENABLE_AI)) {
    throw new AIError(
      'AI timetable generation is disabled. Set ENABLE_AI=true and configure GEMINI_API_KEY.',
    );
  }
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new AIError('Gemini API key is not configured. Set GEMINI_API_KEY in the backend environment.');
  }
  return {
    apiKey,
    model: env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
  };
}

export function parseJsonFromModelText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new AIError('Gemini returned an empty response');
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1)) as unknown;
      } catch {
        throw new AIError('Gemini returned invalid JSON');
      }
    }
    throw new AIError('Gemini returned invalid JSON');
  }
}

function extractText(payload: GeminiResponse): string {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part) => part.text ?? '')
    .join('')
    .trim();
}

export async function generateGeminiJson(options: GeminiGenerateOptions): Promise<unknown> {
  const { apiKey, model } = ensureGeminiEnabled();
  const maxOutputTokens = options.maxOutputTokens ?? env.GEMINI_MAX_TOKENS ?? 8192;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: Math.max(maxOutputTokens, 2048),
          responseMimeType: 'application/json',
        },
      }),
    });
  } catch (err) {
    logger.warn({ err }, 'Gemini request failed');
    throw new AIError('Could not reach Gemini. Check network access and try again.');
  }

  let payload: GeminiResponse;
  try {
    payload = (await response.json()) as GeminiResponse;
  } catch {
    throw new AIError('Gemini returned a non-JSON error payload');
  }

  if (!response.ok) {
    const message = payload.error?.message || `Gemini request failed (${response.status})`;
    throw new AIError(message);
  }

  const text = extractText(payload);
  return parseJsonFromModelText(text);
}
