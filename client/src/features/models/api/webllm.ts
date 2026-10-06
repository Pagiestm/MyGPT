import type { AiModel } from '../types/ai';
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  formatVram,
  toWebllmId,
  withBrowserPrefix,
  type ModelDownload,
} from '../types/webgpu';
import { createReasoningFilter, stripReasoning } from '@/features/models/lib/reasoning';

export interface LibraryFacts {
  vramMb: number;
  contextWindow: number | null;
  lowResource: boolean;
  requiredFeatures: string[];
}

export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

type Lib = typeof import('@mlc-ai/web-llm');
type Engine = Awaited<ReturnType<Lib['CreateWebWorkerMLCEngine']>>;

export class WebgpuUnavailableError extends Error {
  constructor() {
    super(
      'Ce navigateur ne gère pas WebGPU. Essayez Chrome, Edge, Safari 26+ ou Firefox récent, ' +
        'ou choisissez un modèle en ligne.',
    );
    this.name = 'WebgpuUnavailableError';
  }
}

type ProgressListener = (download: ModelDownload | null) => void;

const listeners = new Set<ProgressListener>();
let current: ModelDownload | null = null;

function publish(download: ModelDownload | null) {
  current = download;
  for (const listener of listeners) listener(download);
}

export function onModelDownload(listener: ProgressListener) {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
}

export function isWebgpuSupported(): boolean {
  return FAKE_ENGINE || (typeof navigator !== 'undefined' && 'gpu' in navigator);
}

const FAKE_ENGINE = import.meta.env.VITE_FAKE_LLM === '1';

interface FakeScript {
  reply: string;
  title: string | null;
  delay: number;
  error: string | null;
}

const fakeScript = () =>
  fetch(`${import.meta.env.VITE_API_URL ?? ''}/chat/engine`, { credentials: 'include' }).then(
    (response) => response.json() as Promise<FakeScript>,
  );

let libPromise: Promise<Lib> | null = null;
function lib(): Promise<Lib> {
  if (!isWebgpuSupported()) return Promise.reject(new WebgpuUnavailableError());
  libPromise ??= import('@mlc-ai/web-llm');
  return libPromise;
}

let engine: Engine | null = null;
let loaded: string | null = null;
let worker: Worker | null = null;

const REVISION_KEY = 'mygpt:model-revisions';

