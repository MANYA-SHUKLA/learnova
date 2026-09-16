import { afterEach, describe, expect, it, vi } from 'vitest';

const isFeatureEnabled = vi.fn();
const envState: Record<string, string | number | undefined> = {
  GEMINI_API_KEY: 'test-key',
  GEMINI_MODEL: 'gemini-2.0-flash',
  GEMINI_MAX_TOKENS: 2048,
};

vi.mock('@learnova/feature-flags', () => ({
  FEATURE_FLAGS: { ENABLE_AI: 'ENABLE_AI' },
  isFeatureEnabled: (...args: unknown[]) => isFeatureEnabled(...args),
}));

vi.mock('../../config/env.js', () => ({
  env: new Proxy(
    {},
    {
      get: (_target, prop: string) => envState[prop],
    },
  ),
}));

vi.mock('../../utils/logger/index.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import {
  generateGeminiJson,
  parseJsonFromModelText,
} from '../../services/ai/gemini.client.js';
import { AIError } from '../../utils/errors/index.js';

describe('gemini client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    isFeatureEnabled.mockReset();
    envState.GEMINI_API_KEY = 'test-key';
  });

  it('parses fenced JSON from model text', () => {
    const parsed = parseJsonFromModelText('```json\n{"ok":true}\n```');
    expect(parsed).toEqual({ ok: true });
  });

  it('extracts a JSON object from surrounding prose', () => {
    const parsed = parseJsonFromModelText('Here you go: {"slots":[]} thanks');
    expect(parsed).toEqual({ slots: [] });
  });

  it('throws when ENABLE_AI is off', async () => {
    isFeatureEnabled.mockReturnValue(false);
    await expect(generateGeminiJson({ prompt: 'hi' })).rejects.toBeInstanceOf(AIError);
  });

  it('throws when the API key is missing', async () => {
    isFeatureEnabled.mockReturnValue(true);
    envState.GEMINI_API_KEY = undefined;
    await expect(generateGeminiJson({ prompt: 'hi' })).rejects.toBeInstanceOf(AIError);
  });

  it('calls Gemini generateContent and returns JSON', async () => {
    isFeatureEnabled.mockReturnValue(true);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"hello":"world"}' }] } }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateGeminiJson({ prompt: 'make json' });
    expect(result).toEqual({ hello: 'world' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0]?.[0]);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(url).toContain('gemini-2.0-flash:generateContent');
    expect(url).not.toContain('test-key');
    expect(init.headers).toMatchObject({ 'x-goog-api-key': 'test-key' });
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
    };
    expect(body.contents[0]?.parts[0]?.text).toBe('make json');
  });
});
