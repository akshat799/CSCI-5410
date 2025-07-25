import React, { useState } from 'react';
import Modal from 'react-modal';
import { apiService } from '../services/apiService';
import '../styles/AddAvailabilityModal.css';

Modal.setAppElement('#root');

function AddAvailabilityModal({ bikeId, onClose, onSuccess }) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState([{ startTime: '09:00', endTime: '10:00' }]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const addSlot = () => {
    setSlots([...slots, { startTime: '', endTime: '' }]);
  };

  const removeSlot = (index) => {
    if (slots.length > 1) {
      setSlots(slots.filter((_, i) => i !== index));
    }
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setSlots(newSlots);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || slots.some(slot => !slot.startTime || !slot.endTime)) {
      setMsg('Please fill all fields');
      return;
    }

    // Validate slots
    for (const slot of slots) {
      const start = new Date(`${date}T${slot.startTime}:00-03:00`);
      const end = new Date(`${date}T${slot.endTime}:00-03:00`);
      if (end <= start) {
        setMsg('End time must be after start time for all slots');
        return;
      }
    }

    // Check for overlapping slots
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const startA = new Date(`${date}T${slots[i].startTime}:00-03:00`);
        const endA = new Date(`${date}T${slots[i].endTime}:00-03:00`);
        const startB = new Date(`${date}T${slots[j].startTime}:00-03:00`);
        const endB = new Date(`${date}T${slots[j].endTime}:00-03:00`);
        if (startA < endB && startB < endA) {
          setMsg('Slots cannot overlap');
          return;
        }
      }
    }

    setLoading(true);
    setMsg('');
    try {
      const formattedSlots = slots.map(slot => ({
        startTime: new Date(`${date}T${slot.startTime}:00-03:00`).toISOString(),
        endTime: new Date(`${date}T${slot.endTime}:00-03:00`).toISOString(),
      }));
      const result = await apiService.addAvailability(bikeId, formattedSlots);
      setMsg(result.message || 'Availability added successfully');
      onSuccess();
    } catch (err) {
      setMsg(err.message || 'Failed to add availability');
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
      <h2>Add Availability for Bike ID: {bikeId}</h2>
      {msg && <p className="modal-message">{msg}</p>}
      <form onSubmit={handleSubmit} className="modal-form">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
            min={today}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Slots (ADT)</label>
          <p className="text-xs text-gray-500 mb-2">Enter times in Atlantic Daylight Time (e.g., 11:00 is 11:00 AM ADT).</p>
          {slots.map((slot, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
              {slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(index)}
                  className="px-2 py-1 bg-red-500 text-white rounded-lg"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addSlot}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Add Another Slot
          </button>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="close-btn">
            Close
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Adding...' : 'Add Slots'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddAvailabilityModal;