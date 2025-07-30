import React, { useState, useEffect } from 'react';
import feedbackService from '../services/feedbackService';
import { TrendingUp, TrendingDown, Minus, MessageCircle, BarChart3, PieChart, Tag, User } from 'lucide-react';
import '../styles/SentimentDashboard.css';

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
      const sentiment = item.sentiment || 'NEUTRAL';
      sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;

      const confidence = parseFloat(item.confidence || item.sentiment_score || 0);
      confidenceScores.push(confidence);
      totalConfidence += confidence;

      if (item.analysis_method === 'fallback') {
        fallbackCount++;
      } else {
        comprehendCount++;
      }

      if (item.key_phrases && Array.isArray(item.key_phrases)) {
        item.key_phrases.forEach(phrase => {
          keyPhrases[phrase] = (keyPhrases[phrase] || 0) + 1;
        });
      }

      if (item.entities && Array.isArray(item.entities)) {
        item.entities.forEach(entity => {
          const key = `${entity.text} (${entity.type})`;
          entities[key] = (entities[key] || 0) + 1;
        });
      }
    });

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
        return <TrendingUp className="sentiment-icon" />;
      case 'NEGATIVE':
        return <TrendingDown className="sentiment-icon" />;
      case 'NEUTRAL':
        return <Minus className="sentiment-icon" />;
      case 'MIXED':
        return <MessageCircle className="sentiment-icon" />;
      default:
        return <Minus className="sentiment-icon" />;
    }
  };

  const getSentimentColor = (sentiment) => {
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

  const filteredFeedback = selectedSentiment === 'ALL' 
    ? feedback 
    : feedback.filter(item => item.sentiment === selectedSentiment);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading sentiment analysis...</span>
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

  const metrics = calculateSentimentMetrics();

  if (!metrics || feedback.length === 0) {
    return (
      <div className="empty-container">
        <BarChart3 size={48} className="empty-icon" />
        <p className="empty-text">No sentiment data available</p>
      </div>
    );
  }

  return (
    <div className="sentiment-dashboard">
      {/* Sentiment Overview Cards */}
      <div className="sentiment-grid">
        {Object.entries(metrics.sentimentCounts).map(([sentiment, count]) => (
          <div
            key={sentiment}
            className={`sentiment-card ${selectedSentiment === sentiment ? 'sentiment-card-active' : ''}`}
            onClick={() => setSelectedSentiment(selectedSentiment === sentiment ? 'ALL' : sentiment)}
          >
            <div className="sentiment-card-content">
              <div className={`sentiment-icon-container ${getSentimentColor(sentiment)}`}>
                {getSentimentIcon(sentiment)}
              </div>
              <div className="sentiment-details">
                <div className="sentiment-count">{count}</div>
                <div className="sentiment-label">{sentiment}</div>
                <div className="sentiment-percentage">
                  {((count / feedback.length) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Method Breakdown */}
      <div className="analysis-card">
        <h3 className="analysis-title">
          <PieChart className="analysis-icon" />
          Analysis Method Breakdown
        </h3>
        <div className="analysis-grid">
          <div className="analysis-item">
            <div className="analysis-value">{metrics.analysisMethodBreakdown.comprehend}</div>
            <div className="analysis-label">Amazon Comprehend</div>
          </div>
          <div className="analysis-item">
            <div className="analysis-value">{metrics.analysisMethodBreakdown.fallback}</div>
            <div className="analysis-label">Fallback Analysis</div>
          </div>
          <div className="analysis-item">
            <div className="analysis-value">{metrics.averageConfidence.toFixed(2)}</div>
            <div className="analysis-label">Avg Confidence</div>
          </div>
        </div>
      </div>

      {/* Top Key Phrases */}
      {metrics.topKeyPhrases.length > 0 && (
        <div className="key-phrases-card">
          <h3 className="key-phrases-title">
            <Tag className="key-phrases-icon" />
            Most Mentioned Key Phrases
          </h3>
          <div className="key-phrases-list">
            {metrics.topKeyPhrases.map(([phrase, count]) => (
              <div key={phrase} className="key-phrase-item">
                <span className="key-phrase-text">{phrase}</span>
                <div className="key-phrase-meta">
                  <div className="key-phrase-bar-container">
                    <div
                      className="key-phrase-bar"
                      style={{ 
                        width: `${(count / Math.max(...metrics.topKeyPhrases.map(([,c]) => c))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="key-phrase-count">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Entities */}
      {metrics.topEntities.length > 0 && (
        <div className="entities-card">
          <h3 className="entities-title">
            <User className="entities-icon" />
            Detected Entities
          </h3>
          <div className="entities-list">
            {metrics.topEntities.map(([entity, count]) => (
              <div key={entity} className="entity-item">
                <span className="entity-text">{entity}</span>
                <div className="entity-meta">
                  <div className="entity-bar-container">
                    <div
                      className="entity-bar"
                      style={{ 
                        width: `${(count / Math.max(...metrics.topEntities.map(([,c]) => c))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="entity-count">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Feedback List */}
      <div className="feedback-list-card">
        <div className="feedback-list-header">
          <h3 className="feedback-list-title">
            Detailed Sentiment Analysis
            {selectedSentiment !== 'ALL' && (
              <span className="feedback-list-filter">
                (Filtered by {selectedSentiment})
              </span>
            )}
          </h3>
          <button
            onClick={() => setSelectedSentiment('ALL')}
            className="feedback-list-view-all"
          >
            View All ({feedback.length})
          </button>
        </div>

        <div className="feedback-list-content">
          {filteredFeedback.map((item) => (
            <div key={item.feedback_id} className="feedback-item">
              <div className="feedback-item-header">
                <div className="feedback-item-info">
                  <div className={`feedback-sentiment-icon ${getSentimentColor(item.sentiment)}`}>
                    {getSentimentIcon(item.sentiment)}
                  </div>
                  <div>
                    <div className="feedback-sentiment">{item.sentiment}</div>
                    <div className="feedback-confidence">
                      Confidence: {(parseFloat(item.confidence || item.sentiment_score || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="feedback-analysis-method">
                  {item.analysis_method === 'fallback' ? 'Fallback' : 'Comprehend'}
                </div>
              </div>
              
              <p className="feedback-comment">{item.comment}</p>
              
              {item.key_phrases && item.key_phrases.length > 0 && (
                <div className="feedback-key-phrases">
                  {item.key_phrases.slice(0, 3).map((phrase, idx) => (
                    <span key={idx} className="key-phrase">
                      {phrase}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="feedback-meta">
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