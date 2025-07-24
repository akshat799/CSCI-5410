import React, { useState } from 'react';
import Modal from 'react-modal';
import { getAuthHeaders } from '../services/apiService';

const API_URL = import.meta.env.VITE_API_BASE_URL;

function BookingModal({ slot, onClose, onBooked }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!slot) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/booking/book`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          scooterId: slot.scooterId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Booking failed');
      setMessage(`✅ Booking confirmed. Reference: ${data.bookingId}`);
      onBooked();
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onRequestClose={onClose} className="bg-white p-6 rounded-lg max-w-md mx-auto mt-20 shadow-xl outline-none">
      <h2 className="text-xl font-bold mb-4">Confirm Booking</h2>
      <p className="mb-2"><strong>Scooter:</strong> {slot.scooterId}</p>
      <p className="mb-2"><strong>Date:</strong> {slot.date}</p>
      <p className="mb-4"><strong>Time:</strong> {slot.startTime} – {slot.endTime}</p>
      {message && <p className="text-sm mb-3">{message}</p>}
      <div className="flex gap-4 justify-end">
        <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Booking...' : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
}

export default BookingModal;
