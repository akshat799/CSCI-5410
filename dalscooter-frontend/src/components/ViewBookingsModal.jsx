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

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'cancelled':
        return 'status-cancelled';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-unknown';
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
                className={`booking-item ${getStatusClass(booking.status)}`}
              >
                <div className="booking-content">
                  <span>
                    <strong>Booking Ref:</strong> {booking.booking_reference}<br />
                    <strong>Bike Type:</strong> {booking.bike_type}<br />
                    <strong>Bike ID:</strong> {booking.bike_id}<br />
                    <strong>Time:</strong> {formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)} (ADT)<br />
                    <strong>Status:</strong>{' '}
                    <span className={`status-label ${getStatusClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </span>
                  <button
                    onClick={() => handleCancel(booking.booking_reference)}
                    className="cancel-btn"
                    disabled={loading || ['cancelled', 'rejected'].includes(booking.status)}
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
