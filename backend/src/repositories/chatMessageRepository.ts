import prisma from '../lib/prisma';

/**
 * R8-F canonical ChatMessage persistence owner.
 *
 * All live backend ChatMessage row writes (create + targeted update) route
 * through this module. Callers keep their own orchestration, role vocabulary
 * ('user' | 'assistant' | 'model' as each path already uses), messageNumber
 * calculation, Redis history caching, Pinecone/vector behavior, prompts,
 * models and providers. This module owns only persistence.
 *
 * The `db` parameter accepts the shared Prisma client or an existing Prisma
 * transaction client, so existing transaction boundaries are preserved.
 */

export interface CreateChatMessageInput {
  sessionId: string;
  role: string;
  content: string;
  messageNumber: number;
  metadata?: unknown;
  /** Optional explicit id when an existing path supplies one. */
  id?: string;
  /** Optional timestamp when an existing path supplies one. */
  timestamp?: Date;
}

export interface UpdateChatMessageInput {
  content?: string;
  metadata?: unknown;
}

type ChatMessageDb = {
  chatMessage: {
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
  };
};

const defaultDb: ChatMessageDb = prisma as unknown as ChatMessageDb;

export async function createChatMessage(
  input: CreateChatMessageInput,
  db: ChatMessageDb = defaultDb,
): Promise<any> {
  return db.chatMessage.create({
    data: {
      ...(input.id !== undefined ? { id: input.id } : {}),
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      ...(input.timestamp !== undefined ? { timestamp: input.timestamp } : {}),
      messageNumber: input.messageNumber,
      ...(input.metadata !== undefined ? { metadata: input.metadata as any } : {}),
    },
  });
}

export async function updateChatMessage(
  id: string,
  data: UpdateChatMessageInput,
  db: ChatMessageDb = defaultDb,
): Promise<any> {
  return db.chatMessage.update({
    where: { id },
    data: data as any,
  });
}
