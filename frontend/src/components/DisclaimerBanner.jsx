import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DisclaimerBanner({ darkMode = true }) {
  return (
    <div
      className={`rounded-xl px-4 py-3 border flex items-start gap-3 text-xs leading-relaxed ${
        darkMode
          ? 'bg-amber-500/10 border-amber-500/25 text-amber-200/90'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}
    >
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <p>
        <strong>Academic Screening Disclaimer:</strong> Predictions and confidence scores are
        statistical outputs from machine learning models trained on historical physicochemical data.
        They are <strong>not</strong> official drinking-water safety certifications and do not
        guarantee water is safe for consumption. Laboratory testing per BIS IS 10500 / WHO
        guidelines is required for official potability certification.
      </p>
    </div>
  );
}
