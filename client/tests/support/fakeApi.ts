import type { Page, Route } from '@playwright/test';

export interface FakeUser {
  pseudo: string;
  email: string;
}

export interface FakeMessage {
  id: string;
  content: string;
  conversationId: string;
  isFromAi: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FakeConversation {
  id: string;
  name: string;
  userId: string;
  shareLink?: string | null;
  shareExpiresAt?: string | null;
  sharedFrom?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FakeState {
  user: FakeUser | null;
  account: FakeUser;
  conversations: FakeConversation[];
  messages: Record<string, FakeMessage[]>;
  aiReply: string;
  failures: Partial<Record<'login' | 'register', { status: number; message: string }>>;
}

let sequence = 0;
const nextId = (prefix: string) => `${prefix}-${++sequence}`;
const now = () => new Date().toISOString();

export function conversation(id: string, name: string): FakeConversation {
  return { id, name, userId: 'user-1', createdAt: now(), updatedAt: now() };
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
    messages: {},
    aiReply: 'Réponse de **MyGPT**.',
    failures: {},
    ...initial,
  };

  const isApi = (url: URL) => /^\/(auth|users|conversations|messages)(\/|$)/.test(url.pathname);

  await page.route(isApi, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;
    const body = request.postDataJSON?.() ?? {};
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

function handleAuthenticated(
  route: Route,
  state: FakeState,
  ctx: {
    method: string;
    path: string;
    url: URL;
    body: Record<string, string>;
    json: (status: number, data?: unknown) => Promise<void>;
  },
) {
  const { method, path, url, body, json } = ctx;
  const segments = path.split('/').filter(Boolean);
  const touch = (id: string) => {
    const found = state.conversations.find((c) => c.id === id);
    if (found) found.updatedAt = now();
  };
  const reply = (conversationId: string) =>
    state.messages[conversationId].push(message(conversationId, state.aiReply, true));

  if (path === '/conversations' && method === 'GET') return json(200, state.conversations);
  if (path === '/conversations' && method === 'POST') {
    const created = conversation(nextId('conv'), body.name);
    state.conversations.unshift(created);
    state.messages[created.id] = [];
    return json(201, created);
  }
  if (path === '/conversations/search') {
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase();
    return json(
      200,
      state.conversations.filter((c) => c.name.toLowerCase().includes(keyword)),
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
    if (method === 'PATCH') return json(200, Object.assign(found, body));
    if (method === 'DELETE') {
      state.conversations = state.conversations.filter((c) => c.id !== found.id);
      return json(200);
    }
  }

  if (path === '/messages' && method === 'GET') {
    return json(200, state.messages[url.searchParams.get('conversationId') ?? ''] ?? []);
  }
  if (path === '/messages' && method === 'POST') {
    const sent = message(body.conversationId, body.content);
    state.messages[body.conversationId] ??= [];
    state.messages[body.conversationId].push(sent);
    reply(body.conversationId);
    touch(body.conversationId);
    return json(201, sent);
  }
  if (path === '/messages/search') {
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase();
    const list = state.messages[url.searchParams.get('conversationId') ?? ''] ?? [];
    return json(
      200,
      list.filter((m) => m.content.toLowerCase().includes(keyword)),
    );
  }
  if (segments[0] === 'messages' && segments[1] && method === 'PATCH') {
    for (const [conversationId, list] of Object.entries(state.messages)) {
      const index = list.findIndex((m) => m.id === segments[1]);
      if (index === -1) continue;
      list[index].content = body.content;
      state.messages[conversationId] = list.slice(0, index + 1);
      reply(conversationId);
      return json(200, list[index]);
    }
    return json(404);
  }

  return route.fallback();
}
