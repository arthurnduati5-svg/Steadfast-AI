"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMode = setMode;
exports.getMode = getMode;
exports.assertMode = assertMode;
let currentMode = 'chat';
function setMode(mode) {
    currentMode = mode;
}
function getMode() {
    return currentMode;
}
function assertMode(expected) {
    if (currentMode !== expected) {
        throw new Error(`Invalid mode access. Expected "${expected}" but current mode is "${currentMode}".`);
    }
}
//# sourceMappingURL=research-state.js.map