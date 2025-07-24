// src/components/FeedbackList.jsx
import React, { useState, useEffect } from 'react';
import feedbackService from '../services/feedbackService';
import { Star, MessageCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const FeedbackList = ({ bikeId, showStats = true }) => {
  const [feedback, setFeedback] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFeedback();
  }, [bikeId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError('');

      let result;
      if (bikeId) {
        result = await feedbackService.getBikeFeedback(bikeId);
      } else {
        result = await feedbackService.getAllFeedback({ limit: 50 });
      }

      setFeedback(result.feedback || []);
      if (showStats && result.statistics) {
        setStatistics(result.statistics);
      }
    } catch (err) {
      setError(err.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toUpperCase()) {
      case 'POSITIVE':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'NEGATIVE':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'NEUTRAL':
        return <Minus className="w-4 h-4 text-gray-500" />;
      case 'MIXED':
        return <MessageCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toUpperCase()) {
      case 'POSITIVE':
        return 'text-green-600 bg-green-50';
      case 'NEGATIVE':
        return 'text-red-600 bg-red-50';
      case 'NEUTRAL':
        return 'text-gray-600 bg-gray-50';
      case 'MIXED':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading feedback...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadFeedback}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Section */}
      {showStats && statistics && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Feedback Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.average_rating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
              <div className="mt-1">{renderStars(Math.round(statistics.average_rating))}</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {statistics.total_feedback}
              </div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {statistics.sentiment_breakdown.POSITIVE}
              </div>
              <div className="text-sm text-gray-600">Positive</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {statistics.sentiment_breakdown.NEGATIVE}
              </div>
              <div className="text-sm text-gray-600">Negative</div>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Rating Distribution</h4>
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <span className="text-sm w-8">{rating}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${statistics.total_feedback > 0 
                        ? (statistics.rating_breakdown[rating] / statistics.total_feedback) * 100 
                        : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8">
                  {statistics.rating_breakdown[rating]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            {bikeId ? `Feedback for Bike ${bikeId}` : 'All Feedback'}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({feedback.length} reviews)
            </span>
          </h3>
        </div>

        {feedback.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No feedback available yet.</p>
            <p className="text-sm">Be the first to leave a review!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {feedback.map((item) => (
              <div key={item.feedback_id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {renderStars(item.rating)}
                      <span className="text-sm font-medium">{item.rating}/5</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 ${getSentimentColor(item.sentiment)}`}>
                      {getSentimentIcon(item.sentiment)}
                      <span>{item.sentiment}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(item.created_at)}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-gray-700 leading-relaxed">{item.comment}</p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div>
                    {!bikeId && (
                      <span>Bike: <span className="font-medium">{item.bike_id}</span></span>
                    )}
                  </div>
                  <div>
                    Customer: {item.customer_email ? item.customer_email.split('@')[0] : 'Anonymous'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackList;