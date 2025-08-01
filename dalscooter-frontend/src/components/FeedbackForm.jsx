import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import feedbackService from "../services/feedbackService";
import { Star } from "lucide-react";
import "../styles/FeedbackForm.css";

const FeedbackForm = ({ bikeId, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    bike_id: bikeId || "",
    rating: 0,
    comment: "",
  });

  const handleRatingClick = (rating) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.bike_id) {
        throw new Error("Bike ID is required");
      }
      if (formData.rating < 1 || formData.rating > 5) {
        throw new Error("Please select a rating between 1 and 5 stars");
      }
      if (formData.comment.trim().length < 10) {
        throw new Error("Comment must be at least 10 characters long");
      }

      const result = await feedbackService.submitFeedback(
        formData,
        user?.idToken
      );

      if (onSuccess) {
        onSuccess(result);
      }

      setFormData({
        bike_id: bikeId || "",
        rating: 0,
        comment: "",
      });
    } catch (err) {
      setError(err.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="alert-warning">
        <p className="alert-warning-text">Please log in to submit feedback.</p>
      </div>
    );
  }

  return (
    <div className="feedback-form-container">
      {error && (
        <div className="alert-error">
          <p className="alert-error-text">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="form-group">
          <label className="feedback-form-label">Bike ID</label>
          <input
            type="text"
            value={formData.bike_id}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, bike_id: e.target.value }))
            }
            className="form-input"
            placeholder="Enter bike ID"
            required
            disabled={!!bikeId}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Rating</label>
          <div className="rating-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingClick(star)}
                className="rating-star"
              >
                <Star
                  size={24}
                  className={
                    star <= formData.rating ? "star-active" : "star-inactive"
                  }
                />
              </button>
            ))}
          </div>
          <p className="rating-text">
            {formData.rating > 0
              ? `${formData.rating} star${formData.rating !== 1 ? "s" : ""}`
              : "Click to rate"}
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Comment</label>
          <textarea
            value={formData.comment}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, comment: e.target.value }))
            }
            className="form-textarea"
            rows="4"
            placeholder="Share your experience with this bike..."
            required
            minLength="10"
          />
          <p className="comment-count">
            {formData.comment.length}/500 characters (minimum 10)
          </p>
        </div>

        <div className="form-group">
          <div className="feedback-form-buttons">
            <button
              type="submit"
              disabled={loading}
              className="feedback-form-submit-button"
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="feedback-form-cancel-button"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
