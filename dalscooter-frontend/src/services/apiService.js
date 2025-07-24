const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getAuthHeaders = () => {
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  
  // Try different token sources for compatibility
  let token = null;
  
  if (user?.idToken) {
    token = user.idToken;
  } else if (user?.session?.idToken) {
    token = user.session.idToken;
  } else if (user?.session?.getIdToken) {
    try {
      token = user.session.getIdToken().getJwtToken();
    } catch (error) {
      console.error('Error getting ID token from session:', error);
    }
  }
  
  console.log('Using token for API calls:', token ? 'Token found' : 'No token found');
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const apiService = {
  // Get public bikes (no authentication required)
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

  // Get all bikes (requires authentication - for franchise owners)
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
  }
};