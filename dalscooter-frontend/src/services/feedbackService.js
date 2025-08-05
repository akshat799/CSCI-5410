const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class FeedbackService {
  async submitFeedback(feedbackData, authToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(feedbackData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit feedback');
      }

      return data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  async getAllFeedback(queryParams = {}) {
    try {
      const params = new URLSearchParams(queryParams);
      const url = `${API_BASE_URL}/feedback${params.toString() ? `?${params}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch feedback');
      }

      return data;
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  }

  // Get feedback for specific bike (public access)
  async getBikeFeedback(bikeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/${bikeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch bike feedback');
      }

      return data;
    } catch (error) {
      console.error('Error fetching bike feedback:', error);
      throw error;
    }
  }

  // Get customer's own feedback (requires authentication)
  async getCustomerFeedback(customerId, authToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback?customer_id=${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customer feedback');
      }

      return data;
    } catch (error) {
      console.error('Error fetching customer feedback:', error);
      throw error;
    }
  }
}

export default new FeedbackService();