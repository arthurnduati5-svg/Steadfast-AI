import { type SexualityPolicyBlockReason } from '../tools/grade-sexuality-policy';
import { localizedText } from './emotional-ai-copilot.teaching.js';

export function detectSupportRiskSignal(inputText: string): 'critical' | 'high' | null {
  const lower = String(inputText || '').toLowerCase();
  if (!lower) return null;

  const immediateSelfHarm =
    /\b(i want to die|i will kill myself|i am going to kill myself|i want to end my life|hurt myself now)\b/i.test(lower);
  if (immediateSelfHarm) return 'critical';

  const selfHarmDistress =
    /\b(suicide|suicidal|self harm|self-harm|cut myself|harm myself|i feel like dying)\b/i.test(lower);
  if (selfHarmDistress) return 'high';

  const sexualAbuseDisclosure =
    /\b(i was raped|raped me|sexual assault|molested me|forced me sexually|someone touched me sexually)\b/i.test(lower);
  if (sexualAbuseDisclosure) return 'high';

  return null;
}

export function buildSupportiveSafetyReply(severity: 'critical' | 'high', languageMode: string): string {
  if (severity === 'critical') {
    return localizedText(
      languageMode,
      'Thank you for telling me this. Your safety matters most right now, and you do not have to handle this alone. Please move to a trusted adult nearby immediately, and if you want, we can take one calm step together right now by saying exactly who you can reach first.',
      'Asante kwa kuniambia hili. Usalama wako ni wa kwanza sasa hivi, na hauko peke yako. Tafadhali mtafute mtu mzima unayemwamini karibu nawe mara moja, kisha tuanze hatua moja tulivu pamoja.',
      '\u0634\u0643\u0631\u064b\u0627 \u0644\u0635\u0631\u0627\u062d\u062a\u0643. \u0633\u0644\u0627\u0645\u062a\u0643 \u0647\u064a \u0627\u0644\u0623\u0647\u0645 \u0627\u0644\u0622\u0646\u060c \u0648\u0644\u0633\u062a \u0648\u062d\u062f\u0643. \u0645\u0646 \u0641\u0636\u0644\u0643 \u062a\u0648\u062c\u0647 \u0625\u0644\u0649 \u0634\u062e\u0635 \u0628\u0627\u0644\u063a \u0645\u0648\u062b\u0648\u0642 \u0642\u0631\u064a\u0628 \u0645\u0646\u0643 \u0641\u0648\u0631\u064b\u0627\u060c \u0648\u064a\u0645\u0643\u0646\u0646\u0627 \u0623\u0646 \u0646\u0623\u062e\u0630 \u062e\u0637\u0648\u0629 \u0647\u0627\u062f\u0626\u0629 \u0645\u0639\u064b\u0627.'
    );
  }
  return localizedText(
    languageMode,
    'Thank you for sharing this with me. What you are feeling is important, and you deserve support and safety. We can go one step at a time together, and you can start by talking to a trusted adult or school counselor while we keep this conversation calm and focused on helping you.',
    'Asante kwa kushiriki hili nami. Unachohisi ni muhimu, na unastahili usaidizi na usalama. Tunaweza kwenda hatua moja baada ya nyingine, ukianzia kuzungumza na mtu mzima unayemwamini au mshauri wa shule.',
    '\u0634\u0643\u0631\u064b\u0627 \u0644\u0645\u0634\u0627\u0631\u0643\u062a\u0643 \u0647\u0630\u0627 \u0645\u0639\u064a. \u0645\u0634\u0627\u0639\u0631\u0643 \u0645\u0647\u0645\u0629\u060c \u0648\u0623\u0646\u062a \u062a\u0633\u062a\u062d\u0642 \u0627\u0644\u062f\u0639\u0645 \u0648\u0627\u0644\u0623\u0645\u0627\u0646. \u064a\u0645\u0643\u0646\u0646\u0627 \u0627\u0644\u0633\u064a\u0631 \u062e\u0637\u0648\u0629 \u062e\u0637\u0648\u0629\u060c \u0648\u0627\u0644\u0628\u062f\u0627\u064a\u0629 \u0628\u0627\u0644\u062d\u062f\u064a\u062b \u0645\u0639 \u0634\u062e\u0635 \u0628\u0627\u0644\u063a \u0645\u0648\u062b\u0648\u0642 \u0623\u0648 \u0627\u0644\u0645\u0631\u0634\u062f \u0627\u0644\u0645\u062f\u0631\u0633\u064a.'
  );
}

