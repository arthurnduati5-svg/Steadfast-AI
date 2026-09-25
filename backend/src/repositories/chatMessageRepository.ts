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

// ── Chat durability v1: monotonic message-number allocator ──
//
// Sequence positions are never derived from array lengths or row counts.
// For N reserved slots this atomically advances ChatSession.nextMessageNumber
// by N and derives the reserved start from the returned value, so two
// concurrent allocations for one session can never receive the same number.
// Gaps caused by edit/regeneration are valid and never reclaimed.
//
// The `db` parameter accepts the shared Prisma client or an existing
// transaction client; the atomic UPDATE...RETURNING is safe either way.

type AllocatingDb = ChatMessageDb & {
  $queryRaw: (query: TemplateStringsArray, ...values: any[]) => Promise<any[]>;
};

export interface ReservedMessageNumbers {
  /** First reserved (inclusive) message number. */
  startNumber: number;
  /** Number of reserved slots. */
  count: number;
  /** All reserved message numbers in order. */
  numbers: number[];
  /** New allocator value after the reservation (startNumber + count). */
  nextMessageNumber: number;
}

export async function reserveMessageNumbers(
  sessionId: string,
  count: number,
  db: AllocatingDb = defaultDb as AllocatingDb,
): Promise<ReservedMessageNumbers> {
  const slots = Math.floor(Number(count));
  if (!Number.isFinite(slots) || slots <= 0) {
    throw new Error(`reserveMessageNumbers requires a positive slot count (received ${count})`);
  }

  const rows: any[] = await db.$queryRaw`
    UPDATE "ChatSession"
    SET "nextMessageNumber" = "nextMessageNumber" + ${slots}
    WHERE "id" = ${sessionId}
    RETURNING "nextMessageNumber"
  `;

  const row = rows && rows[0];
  const nextRaw = row ? Number(row.nextMessageNumber) : NaN;
  if (!row || !Number.isFinite(nextRaw)) {
    throw new Error(`reserveMessageNumbers: session ${sessionId} not found or allocator unreadable`);
  }

  const nextMessageNumber = nextRaw;
  const startNumber = nextMessageNumber - slots;
  const numbers = Array.from({ length: slots }, (_, index) => startNumber + index);
  return { startNumber, count: slots, numbers, nextMessageNumber };
}
