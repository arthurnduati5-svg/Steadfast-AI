import { describe, it, expect, vi } from 'vitest';

// Explicit test-only Prisma stub: verifies the canonical writer's argument
// shaping without touching a database.
vi.mock('../lib/prisma', () => ({
  default: { chatMessage: { create: vi.fn(), update: vi.fn() } },
}));

import { createChatMessage, updateChatMessage } from './chatMessageRepository';
import prisma from '../lib/prisma';

const chatMessage = (prisma as any).chatMessage;

describe('R8-F canonical ChatMessage writer', () => {
  it('preserves sessionId, role, content and messageNumber', async () => {
    chatMessage.create.mockResolvedValueOnce({ id: 'm1' });
    await createChatMessage({
      sessionId: 's1',
      role: 'user',
      content: 'hello',
      messageNumber: 3,
    });
    expect(chatMessage.create).toHaveBeenCalledWith({
      data: { sessionId: 's1', role: 'user', content: 'hello', messageNumber: 3 },
    });
  });

  it('passes metadata through untouched when present', async () => {
    chatMessage.create.mockResolvedValueOnce({ id: 'm2' });
    const metadata = { edited: true, nested: { a: 1 } };
    await createChatMessage({
      sessionId: 's1',
      role: 'assistant',
      content: 'hi',
      messageNumber: 4,
      metadata,
    });
    expect(chatMessage.create).toHaveBeenCalledWith({
      data: { sessionId: 's1', role: 'assistant', content: 'hi', messageNumber: 4, metadata },
    });
  });

  it('preserves explicit id and timestamp when supplied', async () => {
    chatMessage.create.mockResolvedValueOnce({ id: 'explicit-id' });
    const timestamp = new Date('2026-01-02T03:04:05.000Z');
    await createChatMessage({
      id: 'explicit-id',
      sessionId: 's9',
      role: 'model',
      content: 'revision answer',
      timestamp,
      messageNumber: 7,
      metadata: { source: 'revision' },
    });
    expect(chatMessage.create).toHaveBeenCalledWith({
      data: {
        id: 'explicit-id',
        sessionId: 's9',
        role: 'model',
        content: 'revision answer',
        timestamp,
        messageNumber: 7,
        metadata: { source: 'revision' },
      },
    });
  });

  it('does not normalize caller role vocabulary', async () => {
    chatMessage.create.mockResolvedValueOnce({ id: 'm3' });
    await createChatMessage({ sessionId: 's1', role: 'model', content: 'x', messageNumber: 1 });
    expect(chatMessage.create).toHaveBeenCalledWith({
      data: { sessionId: 's1', role: 'model', content: 'x', messageNumber: 1 },
    });
  });

  it('supports update of content and metadata by id', async () => {
    chatMessage.update.mockResolvedValueOnce({ id: 'm4' });
    await updateChatMessage('m4', { content: 'edited', metadata: { edited: true } });
    expect(chatMessage.update).toHaveBeenCalledWith({
      where: { id: 'm4' },
      data: { content: 'edited', metadata: { edited: true } },
    });
  });

  it('is usable with an explicit transaction client', async () => {
    chatMessage.create.mockClear();
    const tx = { chatMessage: { create: vi.fn().mockResolvedValue({ id: 'tx1' }), update: vi.fn() } };
    await createChatMessage(
      { sessionId: 's-tx', role: 'user', content: 'in-tx', messageNumber: 1 },
      tx as any,
    );
    expect(tx.chatMessage.create).toHaveBeenCalledOnce();
    expect(chatMessage.create).not.toHaveBeenCalled();
  });
});
