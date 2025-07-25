import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { apiService } from '../services/apiService';
import '../styles/ViewAvailabilityModal.css';

Modal.setAppElement('#root');

function ViewAvailabilityModal({ bikeId, onClose }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiService.getAvailability(bikeId);
        setSlots(data.slots || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch availability');
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [bikeId]);

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Halifax',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <Modal
      isOpen
      onRequestClose={onClose}
      contentLabel="View Availability"
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      <h2>Availability for Bike ID: {bikeId}</h2>
      {error && <p className="modal-message error">{error}</p>}
      {loading ? (
        <div className="loading">Loading slots...</div>
      ) : slots.length === 0 ? (
        <p className="modal-message">No availability slots found for this bike.</p>
      ) : (
        <div className="slots-list">
          <h3 className="slots-title">Available Slots ({slots.length})</h3>
          <ul>
            {slots.map((slot, index) => (
              <li key={slot.slot_id || index} className="slot-item">
                <span>
                  {formatDateTime(slot.startTime)} - {formatDateTime(slot.endTime)} (ADT)
                </span>
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

export default ViewAvailabilityModal;