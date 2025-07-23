// src/pages/FeedbackPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackList from '../components/FeedbackList';
import SentimentDashboard from '../components/SentimentDashboard';
import feedbackService from '../services/feedbackService';
import { MessageCircle, BarChart3, List, Plus, X } from 'lucide-react';

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
      // Call bike management API to get available bikes
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
    setRefreshKey(prev => prev + 1); // Force refresh of feedback list
    
    // Show success message
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Feedback</h1>
          <p className="text-gray-600">
            View customer reviews and sentiment analysis for our bikes
          </p>
        </div>
        
        {user && (
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Submit Feedback</span>
            </button>
          </div>
        )}
      </div>

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Submit Feedback</h2>
              <button
                onClick={() => setShowFeedbackForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4">
              {/* Bike Selection */}
              {bikes.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Bike (Optional)
                  </label>
                  <select
                    value={selectedBikeId}
                    onChange={(e) => setSelectedBikeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
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
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <MessageCircle className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-blue-900">Want to share your experience?</h3>
              <p className="text-blue-700 mt-1">
                Sign in to submit feedback and help other customers make informed decisions.
              </p>
              <a
                href="/login"
                className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
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

// Component to show user's own feedback
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
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading your feedback...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (myFeedback.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h3>
        <p className="text-gray-600">You haven't submitted any feedback yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          Your Feedback ({myFeedback.length} reviews)
        </h3>
        
        <div className="space-y-4">
          {myFeedback.map((feedback) => (
            <div key={feedback.feedback_id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Bike: {feedback.bike_id}</span>
                  <span className="text-yellow-500">
                    {'★'.repeat(feedback.rating)}
                    {'☆'.repeat(5 - feedback.rating)}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  feedback.sentiment === 'POSITIVE' ? 'bg-green-100 text-green-800' :
                  feedback.sentiment === 'NEGATIVE' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {feedback.sentiment}
                </span>
              </div>
              
              <p className="text-gray-700 mb-3">{feedback.comment}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Submitted: {new Date(feedback.created_at).toLocaleDateString()}
                </span>
                <span>
                  Confidence: {((feedback.confidence || feedback.sentiment_score) * 100).toFixed(1)}%
                </span>
              </div>

              {feedback.key_phrases && feedback.key_phrases.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {feedback.key_phrases.slice(0, 3).map((phrase, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
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