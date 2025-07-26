import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { apiService } from '../services/apiService';
import '../styles/ViewBookingsModal.css';

Modal.setAppElement('#root');

function ViewBookingsModal({ onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getBookings();
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Halifax',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const handleCancel = async (bookingReference) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await apiService.cancelBooking(bookingReference);
      setSuccess(result.message || 'Booking cancelled successfully');
      await fetchBookings();
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onRequestClose={onClose}
      contentLabel="View Bookings"
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      <h2>Your Bookings</h2>
      {error && <p className="modal-message error">{error}</p>}
      {success && <p className="modal-message success">{success}</p>}
      {loading ? (
        <div className="loading">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <p className="modal-message">You have no bookings.</p>
      ) : (
        <div className="bookings-list">
          <h3 className="bookings-title">Bookings ({bookings.length})</h3>
          <ul>
            {bookings.map((booking) => (
              <li
                key={booking.booking_reference}
                className={`booking-item ${booking.status === 'cancelled' ? 'cancelled' : 'booked'}`}
              >
                <div className="booking-content">
                  <span>
                    Booking Ref: {booking.booking_reference}<br />
                    Bike Type: {booking.bike_type}<br />
                    Bike ID: {booking.bike_id}<br />
                    {formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)} (ADT)
                  </span>
                  <button
                    onClick={() => handleCancel(booking.booking_reference)}
                    className="cancel-btn"
                    disabled={loading || booking.status === 'cancelled'}
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="modal-footer">
        <button type="button" onClick={onClose} className="close-btn">
          Close
        </button>
      </div>
    </Modal>
  );
}

export default ViewBookingsModal;