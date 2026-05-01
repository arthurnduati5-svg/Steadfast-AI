import OpenAI from 'openai';
import sharp from 'sharp';
import { inflateRawSync, inflateSync } from 'zlib';

const MAX_DOCUMENT_TEXT_CHARS = 18000;
const MAX_IMAGE_OCR_TEXT_CHARS = 12000;
const MIN_DENSE_OCR_TEXT_CHARS = 260;
const ATTACHMENT_PROMPT_PREVIEW_CHARS = 1800;
const ATTACHMENT_PROMPT_PREVIEW_LINES = 10;

function decodePdfLiteralString(value: string): string {
  let output = '';
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch !== '\\') {
      output += ch;
      continue;
    }
    const next = value[i + 1];
    if (!next) break;
    i += 1;

    if (next === 'n') output += '\n';
    else if (next === 'r') output += '\r';
    else if (next === 't') output += '\t';
    else if (next === 'b') output += '\b';
    else if (next === 'f') output += '\f';
    else if (next === '(') output += '(';
    else if (next === ')') output += ')';
    else if (next === '\\') output += '\\';
    else if (/[0-7]/.test(next)) {
      let octal = next;
      for (let j = 0; j < 2 && i + 1 < value.length && /[0-7]/.test(value[i + 1]); j += 1) {
        i += 1;
        octal += value[i];
      }
      output += String.fromCharCode(parseInt(octal, 8));
    } else {
      output += next;
    }
  }
  return output;
}

function decodePdfHexString(value: string): string {
  const compact = value.replace(/\s+/g, '');
  if (!compact) return '';
  const even = compact.length % 2 === 0 ? compact : `${compact}0`;
  try {
    return Buffer.from(even, 'hex').toString('utf8');
  } catch {
    return Buffer.from(even, 'hex').toString('latin1');
  }
}

