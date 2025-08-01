import React, { useState, useEffect } from 'react';
import SlotForm from '../components/SlotForm';
import { getAuthHeaders } from '../services/apiService';

const API_URL = import.meta.env.VITE_API_BASE_URL;

function FranchiseAvailabilityDashboard() {
  const [scooterId, setScooterId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (scooterId && date) {
      fetchSlots();
    }
  }, [scooterId, date, refresh]);

  const fetchSlots = async () => {
    try {
      const res = await fetch(`${API_URL}/booking/get?scooterId=${scooterId}&date=${date}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error('Failed to load availability:', err);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manage Availability</h2>
      <input type="text" value={scooterId} onChange={(e) => setScooterId(e.target.value)} placeholder="Scooter ID" className="mb-2 p-2 border rounded w-full" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mb-4 p-2 border rounded w-full" />

      <SlotForm scooterId={scooterId} date={date} onAdded={() => setRefresh(!refresh)} />

      <h3 className="text-lg font-semibold mt-6">Existing Slots</h3>
      <ul className="mt-2">
        {slots.map((slot, idx) => (
          <li key={idx} className="border-b py-2">{slot.startTime} – {slot.endTime}</li>
        ))}
      </ul>
    </div>
  );
}

export default FranchiseAvailabilityDashboard;
