import React, { useState, useEffect } from "react";
import "./Reviews.css";
import { FaArrowLeft, FaStar } from "react-icons/fa";

export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8087";

const Reviews = ({ provider, onBack, bookingId, showAddButton = true }) => {
  // Add review state
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReviewText, setNewReviewText] = useState("");
  const [newRating, setNewRating] = useState(0);

  // Backend reviews state
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Fetch all reviews from backend on mount
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_BASE}/reviews/all`);
        if (!response.ok) throw new Error("Error fetching reviews");
        const data = await response.json();
        setReviews(data); // All reviews from backend
      } catch (err) {
        console.error(err);
        setReviews([]);
      }
      setLoadingReviews(false);
    };
    fetchReviews();
  }, []);

  // Filter for this provider's reviews only
  const providerReviews = reviews.filter(
    (review) => review.provider_id === provider.id
  );

  // Add review
  const handleSaveReview = async () => {
    if (!newReviewText || newRating === 0) return;
    const reviewPayload = {
      bookingId,
      rating: newRating,
      comment: newReviewText,
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/reviews/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(reviewPayload)
      });
      if (!response.ok) throw new Error("Failed to save review");
      // instant UI feedback
      setReviews([
        ...reviews,
        {
          rating: newRating,
          provider_id: provider.id,
          comment: newReviewText,
          customer_name: "You"
        }
      ]);
      setShowAddReview(false);
      setNewReviewText("");
      setNewRating(0);
    } catch (error) {
      alert("Saving review failed: " + error.message);
    }
  };

  return (
    <div className="reviews-right">
      <div className="reviews-header-row">
        <button className="back-to-booking-btn" onClick={onBack}>
          <FaArrowLeft /> Back
        </button>

        {/* showAddButton controls whether to render the Add Review button */}
        {showAddButton && (
          <button className="add-review-btn" onClick={() => setShowAddReview(true)}>
            Add Review
          </button>
        )}
      </div>

      <h2 className="reviews-title">Reviews & Ratings</h2>

      <div className="reviews-summary">
        <div>
          <b>Overall Rating:</b>{" "}
          {providerReviews.length > 0
            ? (
                (providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length).toFixed(1)
              )
            : "0.0"
          } / 5
        </div>
        <div><b>Total Reviews:</b> {providerReviews.length}</div>
      </div>

      <div className="reviews-list-container">
        {loadingReviews ? (
          <div>Loading reviews...</div>
        ) : providerReviews.length === 0 ? (
          <div className="no-reviews-text">No reviews found.</div>
        ) : (
          <ul className="reviews-list">
            {providerReviews.map((review, idx) => (
              <li key={idx} className="review-item">
                <b>{review.customer_name || "Anonymous"}</b>
                <span className="review-rating"> ({review.rating}/5)</span><br />
                <span>{review.comment}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAddReview && showAddButton && (
        <div className="add-review-modal">
          <h3>Add Review</h3>
          <div className="star-rating">
            {[1,2,3,4,5].map(num => (
              <FaStar
                key={num}
                onClick={() => setNewRating(num)}
                className={num <= newRating ? "star-selected" : ""}
              />
            ))}
            <span style={{ marginLeft:"1em" }}>{newRating ? `${newRating}/5` : ""}</span>
          </div>
          <textarea
            className="add-review-textbox"
            placeholder="Write your review..."
            value={newReviewText}
            onChange={e => setNewReviewText(e.target.value)}
            rows={3}
          />
          <div>
            <button className="save-review-btn" onClick={handleSaveReview} disabled={!newReviewText || newRating===0}>
              Save
            </button>
            <button className="cancel-review-btn" onClick={()=>setShowAddReview(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;