import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { apiService } from '../services/apiService';
import '../styles/BookSlotModal.css';

Modal.setAppElement('#root');

function BookSlotModal({ bikeId, onClose }) {
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSlots();
  }, [bikeId]);

  const fetchSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getAvailability(bikeId);
      setSlots(data.slots || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch available slots');
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

  const handleBook = async () => {
    if (!selectedSlotId) {
      setError('Please select a slot');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const slot = slots.find(s => s.slot_id === selectedSlotId);
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const bookingData = {
        bike_id: bikeId,
        slot_id: selectedSlotId,
        user_id: userData.email, // Use email instead of sub
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
      const result = await apiService.bookSlot(bookingData);
      setSuccess(result.message || 'Booking created successfully');
      setSelectedSlotId('');
      await fetchSlots(); // Refresh available slots
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onRequestClose={onClose}
      contentLabel="Book Slot"
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      <h2>Book a Slot for Bike ID: {bikeId}</h2>
      {error && <p className="modal-message error">{error}</p>}
      {success && <p className="modal-message success">{success}</p>}
      {loading ? (
        <div className="loading">Loading slots...</div>
      ) : slots.length === 0 ? (
        <p className="modal-message">No available slots for this bike.</p>
      ) : (
        <div className="slots-list">
          <h3 className="slots-title">Available Slots ({slots.length})</h3>
          <ul>
            {slots.map((slot) => (
              <li key={slot.slot_id} className="slot-item">
                <label className="slot-label">
                  <input
                    type="radio"
                    name="slot"
                    value={slot.slot_id}
                    checked={selectedSlotId === slot.slot_id}
                    onChange={() => setSelectedSlotId(slot.slot_id)}
                  />
                  {formatDateTime(slot.startTime)} - {formatDateTime(slot.endTime)} (ADT)
                </label>
              </li>
            ))}
          </ul>
          <button
            onClick={handleBook}
            disabled={loading || !selectedSlotId}
            className="book-btn"
          >
            {loading ? 'Booking...' : 'Book Selected Slot'}
          </button>
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

export default BookSlotModal;