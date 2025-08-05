const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BOOKING_API_URL = import.meta.env.VITE_API_URL;

export const getAuthHeaders = () => {
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  console.log("User from localStorage:", user);

  let token = null;

  try {
    if (user?.idToken) {
      token = user.idToken;
    }
  } catch (error) {
    console.error("Error extracting ID token:", error);
  }

  console.log('Using token for API calls:', token ? 'Token found' : 'No token found');

  return token
    ? {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    : { 'Content-Type': 'application/json' };
};

export const apiService = {
  getPublicBikes: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/public-bikes${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch public bikes: ${response.status}`);
    }
    
    return response.json();
  },

  getBikes: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/bikes${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch bikes: ${response.status}`);
    }
    
    return response.json();
  },

  // Create a new bike (requires authentication)
  createBike: async (bikeData) => {
    const response = await fetch(`${API_BASE_URL}/bikes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bikeData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to create bike: ${response.status}`);
    }
    
    return response.json();
  },

  // Update a bike (requires authentication)
  updateBike: async (bikeId, updateData) => {
    const response = await fetch(`${API_BASE_URL}/bikes/${bikeId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update bike: ${response.status}`);
    }
    
    return response.json();
  },

  // Delete a bike (requires authentication)
  deleteBike: async (bikeId) => {
    const response = await fetch(`${API_BASE_URL}/bikes/${bikeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete bike: ${response.status}`);
    }
    
    return response.json();
  },


  //Booking APIs
  // Add availability
  addAvailability: async (bikeId, slots) => {
    const response = await fetch(`${BOOKING_API_URL}/availability`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        bike_id: bikeId,
        slots
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Add availability failed: ${response.status}`);
    return data;
  },

  // Get availability
  getAvailability: async (bikeId) => {
    const query = new URLSearchParams({ bike_id: bikeId }).toString();
    const response = await fetch(`${BOOKING_API_URL}/availability?${query}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Get availability failed: ${response.status}`);
    return data;
  },

  // Delete availability slot
  deleteAvailability: async (bikeId, slotId) => {
    const response = await fetch(`${BOOKING_API_URL}/availability`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action: 'remove',
        bike_id: bikeId,
        slot_id: slotId
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Delete availability failed: ${response.status}`);
    return data;
  },

  // Update availability slot
  updateAvailability: async (slotData) => {
    const response = await fetch(`${BOOKING_API_URL}/availability`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action: 'update',
        bike_id: slotData.bike_id,
        slot_id: slotData.slot_id,
        slot: {
          startTime: slotData.startTime,
          endTime: slotData.endTime
        }
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Update availability failed: ${response.status}`);
    return data;
  },

  // Book a slot
  bookSlot: async (bookingData) => {
    const response = await fetch(`${BOOKING_API_URL}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Booking failed: ${response.status}`);
    return data;
  },

  // Cancel a booking
  cancelBooking: async (bookingReference) => {
    const response = await fetch(`${BOOKING_API_URL}/bookings?booking_reference=${bookingReference}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Cancel failed: ${response.status}`);
    return data;
  },

  // Get bookings
  getBookings: async () => {
    const response = await fetch(`${BOOKING_API_URL}/bookings`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Get bookings failed: ${response.status}`);
    return data;
  }
};