// import React, { useEffect, useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { getAuthHeaders } from '../services/apiService';
// import BookingModal from '../components/BookingModal';

// const API_URL = import.meta.env.VITE_API_BASE_URL;

// function AvailableSlotsPage() {
//   const { user } = useAuth();
//   const [slots, setSlots] = useState([]);
//   const [selectedSlot, setSelectedSlot] = useState(null);
//   const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     console.log('Fetching availability for date:', filterDate);
//     fetchSlots();
//   }, [filterDate]);

//   const fetchSlots = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch(`${API_URL}/booking/get?date=${filterDate}`, {
//         headers: getAuthHeaders(),
//       });
//       const data = await res.json();
//       console.log('Fetched slots:', data);
//       setSlots(data.slots || []);
//     } catch (err) {
//       console.error('Error fetching slots:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-5xl mx-auto bg-white rounded shadow">
//       <h1 className="text-2xl font-bold mb-4 text-dalscooter-green">Available Slots</h1>

//       <div className="mb-4">
//         <label className="block text-sm font-medium mb-1">Filter by Date:</label>
//         <input
//           type="date"
//           value={filterDate}
//           onChange={(e) => setFilterDate(e.target.value)}
//           className="p-2 border rounded w-full max-w-xs"
//         />
//       </div>

//       {loading && <p>Loading slots...</p>}

//       {!loading && slots.length === 0 && (
//         <p className="text-dalscooter-gray">No slots available for this date.</p>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
//         {slots.map((scooter, index) => (
//           <div key={index} className="border rounded p-4 shadow">
//             <h2 className="font-semibold text-lg mb-2">Scooter ID: {scooter.scooterId}</h2>
//             <p className="text-sm text-gray-600 mb-2">Date: {scooter.date}</p>
//             {scooter.slots?.length > 0 ? (
//               <ul className="space-y-2">
//                 {scooter.slots.map((slot, i) => (
//                   <li key={i} className="flex justify-between items-center border-t pt-2">
//                     <span>{slot.startTime} - {slot.endTime}</span>
//                     <button
//                       onClick={() => setSelectedSlot({ ...slot, scooterId: scooter.scooterId, date: scooter.date })}
//                       className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
//                     >
//                       Book
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-sm text-dalscooter-gray">No time slots</p>
//             )}
//           </div>
//         ))}
//       </div>

//       {selectedSlot && (
//         <BookingModal
//           slot={selectedSlot}
//           onClose={() => setSelectedSlot(null)}
//           onBooked={() => {
//             setSelectedSlot(null);
//             fetchSlots();
//           }}
//         />
//       )}
//     </div>
//   );
// }

// export default AvailableSlotsPage;
