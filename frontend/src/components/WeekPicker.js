import React from 'react';

export default function WeekPicker({ weeks, onSelect }) {
  return (
    <div>
      <label><b>Week</b></label>
      <select onChange={e => onSelect(e.target.value)}>
        <option value="">Select week</option>
        {weeks.map(w => <option key={w.WeekId} value={w.WeekId}>{w.WeekName}</option>)}
      </select>
    </div>
  );
}