export function buildSexualityPolicyReply(reason: SexualityPolicyBlockReason, languageMode: string): string {
  if (reason === 'below_year6') {
    return localizedText(
      languageMode,
      'I cannot teach this topic yet. Reproduction lessons start from Year 6. Ask me another science topic for your current class.',
      'Siwezi kufundisha mada hii bado. Masomo ya reproduction huanza kuanzia Year 6. Niulize mada nyingine ya sayansi inayofaa darasa lako.',
      '\u0644\u0627 \u064a\u0645\u0643\u0646\u0646\u064a \u062a\u062f\u0631\u064a\u0633 \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0636\u0648\u0639 \u0628\u0639\u062f. \u062f\u0631\u0648\u0633 \u0627\u0644\u062a\u0643\u0627\u062b\u0631 \u062a\u0628\u062f\u0623 \u0645\u0646 \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u0633\u0627\u062f\u0633\u0629. \u0627\u0633\u0623\u0644\u0646\u064a \u0639\u0646 \u0645\u0648\u0636\u0648\u0639 \u0639\u0644\u0645\u064a \u0622\u062e\u0631 \u064a\u0646\u0627\u0633\u0628 \u0635\u0641\u0643.'
    );
  }
  if (reason === 'sperm_requires_high_school') {
    return localizedText(
      languageMode,
      'I can teach sperm cell content only at high school level. For now, ask about general reproduction or menstruation.',
      'Ninaweza kufundisha mada ya sperm cell kwa kiwango cha high school tu. Kwa sasa, uliza kuhusu reproduction ya jumla au menstruation.',
      '\u064a\u0645\u0643\u0646\u0646\u064a \u0634\u0631\u062d \u0645\u0648\u0636\u0648\u0639 \u062e\u0644\u064a\u0629 \u0627\u0644\u062d\u064a\u0648\u0627\u0646 \u0627\u0644\u0645\u0646\u0648\u064a \u0641\u0642\u0637 \u0644\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062b\u0627\u0646\u0648\u064a\u0629. \u062d\u0627\u0644\u064a\u064b\u0627 \u064a\u0645\u0643\u0646\u0643 \u0633\u0624\u0627\u0644\u064a \u0639\u0646 \u0623\u0633\u0627\u0633\u064a\u0627\u062a \u0627\u0644\u062a\u0643\u0627\u062b\u0631 \u0623\u0648 \u0627\u0644\u062d\u064a\u0636.'
    );
  }
  if (reason === 'grade_unknown') {
    return localizedText(
      languageMode,
      'I need your class level first. Reproduction topics are for Year 6 and above, and sperm cell content is for high school.',
      'Nahitaji kujua kiwango cha darasa lako kwanza. Mada za reproduction ni kuanzia Year 6 na kuendelea, na sperm cell ni kwa high school.',
      '\u0623\u062d\u062a\u0627\u062c \u0645\u0639\u0631\u0641\u0629 \u0645\u0633\u062a\u0648\u0649 \u0635\u0641\u0643 \u0623\u0648\u0644\u064b\u0627. \u0645\u0648\u0627\u0636\u064a\u0639 \u0627\u0644\u062a\u0643\u0627\u062b\u0631 \u0645\u062a\u0627\u062d\u0629 \u0645\u0646 \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u0633\u0627\u062f\u0633\u0629 \u0641\u0623\u0639\u0644\u0649\u060c \u0648\u0645\u0648\u0636\u0648\u0639 \u0627\u0644\u062d\u064a\u0648\u0627\u0646 \u0627\u0644\u0645\u0646\u0648\u064a \u0644\u0644\u062b\u0627\u0646\u0648\u064a\u0629.'
    );
  }
  return localizedText(
    languageMode,
    'I can only help here with school biology on reproduction and menstruation, plus sperm cell only for high school. Other sexuality topics are not allowed.',
    'Ninaweza kusaidia hapa tu kwa baiolojia ya shule kuhusu reproduction na menstruation, pamoja na sperm cell kwa high school pekee. Mada nyingine za sexuality haziruhusiwi.',
    '\u064a\u0645\u0643\u0646\u0646\u064a \u0627\u0644\u0645\u0633\u0627\u0639\u062f\u0629 \u0647\u0646\u0627 \u0641\u0642\u0637 \u0641\u064a \u0628\u064a\u0648\u0644\u0648\u062c\u064a\u0627 \u0627\u0644\u062a\u0643\u0627\u062b\u0631 \u0648\u0627\u0644\u062d\u064a\u0636\u060c \u0645\u0639 \u0645\u0648\u0636\u0648\u0639 \u062e\u0644\u064a\u0629 \u0627\u0644\u062d\u064a\u0648\u0627\u0646 \u0627\u0644\u0645\u0646\u0648\u064a \u0644\u0644\u062b\u0627\u0646\u0648\u064a\u0629 \u0641\u0642\u0637. \u0645\u0648\u0627\u0636\u064a\u0639 \u0627\u0644\u062c\u0646\u0633\u0627\u0646\u064a\u0629 \u0627\u0644\u0623\u062e\u0631\u0649 \u063a\u064a\u0631 \u0645\u0633\u0645\u0648\u062d\u0629.'
  );
}
