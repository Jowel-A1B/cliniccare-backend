// HONESTY NOTE: these are simple, transparent rule-based heuristics — not
// trained ML models. A real version would train on historical appointment/
// outcome data (e.g. scikit-learn / a small classifier service) and this
// file is exactly where that model's `.predict()` call would go instead of
// the keyword/ratio logic below. Kept deliberately simple and inspectable.

const KEYWORD_RISK_MAP = {
  heart: ['heart', 'cardiac', 'chest pain', 'hypertension', 'blood pressure', 'cardio'],
  diabetes: ['diabetes', 'sugar', 'glucose', 'insulin'],
};

function bandFromScore(score) {
  if (score >= 3) return 'High';
  if (score >= 1) return 'Medium';
  return 'Low';
}

// records: array of MedicalRecord docs ({ diagnosis, notes })
// patient: { age }
function computePatientRiskScore(records, patient) {
  const text = records.map((r) => `${r.diagnosis || ''} ${r.notes || ''}`).join(' ').toLowerCase();

  const scores = {};
  for (const [risk, keywords] of Object.entries(KEYWORD_RISK_MAP)) {
    let score = keywords.reduce((sum, kw) => sum + (text.includes(kw) ? 1 : 0), 0);
    if (patient?.age && patient.age > 50) score += 1;
    scores[risk] = score;
  }

  const recommended = [];
  if (scores.heart >= 1) recommended.push('Cardiologist consultation');
  if (scores.diabetes >= 1) recommended.push('Blood sugar test');

  return {
    heartRisk: bandFromScore(scores.heart),
    diabetesRisk: bandFromScore(scores.diabetes),
    recommended,
    method: 'rule-based heuristic (keyword + age) — not a trained clinical model',
  };
}

// appointments: array of a patient's past Appointment docs, most recent first
function computeNoShowRisk(appointments) {
  const past = appointments.filter((a) => ['completed', 'cancelled', 'no_show'].includes(a.status));
  if (past.length < 3) {
    return { risk: null, label: 'Insufficient history', sampleSize: past.length };
  }

  const noShowish = past.filter((a) => a.status === 'no_show' || a.status === 'cancelled').length;
  const ratio = noShowish / past.length;

  let label = 'Low';
  if (ratio >= 0.5) label = 'High';
  else if (ratio >= 0.25) label = 'Medium';

  return { risk: Math.round(ratio * 100), label, sampleSize: past.length };
}

module.exports = { computePatientRiskScore, computeNoShowRisk };
