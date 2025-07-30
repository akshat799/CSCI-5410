import React, { useState } from 'react';
import { getAuthHeaders } from '../services/apiService';

const API_URL = import.meta.env.VITE_API_BASE_URL;

function CancelBookingButton({ bookingId, onCancel }) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/booking/cancel`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ bookingId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cancellation failed');
      onCancel();
    } catch (err) {
      console.error('Cancel failed:', err);
      alert('Failed to cancel booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="mt-2 inline-block px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
    >
      {loading ? 'Cancelling...' : 'Cancel Booking'}
    </button>
  );
}

export default CancelBookingButton;
