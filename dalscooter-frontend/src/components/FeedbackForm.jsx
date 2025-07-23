// src/components/FeedbackForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import feedbackService from '../services/feedbackService';
import { Star } from 'lucide-react';

const FeedbackForm = ({ bikeId, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    bike_id: bikeId || '',
    rating: 0,
    comment: ''
  });

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.bike_id) {
        throw new Error('Bike ID is required');
      }
      if (formData.rating < 1 || formData.rating > 5) {
        throw new Error('Please select a rating between 1 and 5 stars');
      }
      if (formData.comment.trim().length < 10) {
        throw new Error('Comment must be at least 10 characters long');
      }

      // Submit feedback
      const result = await feedbackService.submitFeedback(
        formData,
        user?.idToken
      );

      if (onSuccess) {
        onSuccess(result);
      }

      // Reset form
      setFormData({
        bike_id: bikeId || '',
        rating: 0,
        comment: ''
      });

    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please log in to submit feedback.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Submit Feedback</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bike ID Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bike ID
          </label>
          <input
            type="text"
            value={formData.bike_id}
            onChange={(e) => setFormData(prev => ({ ...prev, bike_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter bike ID"
            required
            disabled={!!bikeId} // Disable if bikeId is provided as prop
          />
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingClick(star)}
                className="focus:outline-none"
              >
                <Star
                  size={24}
                  className={`${
                    star <= formData.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {formData.rating > 0 ? `${formData.rating} star${formData.rating !== 1 ? 's' : ''}` : 'Click to rate'}
          </p>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comment
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="Share your experience with this bike..."
            required
            minLength="10"
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.comment.length}/500 characters (minimum 10)
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;