export async function formatPreferencesTool(input) {
    const lang = input.preferredLanguage || 'English';
    const interests = Array.isArray(input.interests) && input.interests.length > 0 ? input.interests.join(', ') : 'general Kenyan examples';
    const instr = `Use ${lang} mode. Prefer examples related to ${interests}. Personalize tone to the student and keep responses short.`;
    return { instructionText: instr };
}
//# sourceMappingURL=formatPreferences.js.map