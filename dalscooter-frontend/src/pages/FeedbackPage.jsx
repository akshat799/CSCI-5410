import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackList from '../components/FeedbackList';
import SentimentDashboard from '../components/SentimentDashboard';
import feedbackService from '../services/feedbackService';
import { MessageCircle, BarChart3, List, Plus, X } from 'lucide-react';
import '../styles/FeedbackPage.css';

const FeedbackPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState('');
  const [bikes, setBikes] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadAvailableBikes();
  }, [user]);

  const loadAvailableBikes = async () => {
    if (!user?.idToken) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/bikes`, {
        headers: {
          'Authorization': `Bearer ${user.idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBikes(data.bikes || []);
      }
    } catch (error) {
      console.error('Error loading bikes:', error);
    }
  };

  const handleFeedbackSuccess = (result) => {
    console.log('Feedback submitted successfully:', result);
    setShowFeedbackForm(false);
    setSelectedBikeId('');
    setRefreshKey(prev => prev + 1);
    
    alert(`Thank you for your feedback! 
Sentiment detected: ${result.sentiment_analysis?.sentiment}
Confidence: ${(result.sentiment_analysis?.confidence * 100).toFixed(1)}%`);
  };

  const tabs = [
    { id: 'list', label: 'All Feedback', icon: List },
    { id: 'analytics', label: 'Sentiment Analytics', icon: BarChart3 },
    { id: 'my-feedback', label: 'My Feedback', icon: MessageCircle, requiresAuth: true }
  ];

  const availableTabs = tabs.filter(tab => !tab.requiresAuth || user);

  return (
    <div className="feedback-container">
      {/* Header */}
      <div className="feedback-header">
        <div>
          <h1 className="header-title">Customer Feedback</h1>
          <p className="header-subtitle">
            View customer reviews and sentiment analysis for our bikes
          </p>
        </div>
        
        {user && (
          <div className="feedback-header-button">
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="submit-feedback-button"
            >
              <Plus size={20} />
              <span>Submit Feedback</span>
            </button>
          </div>
        )}
      </div>

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Submit Feedback</h2>
              <button
                onClick={() => setShowFeedbackForm(false)}
                className="modal-close-button"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Bike Selection */}
              {bikes.length > 0 && (
                <div className="form-group">
                  <label className="form-label">
                    Select Bike (Optional)
                  </label>
                  <select
                    value={selectedBikeId}
                    onChange={(e) => setSelectedBikeId(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Choose a bike...</option>
                    {bikes.map(bike => (
                      <option key={bike.bike_id} value={bike.bike_id}>
                        {bike.bike_id} - {bike.type} ({bike.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <FeedbackForm
                bikeId={selectedBikeId}
                onSuccess={handleFeedbackSuccess}
                onCancel={() => setShowFeedbackForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        <nav className="tabs-nav">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? 'tab-button-active' : ''}`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div key={refreshKey}>
        {activeTab === 'list' && (
          <div>
            <FeedbackList showStats={true} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <SentimentDashboard />
          </div>
        )}

        {activeTab === 'my-feedback' && user && (
          <div>
            <MyFeedback user={user} />
          </div>
        )}
      </div>

      {/* Guest Message */}
      {!user && (
        <div className="guest-message">
          <div className="guest-message-content">
            <MessageCircle className="guest-message-icon" />
            <div>
              <h3 className="guest-message-title">Want to share your experience?</h3>
              <p className="guest-message-text">
                Sign in to submit feedback and help other customers make informed decisions.
              </p>
              <a
                href="/login"
                className="guest-message-button"
              >
                Sign In to Submit Feedback
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MyFeedback = ({ user }) => {
  const [myFeedback, setMyFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMyFeedback();
  }, [user]);

  const loadMyFeedback = async () => {
    try {
      setLoading(true);
      const customerId = user.email || user.sub;
      const result = await feedbackService.getCustomerFeedback(customerId, user.idToken);
      setMyFeedback(result.feedback || []);
    } catch (err) {
      setError(err.message || 'Failed to load your feedback');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading your feedback...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-error">
        <p className="alert-error-text">{error}</p>
      </div>
    );
  }

  if (myFeedback.length === 0) {
    return (
      <div className="empty-container">
        <MessageCircle size={48} className="empty-icon" />
        <h3 className="empty-title">No feedback yet</h3>
        <p className="empty-text">You haven't submitted any feedback yet.</p>
      </div>
    );
  }

  return (
    <div className="my-feedback-container">
      <div className="my-feedback-card">
        <h3 className="my-feedback-title">
          Your Feedback ({myFeedback.length} reviews)
        </h3>
        
        <div className="feedback-list">
          {myFeedback.map((feedback) => (
            <div key={feedback.feedback_id} className="feedback-item">
              <div className="feedback-item-header">
                <div className="feedback-item-info">
                  <span className="feedback-bike-id">Bike: {feedback.bike_id}</span>
                  <span className="feedback-rating">
                    {'★'.repeat(feedback.rating)}
                    {'☆'.repeat(5 - feedback.rating)}
                  </span>
                </div>
                <span className={`feedback-sentiment ${feedback.sentiment.toLowerCase()}`}>
                  {feedback.sentiment}
                </span>
              </div>
              
              <p className="feedback-comment">{feedback.comment}</p>
              
              <div className="feedback-meta">
                <span>
                  Submitted: {new Date(feedback.created_at).toLocaleDateString()}
                </span>
                <span>
                  Confidence: {((feedback.confidence || feedback.sentiment_score) * 100).toFixed(1)}%
                </span>
              </div>

              {feedback.key_phrases && feedback.key_phrases.length > 0 && (
                <div className="feedback-key-phrases">
                  <div className="key-phrases-list">
                    {feedback.key_phrases.slice(0, 3).map((phrase, idx) => (
                      <span key={idx} className="key-phrase">
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;