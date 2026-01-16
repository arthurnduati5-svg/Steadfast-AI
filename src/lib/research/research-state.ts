export type CognitiveMode = 'chat' | 'research' | 'teaching';

let currentMode: CognitiveMode = 'chat';

export function setMode(mode: CognitiveMode) {
  currentMode = mode;
}

export function getMode(): CognitiveMode {
  return currentMode;
}

export function assertMode(expected: CognitiveMode) {
  if (currentMode !== expected) {
    throw new Error(
      `Invalid mode access. Expected "${expected}" but current mode is "${currentMode}".`
    );
  }
}
