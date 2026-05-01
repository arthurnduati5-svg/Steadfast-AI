"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatMessageContent = formatMessageContent;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function formatMessageContent(content) {
    // Remove stray newlines that might come from the AI
    let cleanContent = content.replace(/\n/g, " ").replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
    // Convert URLs into clickable links with text-primary class
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    cleanContent = cleanContent.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary">${url}</a>`;
    });
    return cleanContent;
}
//# sourceMappingURL=utils.js.map