import type { DeenSensitivityLevel, DeenReferralDecision, DeenClassificationResult, DeenHandlingDecision, ContentSensitivity } from './task022ContentGovernanceContracts';

export class DeenContentGovernanceService {
  classify(text: string, topic?: string, subject?: string): DeenClassificationResult {
    const lower = text.toLowerCase();
    const reasons: string[] = [];

    const sectarianKeywords = ['shia', 'sunni', 'sufi', 'salafi', 'deobandi', 'barelvi', 'ibadi', 'qadiani', 'ahmadi', 'mahdi', 'caliphate'];
    const fiqhKeywords = ['fatwa', 'ruling', 'hukm', 'haram', 'halal', 'makruh', 'wajib', 'mustahab', 'mubah', 'bidah', 'kufr', 'shirk'];
    const privateDoubtKeywords = ['i doubt', 'i am confused about islam', 'i don\'t believe', 'losing faith', 'questioning islam', 'doubts about allah'];
    const basicKeywords = ['wudu', 'salah', 'salat', 'zakat', 'fasting', 'sawm', 'hajj', 'tawheed', 'aqeedah', 'quran', 'surah', 'ayat', 'dua', 'hadith'];

    if (sectarianKeywords.some(k => lower.includes(k))) {
      reasons.push('sectarian-sensitive-keywords-detected');
      return { level: 'sectarian_sensitive', confidence: 0.9, reasonCodes: reasons };
    }

    if (fiqhKeywords.some(k => lower.includes(k))) {
      reasons.push('fiqh-like-keywords-detected');
      return { level: 'fiqh_like', confidence: 0.85, reasonCodes: reasons };
    }

    if (privateDoubtKeywords.some(k => lower.includes(k))) {
      reasons.push('private-religious-doubt-keywords-detected');
      return { level: 'private_doubt', confidence: 0.8, reasonCodes: reasons };
    }

    if (basicKeywords.some(k => lower.includes(k))) {
      reasons.push('basic-deen-keywords-detected');
      return { level: 'basic_curriculum', confidence: 0.9, reasonCodes: reasons };
    }

    if (subject === 'Aqeedah' || subject === 'Fiqh' || subject === 'Tafseer') {
      reasons.push('advanced-deen-subject-detected');
      return { level: 'advanced_source_sensitive', confidence: 0.7, reasonCodes: reasons };
    }

    reasons.push('unknown-deen-content');
    return { level: 'unknown', confidence: 0.3, reasonCodes: reasons };
  }

  decideHandling(classification: DeenClassificationResult): DeenHandlingDecision {
    const reasons = [...classification.reasonCodes];

    switch (classification.level) {
      case 'basic_curriculum':
        return {
          level: 'basic_curriculum',
          referral: 'no_referral',
          safeSummary: 'This topic may be addressed using approved basic curriculum content.',
          reasonCodes: [...reasons, 'basic-curriculum-allowed'],
        };

      case 'advanced_source_sensitive':
        return {
          level: 'advanced_source_sensitive',
          referral: 'scholar_referral',
          safeSummary: 'This topic requires approved scholarly sources. The tutor cannot improvise religious explanations beyond approved curriculum content.',
          reasonCodes: [...reasons, 'advanced-deen-requires-scholar-source'],
        };

      case 'fiqh_like':
        return {
          level: 'fiqh_like',
          referral: 'scholar_referral',
          safeSummary: 'I cannot provide religious rulings. This question needs a qualified scholar or teacher.',
          reasonCodes: [...reasons, 'fiqh-like-requires-scholar-referral'],
        };

      case 'sectarian_sensitive':
        return {
          level: 'sectarian_sensitive',
          referral: 'safeguarding_referral',
          safeSummary: 'This topic involves sensitive religious differences. The tutor must refer to a qualified teacher or scholar.',
          reasonCodes: [...reasons, 'sectarian-sensitive-requires-safeguarding-referral'],
        };

      case 'private_doubt':
        return {
          level: 'private_doubt',
          referral: 'safeguarding_referral',
          safeSummary: 'It sounds like you have some deep questions. It is good to talk to a trusted teacher or adult about these feelings.',
          reasonCodes: [...reasons, 'private-religious-doubt-requires-pastoral-support'],
        };

      case 'unapproved_claim':
        return {
          level: 'unapproved_claim',
          referral: 'blocked',
          safeSummary: 'I cannot confirm or discuss this claim without approved sources.',
          reasonCodes: [...reasons, 'unapproved-claim-blocked'],
        };

      default:
        return {
          level: 'unknown',
          referral: 'teacher_referral',
          safeSummary: 'I need more context to help with this topic safely. Please ask your teacher for guidance.',
          reasonCodes: [...reasons, 'unknown-deen-level-requires-teacher-review'],
        };
    }
  }

  isSectarianSensitive(text: string): boolean {
    const lower = text.toLowerCase();
    const keywords = ['shia vs sunni', 'sunni vs shia', 'which sect', 'which madhab', 'which school of thought', 'are shia', 'are sunni', 'sufi', 'salafi', 'deobandi', 'barelvi'];
    return keywords.some(k => lower.includes(k));
  }

  requiresScholarReferral(level: DeenSensitivityLevel): boolean {
    return level === 'advanced_source_sensitive' || level === 'fiqh_like' || level === 'sectarian_sensitive' || level === 'private_doubt' || level === 'unapproved_claim';
  }
}

export const deenContentGovernanceService = new DeenContentGovernanceService();
