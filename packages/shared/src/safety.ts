// DayZero — Deterministic, Clinically Reviewed Safety Guidelines
// These guidance rules are completely offline, transparent, deterministic,
// and strictly NEVER depend on AI models or external network calls.

export interface EmergencyWarning {
  title: string;
  urgency: 'critical_emergency' | 'high_priority' | 'urgent_counselling';
  symptoms: string[];
  immediateAction: string;
  contraindications: string[];
  helpline: string;
}

export const EMERGENCY_GUIDANCE: Record<string, EmergencyWarning> = {
  severe_alcohol_withdrawal: {
    title: 'Severe Alcohol / Sedative Withdrawal (Risk of Seizure & Delirium Tremens)',
    urgency: 'critical_emergency',
    symptoms: [
      'Uncontrolled severe tremors or shaking',
      'Generalized seizures or convulsions',
      'Visual, auditory or tactile hallucinations (seeing or feeling things not present)',
      'High fever, excessive sweating, or extreme rapid heartbeat',
      'Acute confusion, profound disorientation, or agitation',
    ],
    immediateAction:
      'Call 112 or take the person to the nearest government emergency department immediately. Keep them safe from physical injury.',
    contraindications: [
      'NEVER attempt unmonitored, sudden home detoxification ("cold turkey") if there is heavy daily alcohol or sedative dependence. Alcohol withdrawal can be fatal without inpatient medical stabilization.',
      'Do not administer non-prescribed sedatives or home remedies.',
    ],
    helpline: '112',
  },

  suspected_overdose: {
    title: 'Suspected Substance / Opioid Overdose',
    urgency: 'critical_emergency',
    symptoms: [
      'Unconsciousness or inability to wake up',
      'Extremely shallow, irregular, or stopped breathing (choking/gurgling sounds)',
      'Pale, clammy skin or bluish/greyish lips and fingernails (cyanosis)',
      'Extremely pinpoint (constricted) pupils',
      'Limp body',
    ],
    immediateAction:
      '1. Call 112 immediately.\n2. If Naloxone is available and trained, administer as directed.\n3. Turn person onto their side into the Recovery Position to keep the airway clear.\n4. Stay with them until emergency responders arrive.',
    contraindications: [
      'Do NOT leave the person alone to "sleep it off".',
      'Do NOT place them in a cold bath or induce vomiting.',
    ],
    helpline: '112',
  },

  acute_psychological_crisis: {
    title: 'Acute Mental Health Crisis / Suicidal Thoughts',
    urgency: 'high_priority',
    symptoms: [
      'Overwhelming feelings of hopelessness or worthlessness',
      'Active thoughts or intent to harm oneself',
      'Severe panic attacks with inability to regulate breathing',
    ],
    immediateAction:
      'Call Tele-MANAS at 14416 (or toll-free 1800-891-4416) immediately. You will be connected to a trained mental health professional in Malayalam or English.',
    contraindications: [
      'Do not remain isolated. Reach out to a trusted family member, peer, or helpline.',
    ],
    helpline: '14416',
  },
};

export const CLINICAL_SAFETY_DISCLAIMER =
  'DayZero is a digital peer-support, recovery-companion, and directory tool. It does NOT provide medical diagnosis, clinical treatment plans, or pharmaceutical prescriptions. Recovery from chemical dependence requires medical oversight. In any medical emergency, call 112 directly.';
