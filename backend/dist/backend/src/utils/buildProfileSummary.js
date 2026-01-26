export const buildProfileSummary = (profile) => {
    let summary = `Student ${profile.name || ''} (ID: ${profile.userId}) is in grade ${profile.gradeLevel || ''}. `;
    if (profile.preferredLanguage) {
        summary += `They prefer to learn in ${profile.preferredLanguage}. `;
    }
    if (profile.preferences) {
        const preferences = profile.preferences;
        if (preferences.interests) {
            summary += `Their interests include ${preferences.interests.join(', ')}. `;
        }
        if (preferences.learningStyle) {
            summary += `They have a ${preferences.learningStyle} learning style. `;
        }
    }
    if (profile.favoriteShows) {
        summary += `Their favorite shows are ${JSON.stringify(profile.favoriteShows)}. `;
    }
    return summary.trim();
};
//# sourceMappingURL=buildProfileSummary.js.map