function knownRevisions(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(REVISION_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

function rememberRevision(modelId: string, revision: number): void {
  try {
    localStorage.setItem(
      REVISION_KEY,
      JSON.stringify({ ...knownRevisions(), [modelId]: revision }),
    );
  } catch {
    return;
  }
}

async function dropOutdated(modelId: string, revision?: number) {
  if (revision === undefined) return;
  const known = knownRevisions()[modelId];
  if (known === revision) return;

  if (known !== undefined) {
    const { deleteModelAllInfoInCache, prebuiltAppConfig } = await lib();
    await deleteModelAllInfoInCache(modelId, prebuiltAppConfig).catch(() => undefined);
    if (loaded === modelId) {
      await engine?.unload().catch(() => undefined);
      engine = null;
      loaded = null;
    }
  }
  rememberRevision(modelId, revision);
}

async function engineFor(modelId: string, revision?: number): Promise<Engine> {
  const { CreateWebWorkerMLCEngine } = await lib();
  await dropOutdated(modelId, revision);

  if (engine && loaded === modelId) return engine;

  worker ??= new Worker(new URL('../workers/webllm.worker.ts', import.meta.url), {
    type: 'module',
  });

  try {
    engine = await CreateWebWorkerMLCEngine(worker, modelId, {
      initProgressCallback: ({ progress, text }) =>
        publish({ modelId, progress: Math.round(progress * 100), text }),
    });
    loaded = modelId;
    return engine;
  } finally {
    publish(null);
  }
}

let embedder: Engine | null = null;
let embedderWorker: Worker | null = null;

async function embeddingEngine(): Promise<Engine> {
  const { CreateWebWorkerMLCEngine } = await lib();
  if (embedder) return embedder;

  embedderWorker ??= new Worker(new URL('../workers/webllm.worker.ts', import.meta.url), {
    type: 'module',
  });
  try {
    embedder = await CreateWebWorkerMLCEngine(embedderWorker, EMBEDDING_MODEL, {
      initProgressCallback: ({ progress, text }) =>
        publish({ modelId: EMBEDDING_MODEL, progress: Math.round(progress * 100), text }),
    });
    return embedder;
  } finally {
    publish(null);
  }
}

export const webllm = {
  isSupported: isWebgpuSupported,

  async withCacheState(models: AiModel[]): Promise<AiModel[]> {
    if (FAKE_ENGINE) return models.map((model) => ({ ...model, downloaded: false }));
    if (!isWebgpuSupported()) return models;
    try {
      const { prebuiltAppConfig, hasModelInCache } = await lib();
      return await Promise.all(
        models.map(async (model) => ({
          ...model,
          downloaded: await hasModelInCache(toWebllmId(model.id), prebuiltAppConfig).catch(
            () => false,
          ),
        })),
      );
    } catch {
      return models;
    }
  },

  async availableModelIds(): Promise<{ value: string; label: string }[]> {
    try {
      const { prebuiltAppConfig } = await lib();
      return prebuiltAppConfig.model_list
        .filter((record) => record.model_type !== 1)
        .map((record) => ({
          value: withBrowserPrefix(record.model_id),
          label: record.vram_required_MB
            ? `${record.model_id} · ${formatVram(record.vram_required_MB)}`
            : record.model_id,
        }))
        .sort((a, b) => a.value.localeCompare(b.value));
    } catch {
      return [];
    }
  },

  async vramFor(model: string): Promise<number> {
    const { prebuiltAppConfig } = await lib();
    const record = prebuiltAppConfig.model_list.find((item) => item.model_id === toWebllmId(model));
    return Math.round(record?.vram_required_MB ?? 0) || 1;
  },

  /** Ce que WebLLM sait du modèle. Tout le reste du profil est rédigé par un administrateur. */
  async profileFor(model: string): Promise<LibraryFacts> {
    const { prebuiltAppConfig } = await lib();
    const record = prebuiltAppConfig.model_list.find((item) => item.model_id === toWebllmId(model));
    return {
      vramMb: Math.round(record?.vram_required_MB ?? 0) || 1,
      contextWindow: record?.overrides?.context_window_size ?? null,
      lowResource: record?.low_resource_required ?? false,
      requiredFeatures: record?.required_features ?? [],
    };
  },

  async isDownloaded(model: string): Promise<boolean> {
    if (!isWebgpuSupported()) return false;
    try {
      const { prebuiltAppConfig, hasModelInCache } = await lib();
      return await hasModelInCache(toWebllmId(model), prebuiltAppConfig);
    } catch {
      return false;
    }
  },

  async chat(
    body: { model: string; messages: PromptMessage[]; revision?: number },
    onDelta: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    if (FAKE_ENGINE) return playScript(onDelta, signal);

    const instance = await engineFor(toWebllmId(body.model), body.revision);

    const interrupt = () => void instance.interruptGenerate();
    signal?.addEventListener('abort', interrupt, { once: true });

    try {
      const stream = await instance.chat.completions.create({
        messages: body.messages,
        stream: true,
        temperature: 0.7,
        top_p: 0.95,
      });

      const reasoning = createReasoningFilter();
      let full = '';
      const emit = (text: string) => {
        if (!text) return;
        full += text;
        onDelta(text);
      };

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) emit(reasoning.push(text));
        if (signal?.aborted) break;
      }
      emit(reasoning.flush());
      return full;
    } finally {
      signal?.removeEventListener('abort', interrupt);
    }
  },

  async generateTitle(model: string, question: string, answer: string): Promise<string | null> {
    if (FAKE_ENGINE) return (await fakeScript()).title;
    try {
      const instance = await engineFor(toWebllmId(model));
      const completion = await instance.chat.completions.create({
        stream: false,
        temperature: 0.2,
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content:
              'Donne un titre court en français (3 à 6 mots) pour cette conversation. ' +
              'Réponds uniquement par le titre, sans guillemets ni ponctuation finale.\n\n' +
              `Question : ${question.slice(0, 1000)}\nRéponse : ${answer.slice(0, 1000)}`,
          },
        ],
      });
      const title = stripReasoning(completion.choices[0]?.message?.content ?? '')
        .trim()
        .replace(/^["«“'\s]+|["»”'.\s]+$/g, '')
        .trim();
      return title ? title.slice(0, 80) : null;
    } catch {
      return null;
    }
  },

  async embed(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];
    if (FAKE_ENGINE) return texts.map(() => Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0));
    const engine = await embeddingEngine();
    const { data } = await engine.embeddings.create({ input: texts });

    const vectors = data.map((entry) => entry.embedding as number[]);
    const wrong = vectors.find((vector) => vector.length !== EMBEDDING_DIMENSIONS);
    if (wrong) {
      throw new Error(
        `Vecteurs attendus en ${EMBEDDING_DIMENSIONS} dimensions, reçu ${wrong.length}`,
      );
    }
    return vectors;
  },

  async unload() {
    await engine?.unload().catch(() => undefined);
    engine = null;
    loaded = null;
  },

  async remove(model: string) {
    const modelId = toWebllmId(model);
    if (loaded === modelId) await this.unload();
    const { deleteModelAllInfoInCache, prebuiltAppConfig } = await lib();
    await deleteModelAllInfoInCache(modelId, prebuiltAppConfig);
  },
};

async function playScript(onDelta: (text: string) => void, signal?: AbortSignal): Promise<string> {
  const script = await fakeScript();
  if (script.delay) {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, script.delay);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });
  }
  if (signal?.aborted) return '';
  if (script.error) throw new Error(script.error);

  let full = '';
  for (const chunk of script.reply.match(/.{1,12}/gs) ?? []) {
    if (signal?.aborted) break;
    full += chunk;
    onDelta(chunk);
  }
  return full;
}
