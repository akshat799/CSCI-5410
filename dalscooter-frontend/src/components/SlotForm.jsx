import React, { useState } from 'react';
import { getAuthHeaders } from '../services/apiService';

const API_URL = import.meta.env.VITE_API_BASE_URL;

function SlotForm({ scooterId, date, onAdded }) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddSlot = async () => {
    if (!scooterId || !date || !startTime || !endTime) return alert('All fields are required');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/booking/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          scooterId,
          date,
          slots: [{ startTime, endTime }]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Add failed');
      onAdded();
      setStartTime('');
      setEndTime('');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center mb-4">
      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="p-2 border rounded" />
      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="p-2 border rounded" />
      <button
        onClick={handleAddSlot}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {loading ? 'Adding...' : 'Add Slot'}
      </button>
    </div>
  );
}

export default SlotForm;
