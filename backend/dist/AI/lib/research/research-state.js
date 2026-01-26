let currentMode = 'chat';
export function setMode(mode) {
    currentMode = mode;
}
export function getMode() {
    return currentMode;
}
export function assertMode(expected) {
    if (currentMode !== expected) {
        throw new Error(`Invalid mode access. Expected "${expected}" but current mode is "${currentMode}".`);
    }
}
//# sourceMappingURL=research-state.js.map