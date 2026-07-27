#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import crypto from 'node:crypto';
import { getRepositoryRoot, getRuntimeDir, computeHash, readJSON, readLines } from './agent-control-lib/repository.mjs';

function requireTaskId(args) {
  const idx = args.indexOf('--task');
  if (idx < 0) throw new Error('--task <task-id> required');
  return args[idx + 1];
}

function checkBlankImage(screenshotPath) {
  if (!existsSync(screenshotPath)) return { blank: true, variance: 0, reason: 'FILE_NOT_FOUND' };
  const stat = statSync(screenshotPath);
  if (stat.size < 100) return { blank: true, variance: 0, reason: 'FILE_TOO_SMALL' };

  const buffer = readFileSync(screenshotPath);
  const signature = buffer.slice(0, 8).toString('hex');

  if (signature.startsWith('89504e47')) {
    try {
      const textDecoder = new TextDecoder();
      let offset = 8;
      let width = 0, height = 0;
      while (offset < buffer.length - 4) {
        const len = buffer.readUInt32BE(offset);
        const type = buffer.slice(offset + 4, offset + 8).toString('ascii');
        if (type === 'IHDR') {
          width = buffer.readUInt32BE(offset + 8);
          height = buffer.readUInt32BE(offset + 12);
          break;
        }
        offset += 12 + len;
      }
      if (width > 0 && height > 0) {
        const pixelDataStart = buffer.length - 256;
        if (pixelDataStart > 8) {
          let sampleSum = 0;
          let sampleCount = 0;
          for (let i = pixelDataStart; i < buffer.length - 4; i += 4) {
            sampleSum += buffer[i];
            sampleCount++;
          }
          const avg = sampleCount > 0 ? sampleSum / sampleCount : 0;
          let variance = 0;
          for (let i = pixelDataStart; i < buffer.length - 4; i += 4) {
            variance += Math.pow(buffer[i] - avg, 2);
          }
          variance = sampleCount > 0 ? Math.sqrt(variance / sampleCount) : 0;
          return { blank: variance < 5, variance, width, height, reason: variance < 5 ? 'LOW_VARIANCE' : 'OK' };
        }
      }
    } catch {
      return { blank: false, variance: 50, reason: 'PARSE_ERROR' };
    }
  } else if (signature.startsWith('ffd8ffe0') || signature.startsWith('ffd8ffe1')) {
    if (stat.size < 1000) return { blank: true, variance: 0, reason: 'JPEG_TOO_SMALL' };
    const midPoint = Math.floor(buffer.length / 2);
    let sampleSum = 0;
    let sampleCount = 0;
    for (let i = midPoint; i < Math.min(midPoint + 1000, buffer.length); i++) {
      sampleSum += buffer[i];
      sampleCount++;
    }
    const avg = sampleCount > 0 ? sampleSum / sampleCount : 0;
    let variance = 0;
    for (let i = midPoint; i < Math.min(midPoint + 1000, buffer.length); i++) {
      variance += Math.pow(buffer[i] - avg, 2);
    }
    variance = sampleCount > 0 ? Math.sqrt(variance / sampleCount) : 0;
    return { blank: variance < 5, variance, reason: variance < 5 ? 'LOW_VARIANCE' : 'OK' };
  }

  return { blank: false, variance: 50, reason: 'UNKNOWN_FORMAT' };
}

function detectErrorSurface(html) {
  if (!html) return null;
  const errorPatterns = [
    { pattern: /application error/i, surface: 'APPLICATION_ERROR' },
    { pattern: /client.side exception/i, surface: 'CLIENT_SIDE_EXCEPTION' },
    { pattern: /unhandled runtime error/i, surface: 'UNHANDLED_RUNTIME_ERROR' },
    { pattern: /internal server error/i, surface: 'INTERNAL_SERVER_ERROR' },
    { pattern: /stack trace/i, surface: 'STACK_TRACE' },
    { pattern: /not found/i, surface: 'NOT_FOUND' },
    { pattern: /next\.js error/i, surface: 'NEXTJS_ERROR' },
    { pattern: /react error/i, surface: 'REACT_ERROR' },
    { pattern: /failed to load/i, surface: 'FAILED_TO_LOAD' },
    { pattern: /cannot GET/i, surface: 'ROUTE_NOT_FOUND' },
  ];
  for (const { pattern, surface } of errorPatterns) {
    if (pattern.test(html)) return surface;
  }
  return null;
}

