import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '../services/apiService';
import CancelBookingButton from '../components/CancelBookingButton';

const API_URL = import.meta.env.VITE_API_BASE_URL;

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_URL}/booking/bookings`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Your Bookings</h2>
      {loading ? (
        <p>Loading...</p>
      ) : bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b, idx) => (
            <li key={idx} className="p-4 border rounded shadow-sm bg-white">
              <p><strong>Booking ID:</strong> {b.bookingId}</p>
              <p><strong>Scooter ID:</strong> {b.scooterId}</p>
              <p><strong>Date:</strong> {b.date}</p>
              <p><strong>Time:</strong> {b.startTime} – {b.endTime}</p>
              <CancelBookingButton bookingId={b.bookingId} onCancel={fetchBookings} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BookingsPage;
