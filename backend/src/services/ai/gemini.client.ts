import { FEATURE_FLAGS, isFeatureEnabled } from '@learnova/feature-flags';
import { env } from '../../config/env.js';
import { AIError } from '../../utils/errors/index.js';
import { logger } from '../../utils/logger/index.js';

const DEFAULT_MODEL = 'gemini-2.5-flash';
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

export function isGeminiConfigured(): boolean {
  if (!isFeatureEnabled(FEATURE_FLAGS.ENABLE_AI)) return false;
  return Boolean(env.GEMINI_API_KEY?.trim());
}

export function ensureGeminiEnabled(): { apiKey: string; model: string } {
  if (!isFeatureEnabled(FEATURE_FLAGS.ENABLE_AI)) {
    throw new AIError('AI generation is not available.');
  }
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new AIError('AI is not configured. Ask an administrator to enable it.');
  }
  return {
    apiKey,
    model: env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
  };
}

function repairTruncatedJson(raw: string): unknown | null {
  let attempt = raw.trim().replace(/,\s*$/, '');
  const closers: string[] = [];
  for (const ch of attempt) {
    if (ch === '{') closers.push('}');
    else if (ch === '[') closers.push(']');
    else if (ch === '}' || ch === ']') closers.pop();
  }
  attempt += closers.reverse().join('');
  try {
    return JSON.parse(attempt) as unknown;
  } catch {
    return null;
  }
}

export function parseJsonFromModelText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new AIError('AI returned an empty response');
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
        const repaired = repairTruncatedJson(raw.slice(start));
        if (repaired) return repaired;
        throw new AIError('AI returned an invalid response');
      }
    }
    const repaired = start >= 0 ? repairTruncatedJson(raw.slice(start)) : null;
    if (repaired) return repaired;
    throw new AIError('AI returned an invalid response');
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
    throw new AIError('Could not reach the AI service. Try again.');
  }

  let payload: GeminiResponse;
  try {
    payload = (await response.json()) as GeminiResponse;
  } catch {
    throw new AIError('AI service returned an unexpected error');
  }

  if (!response.ok) {
    logger.warn(
      { status: response.status, message: payload.error?.message },
      'AI request failed',
    );
    throw new AIError('AI request failed. Try again.');
  }

  const finishReason = payload.candidates?.[0]?.finishReason;
  const text = extractText(payload);
  if (!text) {
    logger.warn({ finishReason }, 'Gemini returned no text');
    throw new AIError('AI returned an empty response');
  }
  try {
    return parseJsonFromModelText(text);
  } catch (err) {
    logger.warn(
      {
        finishReason,
        responseChars: text.length,
        err: err instanceof Error ? err.message : err,
      },
      'Gemini JSON parse failed',
    );
    throw err;
  }
}
