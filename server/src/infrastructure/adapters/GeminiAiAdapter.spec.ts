import { GoogleGenerativeAIFetchError } from '@google/generative-ai';
import { GeminiAiAdapter } from './GeminiAiAdapter';

const sendMessageStream = jest.fn();
const generateContent = jest.fn();
const getGenerativeModel = jest.fn();
const startChat = jest.fn();

jest.mock('@google/generative-ai', () => {
  const actual =
    jest.requireActual<typeof import('@google/generative-ai')>('@google/generative-ai');
  return {
    ...actual,
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({ getGenerativeModel })),
  };
});

const chunks = (...texts: string[]) => ({
  stream: (async function* () {
    for (const text of texts) yield { text: () => text };
  })(),
});
const unavailable = () =>
  new GoogleGenerativeAIFetchError('high demand', 503, 'Service Unavailable');

async function collect(generator: AsyncGenerator<string>) {
  const parts: string[] = [];
  for await (const part of generator) parts.push(part);
  return parts;
}

describe('GeminiAiAdapter', () => {
  let adapter: GeminiAiAdapter;
  let wait: jest.SpyInstance;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.GEMINI_MODEL = 'gemini-3.8-flash';
    jest.clearAllMocks();
    startChat.mockReturnValue({ sendMessageStream });
    getGenerativeModel.mockReturnValue({ startChat, generateContent });
    adapter = new GeminiAiAdapter();
    wait = jest.spyOn(adapter as any, 'wait').mockResolvedValue(undefined);
  });

  describe('streamResponse', () => {
    it('yields the answer chunk by chunk', async () => {
      sendMessageStream.mockResolvedValueOnce(chunks('Bon', 'jour'));

      await expect(collect(adapter.streamResponse({ prompt: 'Salut' }))).resolves.toEqual([
        'Bon',
        'jour',
      ]);
    });

    it('passes history, system instruction and model to Gemini', async () => {
      sendMessageStream.mockResolvedValueOnce(chunks('ok'));

      await collect(
        adapter.streamResponse({
          prompt: 'Et ensuite ?',
          history: [
            { role: 'user', text: 'Bonjour' },
            { role: 'model', text: 'Salut !' },
          ],
          systemInstruction: 'Réponds en anglais',
          model: 'gemini-pro-latest',
        }),
      );

      expect(getGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-pro-latest',
          systemInstruction: 'Réponds en anglais',
        }),
      );
      expect(startChat).toHaveBeenCalledWith({
        history: [
          { role: 'user', parts: [{ text: 'Bonjour' }] },
          { role: 'model', parts: [{ text: 'Salut !' }] },
        ],
      });
    });

    it('falls back to the default model when the requested one is not offered', async () => {
      sendMessageStream.mockResolvedValueOnce(chunks('ok'));

      await collect(adapter.streamResponse({ prompt: 'Salut', model: 'gpt-4' }));

      expect(getGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-3.8-flash' }),
      );
    });

    it('sends images and PDF as inline data and text files inside the prompt', async () => {
      sendMessageStream.mockResolvedValueOnce(chunks('ok'));

      await collect(
        adapter.streamResponse({
          prompt: 'Analyse ces fichiers',
          attachments: [
            { name: 'photo.png', mimeType: 'image/png', data: Buffer.from('png') },
            { name: 'notes.txt', mimeType: 'text/plain', data: Buffer.from('contenu texte') },
          ],
        }),
      );

      const [parts] = sendMessageStream.mock.calls[0];
      expect(parts).toEqual([
        { inlineData: { mimeType: 'image/png', data: Buffer.from('png').toString('base64') } },
        { text: expect.stringContaining('contenu texte') },
        { text: 'Analyse ces fichiers' },
      ]);
    });

    it('forwards the abort signal to the request', async () => {
      sendMessageStream.mockResolvedValueOnce(chunks('ok'));
      const controller = new AbortController();

      await collect(adapter.streamResponse({ prompt: 'Salut', signal: controller.signal }));

      expect(sendMessageStream).toHaveBeenCalledWith(expect.anything(), {
        signal: controller.signal,
      });
    });

    it('retries when Gemini is temporarily unavailable before streaming', async () => {
      sendMessageStream.mockRejectedValueOnce(unavailable()).mockResolvedValueOnce(chunks('ok'));

      await expect(collect(adapter.streamResponse({ prompt: 'Salut' }))).resolves.toEqual(['ok']);
      expect(sendMessageStream).toHaveBeenCalledTimes(2);
      expect(wait).toHaveBeenCalledTimes(1);
    });

    it('gives up after the last retry', async () => {
      sendMessageStream.mockRejectedValue(unavailable());

      await expect(collect(adapter.streamResponse({ prompt: 'Salut' }))).rejects.toThrow(
        'high demand',
      );
      expect(sendMessageStream).toHaveBeenCalledTimes(3);
    });

    it('does not retry errors that will not go away (invalid key)', async () => {
      sendMessageStream.mockRejectedValue(
        new GoogleGenerativeAIFetchError('API key not valid', 400, 'Bad Request'),
      );

      await expect(collect(adapter.streamResponse({ prompt: 'Salut' }))).rejects.toThrow();
      expect(sendMessageStream).toHaveBeenCalledTimes(1);
      expect(wait).not.toHaveBeenCalled();
    });
  });

  describe('generateTitle', () => {
    it('returns a short cleaned title', async () => {
      generateContent.mockResolvedValueOnce({
        response: { text: () => '  « Différence entre let et const. »\n' },
      });

      await expect(adapter.generateTitle('let ou const ?', 'let peut changer…')).resolves.toBe(
        'Différence entre let et const',
      );
    });

    it('returns null when Gemini fails', async () => {
      generateContent.mockRejectedValueOnce(new Error('boom'));

      await expect(adapter.generateTitle('Question', 'Réponse')).resolves.toBeNull();
    });
  });
});
