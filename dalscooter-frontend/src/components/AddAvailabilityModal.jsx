import React, { useState } from 'react';
import Modal from 'react-modal';
import { getAuthHeaders } from '../services/apiService';
import '../styles/AddAvailabilityModal.css'; // Keep this for your custom styles

const API_URL = import.meta.env.VITE_API_URL;

function AddAvailabilityModal({ bikeId, onClose, onSuccess }) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  now.setMinutes(0);
  const startDefault = now.toISOString().split('T')[1].slice(0, 5);
  now.setHours(now.getHours() + 1);
  const endDefault = now.toISOString().split('T')[1].slice(0, 5);

  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState(startDefault);
  const [endTime, setEndTime] = useState(endDefault);
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
            scooterId: bikeId,
            date,
            slots: [{ startTime, endTime }],
        }),
        });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Add availability failed');
      setMsg('Availability added successfully');
      onSuccess();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onRequestClose={onClose}
      contentLabel="Add Availability"
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      <h2>Add Availability</h2>
      {msg && <p className="modal-message">{msg}</p>}
      <form onSubmit={handleSubmit} className="modal-form">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="close-btn">Close</button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Adding...' : 'Add Slot'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddAvailabilityModal;
