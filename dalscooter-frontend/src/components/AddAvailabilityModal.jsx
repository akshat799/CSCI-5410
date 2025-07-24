import React, { useState } from 'react';
import Modal from 'react-modal';
import { getAuthHeaders } from '../services/apiService';

const API_URL = import.meta.env.VITE_API_BASE_URL;

function AddAvailabilityModal({ scooterId, onClose, onSuccess }) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) {
      setMsg('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/booking/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          scooterId,
          date,
          slots: [{ startTime, endTime }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Add availability failed');
      setMsg('Availability added successfully');
      onSuccess(); // reload bike list or refresh UI
    } catch (err) {
      setMsg('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onRequestClose={onClose} className="bg-white p-6 max-w-md mx-auto mt-20 rounded shadow-lg outline-none">
      <h2 className="text-xl font-semibold mb-4">Add Availability for {scooterId}</h2>
      {msg && <p className="text-sm mb-2">{msg}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded" required />
        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 border rounded" required />
        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 border rounded" required />
        <div className="flex gap-4 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Close</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Adding...' : 'Add Slot'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddAvailabilityModal;
