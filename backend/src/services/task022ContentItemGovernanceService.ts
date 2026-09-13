import type { ContentItem, ContentItemStatus, ContentItemType, ContentUseDecision, ContentUsePolicy, ContentSensitivity, ContentReviewState } from './task022ContentGovernanceContracts';

export class ContentItemGovernanceService {
  private items: Map<string, ContentItem> = new Map();

  registerItem(item: ContentItem): void {
    this.items.set(item.id, item);
  }

  getItem(itemId: string): ContentItem | null {
    return this.items.get(itemId) || null;
  }

  getItemsForTopic(topicId: string): ContentItem[] {
    return Array.from(this.items.values()).filter(i => i.topicId === topicId);
  }

  getItemsForSkill(skillId: string): ContentItem[] {
    return Array.from(this.items.values()).filter(i => i.skillId === skillId);
  }

  getLearnerSafeContent(itemId: string): { content?: string; policy: ContentUsePolicy; reasonCodes: string[] } {
    const item = this.items.get(itemId);
    if (!item) return { policy: 'block_all', reasonCodes: ['content-not-found'] };

    const decision = this.getContentUsePolicy(item);

    if (decision.policy !== 'allow_learner') {
      return { policy: decision.policy, reasonCodes: decision.reasonCodes };
    }

    return {
      content: item.studentSafeContent,
      policy: 'allow_learner',
      reasonCodes: ['learner-content-allowed'],
    };
  }

  getTeacherSafeContent(itemId: string): { content?: string; policy: ContentUsePolicy; reasonCodes: string[] } {
    const item = this.items.get(itemId);
    if (!item) return { policy: 'block_all', reasonCodes: ['content-not-found'] };

    if (item.status === 'blocked' || item.status === 'rejected') {
      return { policy: 'block_all', reasonCodes: ['content-blocked'] };
    }

    return {
      content: item.teacherSafeContent || item.studentSafeContent,
      policy: 'allow_teacher_only',
      reasonCodes: ['teacher-content-allowed'],
    };
  }

  isAnswerKeyProtected(itemId: string): boolean {
    const item = this.items.get(itemId);
    return !!item && item.answerKeyProtected;
  }

  isTeacherOnly(itemId: string): boolean {
    const item = this.items.get(itemId);
    return !!item && item.teacherOnly;
  }

  getContentUsePolicy(item: ContentItem): ContentUseDecision {
    if (item.status === 'blocked') return { policy: 'block_all', reasonCodes: ['content-blocked'] };
    if (item.status === 'rejected') return { policy: 'block_all', reasonCodes: ['content-rejected'] };
    if (item.status === 'draft') return { policy: 'block_all', reasonCodes: ['content-draft'] };
    if (item.status === 'pending_review') return { policy: 'block_all', reasonCodes: ['content-pending-review'] };
    if (item.status === 'deprecated') return { policy: 'block_all', reasonCodes: ['content-deprecated'] };

    if (item.answerKeyProtected && item.teacherOnly) {
      return { policy: 'allow_teacher_only', reasonCodes: ['answer-key-teacher-only'] };
    }

    if (item.answerKeyProtected) {
      return { policy: 'allow_teacher_only', reasonCodes: ['answer-key-protected'] };
    }

    if (item.teacherOnly) {
      return { policy: 'allow_teacher_only', reasonCodes: ['teacher-only-content'] };
    }

    return { policy: 'allow_learner', reasonCodes: ['content-safe-for-learner'] };
  }

  setItemStatus(itemId: string, status: ContentItemStatus): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;
    item.status = status;
    return true;
  }

  setReviewState(itemId: string, state: ContentReviewState): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;
    item.reviewState = state;
    return true;
  }

  getAllItems(): ContentItem[] {
    return Array.from(this.items.values());
  }

  reset(): void {
    this.items.clear();
  }
}

export const contentItemGovernanceService = new ContentItemGovernanceService();
