import React, { useState, useEffect } from 'react';
import feedbackService from '../services/feedbackService';
import { Star, MessageCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import '../styles/FeedbackList.css';

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
        return <TrendingUp className="sentiment-icon positive" />;
      case 'NEGATIVE':
        return <TrendingDown className="sentiment-icon negative" />;
      case 'NEUTRAL':
        return <Minus className="sentiment-icon neutral" />;
      case 'MIXED':
        return <MessageCircle className="sentiment-icon mixed" />;
      default:
        return <Minus className="sentiment-icon neutral" />;
    }
  };

  const getSentimentClass = (sentiment) => {
    switch (sentiment?.toUpperCase()) {
      case 'POSITIVE':
        return 'sentiment-positive';
      case 'NEGATIVE':
        return 'sentiment-negative';
      case 'NEUTRAL':
        return 'sentiment-neutral';
      case 'MIXED':
        return 'sentiment-mixed';
      default:
        return 'sentiment-neutral';
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="rating-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'star-active' : 'star-inactive'}
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading feedback...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-error">
        <p className="alert-error-text">{error}</p>
        <button
          onClick={loadFeedback}
          className="alert-error-retry"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="feedback-list-container">
      {showStats && statistics && (
        <div className="stats-card">
          <h3 className="stats-title">Feedback Statistics</h3>
          
          <div className="stats-grid">
            <div className="stats-item">
              <div className="stats-value">{statistics.average_rating.toFixed(1)}</div>
              <div className="stats-label">Average Rating</div>
              <div className="stats-rating">{renderStars(Math.round(statistics.average_rating))}</div>
            </div>
            
            <div className="stats-item">
              <div className="stats-value">{statistics.total_feedback}</div>
              <div className="stats-label">Total Reviews</div>
            </div>
            
            <div className="stats-item">
              <div className="stats-value">{statistics.sentiment_breakdown.POSITIVE}</div>
              <div className="stats-label">Positive</div>
            </div>
            
            <div className="stats-item">
              <div className="stats-value">{statistics.sentiment_breakdown.NEGATIVE}</div>
              <div className="stats-label">Negative</div>
            </div>
          </div>

          <div className="rating-distribution">
            <h4 className="rating-distribution-title">Rating Distribution</h4>
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="rating-distribution-item">
                <span className="rating-label">{rating}★</span>
                <div className="rating-bar-container">
                  <div
                    className="rating-bar"
                    style={{
                      width: `${statistics.total_feedback > 0 
                        ? (statistics.rating_breakdown[rating] / statistics.total_feedback) * 100 
                        : 0}%`
                    }}
                  ></div>
                </div>
                <span className="rating-count">{statistics.rating_breakdown[rating]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="feedback-card">
        <div className="feedback-card-header">
          <h3 className="feedback-card-title">
            {bikeId ? `Feedback for Bike ${bikeId}` : 'All Feedback'}
            <span className="feedback-count">({feedback.length} reviews)</span>
          </h3>
        </div>

        {feedback.length === 0 ? (
          <div className="empty-container">
            <MessageCircle size={48} className="empty-icon" />
            <p className="empty-text">No feedback available yet.</p>
            <p className="empty-subtext">Be the first to leave a review!</p>
          </div>
        ) : (
          <div className="feedback-list">
            {feedback.map((item) => (
              <div key={item.feedback_id} className="feedback-item">
                <div className="feedback-item-header">
                  <div className="feedback-item-info">
                    <div className="feedback-rating">
                      {renderStars(item.rating)}
                      <span className="rating-value">{item.rating}/5</span>
                    </div>
                    <div className={`feedback-sentiment ${getSentimentClass(item.sentiment)}`}>
                      {getSentimentIcon(item.sentiment)}
                      <span>{item.sentiment}</span>
                    </div>
                  </div>
                  <div className="feedback-date">
                    {formatDate(item.created_at)}
                  </div>
                </div>

                <div className="feedback-comment">
                  <p>{item.comment}</p>
                </div>

                <div className="feedback-meta">
                  <div>
                    {!bikeId && (
                      <span>Bike: <span className="bike-id">{item.bike_id}</span></span>
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