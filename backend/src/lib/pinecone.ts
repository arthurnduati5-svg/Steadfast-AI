import { Pinecone } from '@pinecone-database/pinecone';
import 'dotenv/config';
import { logger } from '../utils/logger';

function readPineconeApiKey(): string | null {
  const raw = process.env.PINECONE_API_KEY?.trim();
  return raw ? raw : null;
}

const initialApiKey = readPineconeApiKey();

if (!initialApiKey) {
  logger.warn('[Vector] PINECONE_API_KEY is not configured. Vector features will be disabled.');
}

let cachedClient: Pinecone | null = initialApiKey ? new Pinecone({ apiKey: initialApiKey }) : null;

export function isVectorAvailable(): boolean {
  return readPineconeApiKey() !== null;
}

export function getPineconeClient(): Pinecone | null {
  const key = readPineconeApiKey();
  if (!key) return null;
  if (!cachedClient) {
    cachedClient = new Pinecone({ apiKey: key });
  }
  return cachedClient;
}

export function getPineconeIndex(indexName?: string) {
  const client = getPineconeClient();
  if (!client) return null;
  const name = (indexName ?? process.env.PINECONE_INDEX ?? '').trim();
  if (!name) return null;
  return client.Index(name);
}

export function requirePineconeClient(): Pinecone {
  const client = getPineconeClient();
  if (!client) {
    throw new Error('VECTOR_UNAVAILABLE: PINECONE_API_KEY is not configured');
  }
  return client;
}

const pinecone = cachedClient;

export default pinecone;
