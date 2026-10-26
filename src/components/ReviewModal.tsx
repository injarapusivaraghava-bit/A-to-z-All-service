import React, { useState, useEffect } from 'react';
import { Booking, Review } from '../types/index.ts';
import { api } from '../services/api.ts';
import { X, Star, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ReviewModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: (review: Review) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  booking,
  isOpen,
  onClose,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (booking) {
      setRating(5);
      setComment('');
      setErrorMessage(null);
      setSuccess(false);
      // Fetch existing review if editing
      api.reviews.getAll().then((reviews) => {
        const found = reviews.find((r) => r.bookingId === booking.id);
        if (found) {
          setRating(found.rating);
          setComment(found.comment || '');
        }
      });
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.reviews.create({
        bookingId: booking.id,
        rating,
        comment: comment.trim(),
      });
      setSuccess(true);
      onReviewSubmitted(res.review);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-200">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Verified Service Rating
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              {booking.serviceName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-lg font-bold text-neutral-900">Review Submitted!</h4>
            <p className="text-xs text-neutral-600">
              Thank you for sharing your genuine feedback. Your review is now visible on the platform.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Specialist & Booking info */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Booking Reference:</span>
                <span className="font-mono font-bold text-neutral-900">{booking.reference}</span>
              </div>
              {booking.technicianName && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Technician:</span>
                  <span className="font-semibold text-neutral-900">{booking.technicianName}</span>
                </div>
              )}
            </div>

            {/* Star Rating Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-2 text-center">
                Select your rating (1 to 5 stars)
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          active
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-neutral-300 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="text-center text-xs font-bold text-neutral-700 mt-1.5">
                {rating === 5 && 'Outstanding service'}
                {rating === 4 && 'Very good service'}
                {rating === 3 && 'Average / satisfactory'}
                {rating === 2 && 'Needs improvement'}
                {rating === 1 && 'Unsatisfactory'}
              </div>
            </div>

            {/* Written Comment */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Written Review (Optional)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (e.g. technician arrived on time, resolved the issue quickly, clean work)..."
                className="w-full p-3 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 rounded-lg transition-colors shadow-sm"
              >
                {isSubmitting ? 'Saving...' : 'Submit Rating'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
