// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Chat Response Composer v1
// Composes a natural tutor response from video recommendation
// output without hallucinating metadata, URLs, or transcripts.
// ─────────────────────────────────────────────────────────────

import type {
  VideoChatComposerOutput,
  VideoChatRecommendationMeta,
  VideoChatIntegrationStatus,
} from './videoChatIntegrationContracts';

export class VideoChatResponseComposer {
  /**
   * Compose a natural tutor response from sanitized video recommendations.
   * Does NOT fabricate videos, URLs, or metadata.
   */
  composeVideoResponse(meta: VideoChatRecommendationMeta): VideoChatComposerOutput {
    const warnings: string[] = [...meta.warnings];
    let answerAddon = '';
    const videoMeta = meta;

    switch (meta.status) {
      case 'recommended': {
        const recCount = meta.recommendations.length;
        const reviewCount = meta.reviewQueue.length;

        if (recCount > 0) {
          const lines: string[] = [];
          lines.push(`I found ${recCount} video(s) that may help with this topic.`);

          // List top recommendations (max 3)
          const topRecs = meta.recommendations.slice(0, 3);
          for (let i = 0; i < topRecs.length; i++) {
            const rec = topRecs[i];
            const title = rec.title || `Video ${i + 1}`;
            const reasons = rec.reasons.length > 0
              ? rec.reasons.slice(0, 2).join('; ')
              : null;

            let line = `  ${i + 1}. ${title}`;
            if (reasons) line += ` — ${reasons}`;
            lines.push(line);
          }

          if (reviewCount > 0) {
            lines.push(`Note: ${reviewCount} additional video(s) need teacher review before they can be recommended.`);
          }

          lines.push('Would you like me to explain more about any of these?');
          answerAddon = lines.join('\n');
        } else if (reviewCount > 0) {
          answerAddon = `I found ${reviewCount} video(s) that could help, but they need teacher review first. Would you like to ask your teacher to review them?`;
        }
        break;
      }

      case 'needs_teacher_review': {
        const count = meta.reviewQueue.length;
        answerAddon = `I found ${count} video(s) that could help, but ${count > 1 ? 'they' : 'it'} need${count === 1 ? 's' : ''} teacher review before I can recommend ${count > 1 ? 'them' : 'it'}. Please check with your teacher.`;
        break;
      }

      case 'no_candidates': {
        answerAddon = 'I was unable to find safe video recommendations for this topic. You can try describing the topic in more detail, or ask your teacher to suggest specific videos.';
        break;
      }

      case 'needs_clarification': {
        answerAddon = 'To recommend a helpful video, could you tell me which topic or concept you need help with?';
        break;
      }

      case 'blocked': {
        answerAddon = 'Video recommendations are not available right now due to content policy restrictions. Please continue with your study materials.';
        break;
      }

      case 'error': {
        answerAddon = 'I encountered an issue finding video recommendations. Please try again later.';
        warnings.push('Video recommendation service error.');
        break;
      }

      default: {
        answerAddon = '';
        break;
      }
    }

    return {
      answerAddon,
      videoMeta,
      warnings,
    };
  }
}

export const videoChatResponseComposer = new VideoChatResponseComposer();
