import { GoogleGenerativeAIFetchError } from '@google/generative-ai';
import { GeminiAiAdapter } from './GeminiAiAdapter';

const sendMessage = jest.fn();

jest.mock('@google/generative-ai', () => {
  const actual =
    jest.requireActual<typeof import('@google/generative-ai')>('@google/generative-ai');
  return {
    ...actual,
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: () => ({ startChat: () => ({ sendMessage }) }),
    })),
  };
});

const reply = (text: string) => ({ response: { text: () => text } });
const unavailable = () =>
  new GoogleGenerativeAIFetchError('high demand', 503, 'Service Unavailable');

describe('GeminiAiAdapter', () => {
  let adapter: GeminiAiAdapter;
  let wait: jest.SpyInstance;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    sendMessage.mockReset();
    adapter = new GeminiAiAdapter();
    wait = jest.spyOn(adapter as any, 'wait').mockResolvedValue(undefined);
  });

  it('returns the model response', async () => {
    sendMessage.mockResolvedValueOnce(reply('Bonjour'));

    await expect(adapter.getAiResponse('Salut')).resolves.toBe('Bonjour');
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it('retries when Gemini is temporarily unavailable', async () => {
    sendMessage.mockRejectedValueOnce(unavailable()).mockResolvedValueOnce(reply('Bonjour'));

    await expect(adapter.getAiResponse('Salut')).resolves.toBe('Bonjour');
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledTimes(1);
  });

  it('gives up with a fallback message after the last retry', async () => {
    sendMessage.mockRejectedValue(unavailable());

    await expect(adapter.getAiResponse('Salut')).resolves.toMatch(/Désolé/);
    expect(sendMessage).toHaveBeenCalledTimes(3);
  });

  it('does not retry errors that will not go away (invalid key)', async () => {
    sendMessage.mockRejectedValue(
      new GoogleGenerativeAIFetchError('API key not valid', 400, 'Bad Request'),
    );

    await expect(adapter.getAiResponse('Salut')).resolves.toMatch(/Désolé/);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(wait).not.toHaveBeenCalled();
  });
});