function validateVisual(taskId) {
  const runtimeDir = getRuntimeDir(taskId);
  const errors = [];

  const visualLedgerPath = resolve(runtimeDir, 'visual-evidence.jsonl');
  if (!existsSync(visualLedgerPath)) {
    return { valid: true, errors: [], warnings: ['No visual evidence ledger found'] };
  }

  const records = readLines(visualLedgerPath).map(l => JSON.parse(l));
  const screenshotHashes = {};
  const sessionErrors = {};

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];

    const screenshotPath = rec.screenshotPath ? resolve(getRepositoryRoot(), rec.screenshotPath) : null;

    if (screenshotPath && !existsSync(screenshotPath)) {
      errors.push(`VISUAL_SCREENSHOT_MISSING at ${i}: ${rec.screenshotPath}`);
      continue;
    }

    if (screenshotPath && existsSync(screenshotPath)) {
      const content = readFileSync(screenshotPath);
      const fileHash = computeHash(content);
      if (fileHash !== rec.screenshotHash) {
        errors.push(`VISUAL_HASH_MISMATCH at ${i}: screenshot hash changed`);
      }

      if (screenshotHashes[fileHash]) {
        const prev = screenshotHashes[fileHash];
        if (prev.intendedSurface !== rec.intendedSurface) {
          errors.push(`VISUAL_DUPLICATE_EXCEPTION at ${i}: same screenshot used for "${prev.intendedSurface}" and "${rec.intendedSurface}"`);
        }
        if (prev.theme !== rec.theme) {
          errors.push(`VISUAL_THEME_REUSE at ${i}: same screenshot for themes "${prev.theme}" and "${rec.theme}"`);
        }
      } else {
        screenshotHashes[fileHash] = { intendedSurface: rec.intendedSurface, theme: rec.theme, index: i };
      }

      const blankCheck = checkBlankImage(screenshotPath);
      if (blankCheck.blank) {
        errors.push(`VISUAL_BLANK_IMAGE at ${i}: variance=${blankCheck.variance}`);
      }

      rec.pixelVariance = blankCheck.variance;
      rec.blankImageResult = blankCheck.blank;
    }

    if (rec.fatalErrorBeforeCapture) {
      errors.push(`VISUAL_CAPTURE_AFTER_FATAL at ${i}: captured after fatal runtime error`);
    }

    if (rec.intendedSurface && rec.detectedSurface && rec.intendedSurface !== rec.detectedSurface) {
      errors.push(`VISUAL_SURFACE_MISMATCH at ${i}: intended="${rec.intendedSurface}" detected="${rec.detectedSurface}"`);
    }

    if (rec.consoleErrorCount > 0) {
      errors.push(`VISUAL_CONSOLE_ERRORS at ${i}: ${rec.consoleErrorCount} console error(s)`);
    }

    if (rec.theme && rec.intendedSurface) {
      const key = `${rec.theme}:${rec.intendedSurface}`;
      if (sessionErrors[key]) {
        if (rec.screenshotHash === sessionErrors[key]) {
          errors.push(`VISUAL_SAME_IMAGE_MULTIPLE_SURFACES at ${i}: same image for ${key}`);
        }
      } else if (rec.detectedSurface && rec.detectedSurface !== rec.intendedSurface) {
        sessionErrors[key] = rec.screenshotHash;
      }
    }
  }

  const manifestPath = resolve(runtimeDir, 'task-manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = readJSON(manifestPath);
    if (manifest.visualAcceptance && manifest.requiredThemes && manifest.requiredThemes.length > 0) {
      const coveredThemes = new Set(records.map(r => r.theme).filter(Boolean));
      for (const theme of manifest.requiredThemes) {
        if (!coveredThemes.has(theme)) {
          errors.push(`VISUAL_THEME_MISSING: required theme "${theme}" not covered`);
        }
      }
      if (manifest.requiredSurfaces) {
        for (const surface of manifest.requiredSurfaces) {
          const surfaceRecords = records.filter(r => r.intendedSurface === surface);
          if (surfaceRecords.length === 0) {
            errors.push(`VISUAL_SURFACE_MISSING: required surface "${surface}" not captured`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings: [] };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'validate') {
    const taskId = requireTaskId(args);
    const result = validateVisual(taskId);
    result.errors.forEach(e => console.error(`ERROR: ${e}`));
    if (result.warnings.length > 0) result.warnings.forEach(w => console.warn(`WARN: ${w}`));
    console.log(`Valid: ${result.valid}`);
    console.log(`Errors: ${result.errors.length}`);
    process.exit(result.valid ? 0 : 1);
  } else if (command === 'check-blank') {
    const path = args[1];
    if (!path) { console.error('Usage: check-blank <image-path>'); process.exit(1); }
    const result = checkBlankImage(path);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.blank ? 1 : 0);
  } else {
    console.error('Usage: node scripts/visual-evidence-validator.mjs validate --task <task-id>');
    process.exit(1);
  }
}

main();
