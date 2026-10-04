import type { Page, Route } from '@playwright/test';

export interface FakeUser {
  pseudo: string;
  email: string;
  customInstructions?: string | null;
  preferredModel?: string | null;
}

export interface FakeAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface FakeMessage {
  id: string;
  content: string;
  conversationId: string;
  isFromAi: boolean;
  model?: string | null;
  attachments?: FakeAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface FakeConversation {
  id: string;
  name: string;
  userId: string;
  pinned?: boolean;
  archived?: boolean;
  titleLocked?: boolean;
  folderId?: string | null;
  shareLink?: string | null;
  shareExpiresAt?: string | null;
  sharedFrom?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FakeFolder {
  id: string;
  name: string;
  instructions?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FakeState {
  user: FakeUser | null;
  account: FakeUser;
  conversations: FakeConversation[];
  folders: FakeFolder[];
  messages: Record<string, FakeMessage[]>;
  aiReply: string;
  aiTitle: string | null;
  /** Délai avant la réponse en flux, pour tester le bouton Stop */
  streamDelay: number;
  streamError: string | null;
  /** Corps des requêtes envoyées à /chat, pour vérifier modèle et pièces jointes */
  chatRequests: Record<string, unknown>[];
  failures: Partial<Record<'login' | 'register', { status: number; message: string }>>;
}

export const MODELS = {
  models: [
    { id: 'flash', label: 'Flash', description: 'Rapide et polyvalent' },
    { id: 'pro', label: 'Pro', description: 'Raisonnement approfondi' },
    { id: 'lite', label: 'Flash Lite', description: 'Le plus rapide' },
  ],
  defaultModel: 'flash',
};

let sequence = 0;
const nextId = (prefix: string) => `${prefix}-${++sequence}`;
const now = () => new Date().toISOString();

export function conversation(
  id: string,
  name: string,
  extra: Partial<FakeConversation> = {},
): FakeConversation {
  return { id, name, userId: 'user-1', createdAt: now(), updatedAt: now(), ...extra };
}

export function folder(id: string, name: string, instructions: string | null = null): FakeFolder {
  return { id, name, instructions, createdAt: now(), updatedAt: now() };
}

export function message(conversationId: string, content: string, isFromAi = false): FakeMessage {
  return {
    id: nextId('msg'),
    content,
    conversationId,
    isFromAi,
    createdAt: now(),
    updatedAt: now(),
  };
}

/**
 * Faux back-end en mémoire : intercepte toutes les routes de l'API NestJS
 * pour tester le client sans base de données ni appel à Gemini.
 */
export async function fakeApi(page: Page, initial: Partial<FakeState> = {}) {
  const state: FakeState = {
    user: null,
    account: { pseudo: 'alice', email: 'alice@example.com' },
    conversations: [],
    folders: [],
    messages: {},
    aiReply: 'Réponse de **MyGPT**.',
    aiTitle: null,
    streamDelay: 0,
    streamError: null,
    chatRequests: [],
    failures: {},
    ...initial,
  };

  const isApi = (url: URL) =>
    /^\/(auth|users|conversations|messages|chat|folders|attachments)(\/|$)/.test(url.pathname);

  await page.route(isApi, async (route) => {
    const request = route.request();
    if (request.resourceType() === 'document') return route.fallback();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;
    let body: Record<string, unknown> = {};
    try {
      body = request.postDataJSON() ?? {};
    } catch {
      // Corps multipart (pièces jointes)
    }
    const json = (status: number, data?: unknown) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data ?? {}) });

    if (path === '/auth/profile') return state.user ? json(200, state.user) : json(401);
    if (path === '/auth/login') {
      const failure = state.failures.login;
      if (failure) return json(failure.status, { message: failure.message });
      state.user = state.account;
      return json(201, { message: 'Connexion réussie', user: { pseudo: state.user.pseudo } });
    }
    if (path === '/auth/logout') {
      state.user = null;
      return json(201);
    }
    if (path === '/users/register') {
      const failure = state.failures.register;
      return failure ? json(failure.status, { message: failure.message }) : json(201);
    }

    if (path.startsWith('/conversations/shared/')) {
      const link = path.split('/').pop();
      const found = state.conversations.find((c) => c.shareLink === link);
      if (!found) return json(404, { message: 'Shared conversation not found' });
      return json(200, {
        ...found,
        messages: state.messages[found.id] ?? [],
        user: { pseudo: state.account.pseudo },
      });
    }

    if (!state.user) return json(401);
    return handleAuthenticated(route, state, { method, path, url, body, json });
  });

  return state;
}

type Context = {
  method: string;
  path: string;
  url: URL;
  body: Record<string, unknown>;
  json: (status: number, data?: unknown) => Promise<void>;
};