function scorePdfTextCandidate(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const alphaCount = (trimmed.match(/[A-Za-z\u0600-\u06FF]/g) || []).length;
  const symbolCount = (trimmed.match(/[^A-Za-z0-9\u0600-\u06FF\s.,;:!?'"()\-]/g) || []).length;
  if (alphaCount === 0) return 0;
  const ratio = alphaCount / Math.max(1, trimmed.length);
  return ratio - symbolCount * 0.005;
}

function extractPdfTextRuns(content: string): string[] {
  const out: string[] = [];

  for (const match of content.matchAll(/\(((?:\\.|[^\\])*)\)\s*Tj/g)) {
    const decoded = decodePdfLiteralString(match[1] || '');
    if (scorePdfTextCandidate(decoded) > 0.08) out.push(decoded);
  }

  for (const match of content.matchAll(/<([0-9A-Fa-f\s]+)>\s*Tj/g)) {
    const decoded = decodePdfHexString(match[1] || '');
    if (scorePdfTextCandidate(decoded) > 0.08) out.push(decoded);
  }

  for (const match of content.matchAll(/\[((?:.|\r|\n)*?)\]\s*TJ/g)) {
    const block = match[1] || '';
    for (const token of block.matchAll(/\(((?:\\.|[^\\])*)\)|<([0-9A-Fa-f\s]+)>/g)) {
      const decoded = token[1] ? decodePdfLiteralString(token[1]) : decodePdfHexString(token[2] || '');
      if (scorePdfTextCandidate(decoded) > 0.08) out.push(decoded);
    }
  }

  return out;
}

function inflatePdfStreams(content: string): string[] {
  const out: string[] = [];
  for (const match of content.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    const compressed = Buffer.from(match[1] || '', 'latin1');
    if (!compressed.length) continue;
    try {
      out.push(inflateSync(compressed).toString('latin1'));
      continue;
    } catch {
      // fallback to raw-flate below
    }
    try {
      out.push(inflateRawSync(compressed).toString('latin1'));
    } catch {
      // ignore non-flate streams
    }
  }
  return out;
}

export function extractTextFromPdfBase64(base64: string): { text: string; truncated: boolean } {
  const raw = String(base64 || '').trim();
  if (!raw) return { text: '', truncated: false };
  try {
    const binary = Buffer.from(raw, 'base64');
    if (!binary.length) return { text: '', truncated: false };

    const primary = binary.toString('latin1');
    const candidates: string[] = [...extractPdfTextRuns(primary)];
    const inflated = inflatePdfStreams(primary);
    for (const stream of inflated) {
      candidates.push(...extractPdfTextRuns(stream));
    }

    const normalized = candidates
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const line of normalized) {
      const key = line.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(line);
    }

    const joined = deduped.join('\n').trim();
    if (!joined) return { text: '', truncated: false };
    const truncated = joined.length > MAX_DOCUMENT_TEXT_CHARS;
    return {
      text: joined.slice(0, MAX_DOCUMENT_TEXT_CHARS),
      truncated,
    };
  } catch {
    return { text: '', truncated: false };
  }
}

function pickHigherConfidence(
  left?: 'low' | 'medium' | 'high',
  right?: 'low' | 'medium' | 'high'
): 'low' | 'medium' | 'high' | undefined {
  const rank = { low: 1, medium: 2, high: 3 } as const;
  if (!left) return right;
  if (!right) return left;
  return rank[left] >= rank[right] ? left : right;
}

async function renderPdfPagesToPngBase64(base64: string, maxPages = 2): Promise<string[]> {
  const raw = String(base64 || '').trim();
  if (!raw) return [];

  try {
    const pdfBuffer = Buffer.from(raw, 'base64');
    const outputs: string[] = [];

    for (let page = 0; page < maxPages; page += 1) {
      try {
        const image = await sharp(pdfBuffer, { density: 220, page })
          .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
          .png()
          .toBuffer();
        if (!image.length) break;
        outputs.push(image.toString('base64'));
      } catch {
        break;
      }
    }

    return outputs;
  } catch {
    return [];
  }
}

export async function extractTextFromPdfWithOcrFallback(base64: string): Promise<{
  text: string;
  truncated: boolean;
  usedOcr: boolean;
  confidence?: 'low' | 'medium' | 'high';
}> {
  const parsed = extractTextFromPdfBase64(base64);
  if (parsed.text && parsed.text.length >= 180) {
    return { ...parsed, usedOcr: false };
  }

  const previewPages = await renderPdfPagesToPngBase64(base64, 2);
  if (previewPages.length === 0) {
    return { ...parsed, usedOcr: false };
  }

  const extractedBlocks: string[] = [];
  let strongestConfidence: 'low' | 'medium' | 'high' | undefined;

  for (const pageBase64 of previewPages) {
    const ocr = await runImageOcrAssist(pageBase64, 'image/png');
    if (!ocr?.extractedText) continue;
    extractedBlocks.push(ocr.extractedText.trim());
    strongestConfidence = pickHigherConfidence(strongestConfidence, ocr.confidence);
  }

  const merged = [parsed.text, ...extractedBlocks]
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!merged) {
    return { ...parsed, usedOcr: false };
  }

  const truncated = merged.length > MAX_DOCUMENT_TEXT_CHARS;
  return {
    text: merged.slice(0, MAX_DOCUMENT_TEXT_CHARS),
    truncated,
    usedOcr: extractedBlocks.length > 0,
    confidence: strongestConfidence,
  };
}

function compactPromptPreview(raw: string, maxChars = ATTACHMENT_PROMPT_PREVIEW_CHARS): string {
  const normalized = String(raw || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, ATTACHMENT_PROMPT_PREVIEW_LINES)
    .join('\n');

  if (!normalized) return '';
  if (normalized.length <= maxChars) return normalized;

  const head = normalized.slice(0, Math.max(0, maxChars - 140)).trimEnd();
  const tail = normalized.slice(-100).trimStart();
  return `${head}\n...\n${tail}`;
}

export function buildAttachmentPromptSummary(args: {
  kind: 'text' | 'pdf' | 'image';
  fileName?: string;
  extractedText?: string;
  truncated?: boolean;
  note?: string;
  confidence?: 'low' | 'medium' | 'high';
  dense?: boolean;
}): string {
  const lines: string[] = [];
  const label =
    args.kind === 'pdf'
      ? 'PDF attachment'
      : args.kind === 'image'
        ? 'Image attachment'
        : 'Text attachment';

  lines.push(`${label}${args.fileName ? `: ${args.fileName}` : ''}`);

  if (typeof args.dense === 'boolean') {
    lines.push(`Dense text detected: ${args.dense ? 'yes' : 'no'}`);
  }
  if (args.confidence) {
    lines.push(`OCR confidence: ${args.confidence}`);
  }

  const preview = compactPromptPreview(args.extractedText || '');
  if (preview) {
    lines.push(`Preview:\n${preview}`);
  } else {
    lines.push('Preview: unavailable');
  }

  if (args.truncated) {
    lines.push('Note: content preview was truncated to stay within prompt limits.');
  }
  if (args.note) {
    lines.push(`Note: ${args.note}`);
  }

  return lines.filter(Boolean).join('\n');
}

export type ImageOcrAssistResult = {
  extractedText: string;
  dense: boolean;
  confidence: 'low' | 'medium' | 'high';
};

export function isLikelyDenseTextRequest(
  userText: string,
  fileName?: string,
  mimeType?: string,
  isVoiceRealtime?: boolean
): boolean {
  if (String(process.env.FORCE_IMAGE_OCR_ASSIST || '').trim() === '1') return true;

  const query = String(userText || '').toLowerCase();
  const file = String(fileName || '').toLowerCase();
  const mime = String(mimeType || '').toLowerCase();

  const fileSuggestsText =
    /screenshot|screen|capture|scan|worksheet|document|slides?|notes?|exam|paper|assignment/.test(file);
  const querySuggestsText =
    /\b(ocr|read text|extract text|transcribe|what does this say|solve from image|from this screenshot|screenshot|equation|question in image|text in image|read this)\b/.test(
      query
    );
  const explicitTextNeed = querySuggestsText || fileSuggestsText;

  if (isVoiceRealtime) {
    return explicitTextNeed;
  }
  return explicitTextNeed;
}

function parseJsonObjectFromText(raw: string): Record<string, unknown> | null {
  const value = String(raw || '').trim();
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    // Try to salvage JSON block from mixed output
  }

  const blockMatch = value.match(/\{[\s\S]*\}/);
  if (!blockMatch) return null;
  try {
    const parsed = JSON.parse(blockMatch[0]);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function runImageOcrAssist(
  clientOrBase64: OpenAI | string,
  base64OrMimeType: string,
  maybeMimeType?: string
): Promise<ImageOcrAssistResult | null> {
  const client =
    typeof clientOrBase64 === 'string'
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : clientOrBase64;
  const base64 = typeof clientOrBase64 === 'string' ? clientOrBase64 : base64OrMimeType;
  const mimeType = typeof clientOrBase64 === 'string' ? base64OrMimeType : maybeMimeType || '';
  const encoded = String(base64 || '').trim();
  if (!encoded) return null;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 500,
      response_format: { type: 'json_object' } as any,
      messages: [
        {
          role: 'system',
          content:
            'You are an OCR pre-processor. Return strict JSON with keys: ' +
            'text_density (high|low), confidence (high|medium|low), extracted_text. ' +
            'extracted_text must contain only text seen in the image, preserve line breaks, no commentary.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract text from this image and classify text density.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${encoded}` } },
          ],
        },
      ],
    } as any);

    const raw = String(completion.choices?.[0]?.message?.content || '');
    const parsed = parseJsonObjectFromText(raw);
    if (!parsed) return null;

    const extractedTextRaw = String(parsed.extracted_text || '').replace(/\u0000/g, '').trim();
    if (!extractedTextRaw) return null;

    const densityRaw = String(parsed.text_density || '').toLowerCase();
    const confidenceRaw = String(parsed.confidence || '').toLowerCase();
    const confidence: 'low' | 'medium' | 'high' =
      confidenceRaw === 'high' || confidenceRaw === 'low' ? (confidenceRaw as 'low' | 'high') : 'medium';
    const dense = densityRaw === 'high' || extractedTextRaw.length >= MIN_DENSE_OCR_TEXT_CHARS;

    return {
      extractedText: extractedTextRaw.slice(0, MAX_IMAGE_OCR_TEXT_CHARS),
      dense,
      confidence,
    };
  } catch (error) {
    console.warn('[OCR] Image OCR assist failed:', String(error));
    return null;
  }
}
