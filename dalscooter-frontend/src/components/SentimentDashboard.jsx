// src/components/SentimentDashboard.jsx
import React, { useState, useEffect } from 'react';
import feedbackService from '../services/feedbackService';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MessageCircle, 
  BarChart3, 
  PieChart,
  Tag,
  User
} from 'lucide-react';

const SentimentDashboard = ({ bikeId }) => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('ALL');

  useEffect(() => {
    loadFeedbackData();
  }, [bikeId]);

  const loadFeedbackData = async () => {
    try {
      setLoading(true);
      setError('');

      let result;
      if (bikeId) {
        result = await feedbackService.getBikeFeedback(bikeId);
      } else {
        result = await feedbackService.getAllFeedback({ limit: 100 });
      }

      setFeedback(result.feedback || []);
    } catch (err) {
      setError(err.message || 'Failed to load sentiment data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate advanced sentiment metrics
  const calculateSentimentMetrics = () => {
    if (!feedback.length) return null;

    const sentimentCounts = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0, MIXED: 0 };
    const confidenceScores = [];
    const keyPhrases = {};
    const entities = {};
    let totalConfidence = 0;
    let comprehendCount = 0;
    let fallbackCount = 0;

    feedback.forEach(item => {
      // Count sentiments
      const sentiment = item.sentiment || 'NEUTRAL';
      sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;

      // Track confidence scores
      const confidence = parseFloat(item.confidence || item.sentiment_score || 0);
      confidenceScores.push(confidence);
      totalConfidence += confidence;

      // Count analysis methods
      if (item.analysis_method === 'fallback') {
        fallbackCount++;
      } else {
        comprehendCount++;
      }

      // Aggregate key phrases
      if (item.key_phrases && Array.isArray(item.key_phrases)) {
        item.key_phrases.forEach(phrase => {
          keyPhrases[phrase] = (keyPhrases[phrase] || 0) + 1;
        });
      }

      // Aggregate entities
      if (item.entities && Array.isArray(item.entities)) {
        item.entities.forEach(entity => {
          const key = `${entity.text} (${entity.type})`;
          entities[key] = (entities[key] || 0) + 1;
        });
      }
    });

    // Sort key phrases and entities by frequency
    const topKeyPhrases = Object.entries(keyPhrases)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const topEntities = Object.entries(entities)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      sentimentCounts,
      averageConfidence: totalConfidence / feedback.length,
      topKeyPhrases,
      topEntities,
      analysisMethodBreakdown: {
        comprehend: comprehendCount,
        fallback: fallbackCount
      },
      confidenceScores
    };
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toUpperCase()) {
      case 'POSITIVE':
        return <TrendingUp className="w-5 h-5" />;
      case 'NEGATIVE':
        return <TrendingDown className="w-5 h-5" />;
      case 'NEUTRAL':
        return <Minus className="w-5 h-5" />;
      case 'MIXED':
        return <MessageCircle className="w-5 h-5" />;
      default:
        return <Minus className="w-5 h-5" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toUpperCase()) {
      case 'POSITIVE':
        return 'bg-green-500';
      case 'NEGATIVE':
        return 'bg-red-500';
      case 'NEUTRAL':
        return 'bg-gray-500';
      case 'MIXED':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredFeedback = selectedSentiment === 'ALL' 
    ? feedback 
    : feedback.filter(item => item.sentiment === selectedSentiment);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading sentiment analysis...</span>
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

  const metrics = calculateSentimentMetrics();

  if (!metrics || feedback.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">No sentiment data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sentiment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(metrics.sentimentCounts).map(([sentiment, count]) => (
          <div
            key={sentiment}
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
              selectedSentiment === sentiment ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedSentiment(selectedSentiment === sentiment ? 'ALL' : sentiment)}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-full text-white ${getSentimentColor(sentiment)}`}>
                {getSentimentIcon(sentiment)}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-600">{sentiment}</div>
                <div className="text-xs text-gray-500">
                  {((count / feedback.length) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Method Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <PieChart className="w-5 h-5 mr-2" />
          Analysis Method Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.analysisMethodBreakdown.comprehend}
            </div>
            <div className="text-sm text-gray-600">Amazon Comprehend</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {metrics.analysisMethodBreakdown.fallback}
            </div>
            <div className="text-sm text-gray-600">Fallback Analysis</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {metrics.averageConfidence.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </div>
        </div>
      </div>

      {/* Top Key Phrases */}
      {metrics.topKeyPhrases.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Tag className="w-5 h-5 mr-2" />
            Most Mentioned Key Phrases
          </h3>
          <div className="space-y-2">
            {metrics.topKeyPhrases.map(([phrase, count]) => (
              <div key={phrase} className="flex items-center justify-between">
                <span className="text-gray-700">{phrase}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${(count / Math.max(...metrics.topKeyPhrases.map(([,c]) => c))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Entities */}
      {metrics.topEntities.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Detected Entities
          </h3>
          <div className="space-y-2">
            {metrics.topEntities.map(([entity, count]) => (
              <div key={entity} className="flex items-center justify-between">
                <span className="text-gray-700">{entity}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ 
                        width: `${(count / Math.max(...metrics.topEntities.map(([,c]) => c))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Feedback List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Detailed Sentiment Analysis
            {selectedSentiment !== 'ALL' && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                (Filtered by {selectedSentiment})
              </span>
            )}
          </h3>
          <button
            onClick={() => setSelectedSentiment('ALL')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All ({feedback.length})
          </button>
        </div>

        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {filteredFeedback.map((item) => (
            <div key={item.feedback_id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full text-white ${getSentimentColor(item.sentiment)}`}>
                    {getSentimentIcon(item.sentiment)}
                  </div>
                  <div>
                    <div className="font-medium">{item.sentiment}</div>
                    <div className="text-sm text-gray-500">
                      Confidence: {(parseFloat(item.confidence || item.sentiment_score || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {item.analysis_method === 'fallback' ? 'Fallback' : 'Comprehend'}
                </div>
              </div>
              
              <p className="text-gray-700 text-sm mb-2">{item.comment}</p>
              
              {item.key_phrases && item.key_phrases.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.key_phrases.slice(0, 3).map((phrase, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {phrase}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Bike: {item.bike_id}</span>
                <span>Rating: {item.rating}/5</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SentimentDashboard;