import { describe, expect, it } from 'vitest';
import {
  getAdaptiveDeliveryLayers,
  getDeliveryRefinementLayer,
  getLanguageGovernance,
  getMasterBehavioralOrchestrationLayer
} from '../tools/multilingual-governance';

describe('Multilingual governance refinement layer', () => {
  it('exposes a delivery refinement layer that is presentation-only', () => {
    const layer = getDeliveryRefinementLayer();
    expect(layer).toContain('PRESENTATION-ONLY');
    expect(layer.toLowerCase()).toContain('do not modify, override, or reinterpret core instructional logic');
    expect(layer.toLowerCase()).toContain('enhance delivery, do not replace reasoning');
  });

  it('embeds the delivery refinement mandate in language governance output', () => {
    const prompt = getLanguageGovernance('english', ['science']);
    expect(prompt).toContain('DELIVERY REFINEMENT LAYER');
    expect(prompt.toLowerCase()).toContain('presentation-only');
    expect(prompt.toLowerCase()).toContain('silent final check before responding');
  });

  it('activates voice and young-kids layers from context', () => {
    const layers = getAdaptiveDeliveryLayers({
      voiceMode: true,
      gradeLevel: 'Grade 2',
      userText: 'Help me with basic subtraction',
    });

    expect(layers).toContain('VOICE-MODE SPECIFIC POLISH LAYER');
    expect(layers).toContain('YOUNG KIDS DELIVERY LAYER');
    expect(layers).not.toContain('TEEN ACADEMIC PERFORMANCE LAYER');
  });

  it('activates teen and exam-coach layers from context and intent', () => {
    const layers = getAdaptiveDeliveryLayers({
      voiceMode: false,
      gradeLevel: 'UpperSecondary',
      userText: 'Teach me exam strategy for this past paper',
    });

    expect(layers).toContain('TEEN ACADEMIC PERFORMANCE LAYER');
    expect(layers).toContain('HIGH-PERFORMANCE EXAM COACH LAYER');
    expect(layers).not.toContain('YOUNG KIDS DELIVERY LAYER');
  });

  it('builds a master orchestration layer with context signals and priority rules', () => {
    const orchestration = getMasterBehavioralOrchestrationLayer({
      voiceMode: true,
      gradeLevel: 'Form 2',
      examMode: true,
      userText: 'I am confused, please solve this step by step for exam revision',
      validationAttemptCount: 3,
      proceduralMode: true,
    });

    expect(orchestration).toContain('MASTER ORCHESTRATION LAYER');
    expect(orchestration).toContain('Behavioral conflict priority order');
    expect(orchestration).toContain('Voice mode: active');
    expect(orchestration).toContain('Exam context: detected');
    expect(orchestration).toContain('Student struggle: detected');
    expect(orchestration).toContain('Task type: procedural_solving');
    expect(orchestration).toContain('PRODUCTION-READY UNIFIED SYSTEM DIRECTIVE');
    expect(orchestration).toContain('PSYCHOLOGICAL PRESENCE LAYER');
    expect(orchestration).toContain('COMPETITIVE DIFFERENTIATION LAYER');
    expect(orchestration).toContain('NEURO-ENGAGEMENT LAYER');
    expect(orchestration).toContain('FOUNDER-LEVEL STRATEGIC ARCHITECTURE LAYER');
  });
});
