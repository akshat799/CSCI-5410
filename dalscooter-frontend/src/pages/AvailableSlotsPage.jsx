import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/booking/get`;

const AvailableSlotsPage = () => {
  const [slots, setSlots] = useState([]);
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedScooter, setSelectedScooter] = useState('all');

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await axios.get(API_URL);
      const allSlots = response.data || [];

      const flattened = allSlots.flatMap(item =>
        item.slots.map(slot => ({
          scooterId: item.scooterId,
          date: item.date,
          ...slot
        }))
      );

      setSlots(flattened);
      setFilteredSlots(flattened);
    } catch (err) {
      console.error('Error fetching availability:', err);
    }
  };

  const handleFilter = () => {
    let result = [...slots];

    if (selectedDate) {
      result = result.filter(slot => slot.date === selectedDate);
    }

    if (selectedScooter !== 'all') {
      result = result.filter(slot => slot.scooterId === selectedScooter);
    }

    setFilteredSlots(result);
  };

  const uniqueScooters = [...new Set(slots.map(slot => slot.scooterId))];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Available Slots</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={selectedScooter}
          onChange={e => setSelectedScooter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Scooters</option>
          {uniqueScooters.map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>

        <button
          onClick={handleFilter}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Filter
        </button>
      </div>

      {filteredSlots.length === 0 ? (
        <p>No available slots found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSlots.map((slot, index) => (
            <div key={index} className="border p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-2">Scooter: {slot.scooterId}</h2>
              <p><strong>Date:</strong> {slot.date}</p>
              <p><strong>Start:</strong> {slot.startTime}</p>
              <p><strong>End:</strong> {slot.endTime}</p>
              <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Book Slot
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableSlotsPage;
