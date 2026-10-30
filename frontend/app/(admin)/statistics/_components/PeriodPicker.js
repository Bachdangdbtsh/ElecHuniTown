'use client';

import { useState } from 'react';
import { PRESETS, presetRange, todayVN } from '../_lib/dates';

export default function PeriodPicker({ range, onChange }) {
  const [preset, setPreset] = useState('thisMonth');
  const [hint, setHint] = useState('');
  const [draft, setDraft] = useState(null); // giá trị đang gõ ở chế độ Tùy chọn (có thể chưa hợp lệ)

  function choose(key) {
    setPreset(key);
    setHint('');
    setDraft(key === 'custom' ? range : null);
    if (key !== 'custom') onChange(presetRange(key));
  }

  function setField(field, value) {
    if (!value) return;
    const next = { ...(draft ?? range), [field]: value };
    setDraft(next);
    if (next.from > next.to) {
      setHint('Ngày bắt đầu không được sau ngày kết thúc');
      return;
    }
    setHint('');
    onChange(next);
  }

  return (
    <div className="st-period">
      <div className="st-segment" role="group" aria-label="Chọn kỳ báo cáo">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            className="st-segment-btn"
            aria-pressed={preset === p.key}
            onClick={() => choose(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 'custom' && range && (
        <div className="st-custom">
          <label>
            Từ ngày
            <input type="date" value={(draft ?? range).from} max={todayVN()} onChange={(e) => setField('from', e.target.value)} />
          </label>
          <label>
            Đến ngày
            <input type="date" value={(draft ?? range).to} max={todayVN()} onChange={(e) => setField('to', e.target.value)} />
          </label>
        </div>
      )}
      {hint && (
        <p className="st-hint" role="alert">
          {hint}
        </p>
      )}
    </div>
  );
}
