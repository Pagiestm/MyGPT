import type { Message } from './message';

export interface Conversation {
  id: string;
  name: string;
  userId: string;
  sharedFrom?: string | null;
  shareLink?: string | null;
  shareExpiresAt?: string | null;
  pinned?: boolean;
  archived?: boolean;
  titleLocked?: boolean;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SharedConversation extends Conversation {
  messages: Message[];
  user: { pseudo: string };
}

const MAX_NAME_LENGTH = 60;
const DAY = 86_400_000;

export function nameFromPrompt(prompt: string) {
  const text = prompt.trim().replace(/\s+/g, ' ');
  return text.length > MAX_NAME_LENGTH ? `${text.slice(0, MAX_NAME_LENGTH - 1)}…` : text;
}

export function activeShareLink(conversation: Conversation, now = new Date()) {
  const { shareLink, shareExpiresAt } = conversation;
  if (!shareLink) return null;
  if (shareExpiresAt && new Date(shareExpiresAt) < now) return null;
  return shareLink;
}

export function shareExpiration(days: number | null, now = Date.now()) {
  return days ? new Date(now + days * DAY).toISOString() : undefined;
}

export function groupByRecency(conversations: Conversation[], now = new Date()) {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const groups = [
    { label: "Aujourd'hui", from: startOfToday },
    { label: 'Hier', from: startOfToday - DAY },
    { label: '7 derniers jours', from: startOfToday - 7 * DAY },
    { label: 'Plus ancien', from: -Infinity },
  ].map((group) => ({ ...group, items: [] as Conversation[] }));

  for (const conversation of conversations) {
    const time = new Date(conversation.updatedAt).getTime();
    groups.find((group) => time >= group.from)?.items.push(conversation);
  }
  return groups.filter((group) => group.items.length > 0);
}

export type ConversationPatch = Partial<
  Pick<Conversation, 'name' | 'pinned' | 'archived' | 'folderId'>
>;

// Barre latérale : épinglées, puis dossiers, puis le reste par ancienneté
export function organize(conversations: Conversation[], folderIds: string[]) {
  const known = new Set(folderIds);
  const pinned = conversations.filter((conversation) => conversation.pinned);
  const byFolder = new Map<string, Conversation[]>();
  const loose: Conversation[] = [];

  for (const conversation of conversations) {
    if (conversation.pinned) continue;
    if (conversation.folderId && known.has(conversation.folderId)) {
      const list = byFolder.get(conversation.folderId) ?? [];
      list.push(conversation);
      byFolder.set(conversation.folderId, list);
    } else {
      loose.push(conversation);
    }
  }
  return { pinned, byFolder, recent: groupByRecency(loose) };
}