function handleAuthenticated(route: Route, state: FakeState, ctx: Context) {
  const { method, path, url, body, json } = ctx;
  const segments = path.split('/').filter(Boolean);
  const user = state.user as FakeUser;

  if (path === '/users/profile/preferences') {
    Object.assign(user, body);
    return json(200, user);
  }

  if (segments[0] === 'chat') return handleChat(route, state, ctx);

  if (path === '/folders' && method === 'GET') return json(200, state.folders);
  if (path === '/folders' && method === 'POST') {
    const created = folder(
      nextId('folder'),
      String(body.name),
      (body.instructions as string) ?? null,
    );
    state.folders.push(created);
    return json(201, created);
  }
  if (segments[0] === 'folders' && segments[1]) {
    const found = state.folders.find((f) => f.id === segments[1]);
    if (!found) return json(404, { message: 'Folder not found' });
    if (method === 'PATCH') return json(200, Object.assign(found, body));
    if (method === 'DELETE') {
      state.folders = state.folders.filter((f) => f.id !== found.id);
      state.conversations.forEach((c) => c.folderId === found.id && (c.folderId = null));
      return json(200);
    }
  }

  if (path === '/attachments' && method === 'POST') {
    return json(201, { id: nextId('file'), name: 'note.txt', mimeType: 'text/plain', size: 12 });
  }

  if (path === '/conversations' && method === 'GET') {
    const archived = url.searchParams.get('archived') === 'true';
    return json(
      200,
      state.conversations
        .filter((c) => !c.sharedFrom && Boolean(c.archived) === archived)
        .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))),
    );
  }
  if (path === '/conversations' && method === 'POST') {
    const created = conversation(nextId('conv'), String(body.name), {
      folderId: (body.folderId as string) ?? null,
    });
    state.conversations.unshift(created);
    state.messages[created.id] = [];
    return json(201, created);
  }
  if (path === '/conversations/search') {
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase();
    return json(
      200,
      state.conversations.filter((c) => !c.archived && c.name.toLowerCase().includes(keyword)),
    );
  }
  if (path === '/conversations/saved') {
    return json(
      200,
      state.conversations.filter((c) => c.sharedFrom),
    );
  }
  if (segments[0] === 'conversations' && segments[1]) {
    const found = state.conversations.find((c) => c.id === segments[1]);
    if (!found) return json(404, { message: 'Conversation not found' });
    if (segments[2] === 'share') {
      found.shareLink = method === 'POST' ? 'lien-public-123' : null;
      return json(201, found);
    }
    if (method === 'GET') return json(200, found);
    if (method === 'PATCH') {
      if (body.name) found.titleLocked = true;
      return json(200, Object.assign(found, body));
    }
    if (method === 'DELETE') {
      state.conversations = state.conversations.filter((c) => c.id !== found.id);
      return json(200);
    }
  }

  if (path === '/messages' && method === 'GET') {
    return json(200, state.messages[url.searchParams.get('conversationId') ?? ''] ?? []);
  }
  if (path === '/messages/search/all') {
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase();
    return json(
      200,
      Object.values(state.messages)
        .flat()
        .filter((m) => m.content.toLowerCase().includes(keyword))
        .map((m) => {
          const owner = state.conversations.find((c) => c.id === m.conversationId);
          return { ...m, conversation: { id: m.conversationId, name: owner?.name ?? '' } };
        }),
    );
  }
  if (path === '/messages/search') {
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase();
    const list = state.messages[url.searchParams.get('conversationId') ?? ''] ?? [];
    return json(
      200,
      list.filter((m) => m.content.toLowerCase().includes(keyword)),
    );
  }

  return route.fallback();
}

async function handleChat(route: Route, state: FakeState, ctx: Context) {
  const { method, path, body, json } = ctx;
  const segments = path.split('/').filter(Boolean);
  if (path === '/chat/models') return json(200, MODELS);
  if (method !== 'POST') return route.fallback();

  state.chatRequests.push(body);
  const events: unknown[] = [];
  let conversationId: string;

  if (path === '/chat/messages') {
    conversationId = String(body.conversationId);
    const sent = message(conversationId, String(body.content));
    sent.attachments = ((body.attachmentIds as string[]) ?? []).map((id) => ({
      id,
      name: 'note.txt',
      mimeType: 'text/plain',
      size: 12,
    }));
    (state.messages[conversationId] ??= []).push(sent);
    events.push({ type: 'user', message: sent });
  } else if (segments[3] === 'regenerate') {
    conversationId = segments[2];
    const list = state.messages[conversationId] ?? [];
    if (list.at(-1)?.isFromAi) list.pop();
  } else if (segments[1] === 'messages' && segments[3] === 'edit') {
    const entry = Object.entries(state.messages).find(([, list]) =>
      list.some((m) => m.id === segments[2]),
    );
    if (!entry) return json(404, { message: 'Message not found' });
    const [id, list] = entry;
    conversationId = id;
    const index = list.findIndex((m) => m.id === segments[2]);
    list[index].content = String(body.content);
    state.messages[id] = list.slice(0, index + 1);
  } else {
    return route.fallback();
  }

  if (state.streamDelay) await new Promise((resolve) => setTimeout(resolve, state.streamDelay));

  if (state.streamError) {
    events.push({ type: 'error', message: state.streamError });
  } else {
    const model = (body.model as string) ?? state.user?.preferredModel ?? MODELS.defaultModel;
    for (const chunk of state.aiReply.match(/.{1,12}/gs) ?? []) {
      events.push({ type: 'delta', text: chunk });
    }
    const answer = { ...message(conversationId, state.aiReply, true), model };
    state.messages[conversationId].push(answer);
    events.push({ type: 'done', message: answer });

    const owner = state.conversations.find((c) => c.id === conversationId);
    if (owner) {
      owner.updatedAt = now();
      if (state.aiTitle && !owner.titleLocked) {
        Object.assign(owner, { name: state.aiTitle, titleLocked: true });
        events.push({ type: 'title', conversationId, name: state.aiTitle });
      }
    }
  }

  try {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(''),
    });
  } catch {
    // Requête annulée par le bouton Stop
  }
}
