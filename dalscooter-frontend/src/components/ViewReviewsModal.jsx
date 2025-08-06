import React from 'react';
import { X } from 'lucide-react';
import FeedbackList from './FeedbackList';
import '../styles/ViewReviewsModal.css';

const ViewReviewsModal = ({ bikeId, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Reviews for Bike {bikeId}</h2>
          <button onClick={onClose} className="modal-close-button">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body scrollable-content">
          {/* This now loads & displays bike-specific reviews with your original look */}
          <FeedbackList bikeId={bikeId} showStats={true} />
        </div>
      </div>
    </div>
  );
};

export default ViewReviewsModal;
