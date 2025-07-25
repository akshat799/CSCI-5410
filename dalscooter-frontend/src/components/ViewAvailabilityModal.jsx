import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { apiService } from '../services/apiService';
import '../styles/ViewAvailabilityModal.css';

Modal.setAppElement('#root');

function ViewAvailabilityModal({ bikeId, onClose }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editForm, setEditForm] = useState({ startTime: '', endTime: '' });

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
      setError(err.message || 'Failed to fetch availability');
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

  const formatTimeForInput = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/Halifax',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;
    setLoading(true);
    setError('');
    try {
      await apiService.deleteAvailability(bikeId, slotId);
      await fetchSlots();
    } catch (err) {
      setError(err.message || 'Failed to delete slot');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (slot) => {
    setEditingSlotId(slot.slot_id);
    setEditForm({
      startTime: formatTimeForInput(slot.startTime),
      endTime: formatTimeForInput(slot.endTime),
    });
  };

  const handleUpdate = async (e, slotId) => {
    e.preventDefault();
    if (!editForm.startTime || !editForm.endTime) {
      setError('Please fill all fields');
      return;
    }

    const slotDate = new Date(slots.find(s => s.slot_id === slotId).startTime).toISOString().split('T')[0];
    const start = new Date(`${slotDate}T${editForm.startTime}:00-03:00`);
    const end = new Date(`${slotDate}T${editForm.endTime}:00-03:00`);

    if (end <= start) {
      setError('End time must be after start time');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiService.updateAvailability({
        bike_id: bikeId,
        slot_id: slotId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      setEditingSlotId(null);
      setEditForm({ startTime: '', endTime: '' });
      await fetchSlots();
    } catch (err) {
      setError(err.message || 'Failed to update slot');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSlotId(null);
    setEditForm({ startTime: '', endTime: '' });
    setError('');
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
                {editingSlotId === slot.slot_id ? (
                  <form onSubmit={(e) => handleUpdate(e, slot.slot_id)} className="edit-slot-form">
                    <input
                      type="time"
                      value={editForm.startTime}
                      onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                      className="edit-input"
                      required
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={editForm.endTime}
                      onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                      className="edit-input"
                      required
                    />
                    <button type="submit" className="save-btn">Save</button>
                    <button type="button" onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                  </form>
                ) : (
                  <div className="slot-content">
                    <span>
                      {formatDateTime(slot.startTime)} - {formatDateTime(slot.endTime)} (ADT)
                    </span>
                    <div className="slot-actions">
                      <button
                        onClick={() => handleEdit(slot)}
                        className="edit-btn"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(slot.slot_id)}
                        className="delete-btn"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
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