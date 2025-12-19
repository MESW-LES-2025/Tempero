import { useState } from "react";
import { supabase } from "../config/supabaseClient";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemType: "review" | "recipe" | "comment" | "user";
  itemId: string;
};

const REASONS = {
  review: [
    "Spam or advertising",
    "Harassment or bullying",
    "Inappropriate language",
    "Misinformation",
    "Off-topic content",
    "Other",
  ],
  recipe: [
    "Spam or advertising",
    "Inappropriate content",
    "Stolen/plagiarized content",
    "Dangerous instructions",
    "Other",
  ],
  comment: [
    "Spam or advertising",
    "Harassment or bullying",
    "Inappropriate language",
    "Off-topic content",
    "Other",
  ],
  user: [
    "Harassment",
    "Spam account",
    "Impersonation",
    "Inappropriate profile",
    "Other",
  ],
};

export default function ReportModal({ isOpen, onClose, itemType, itemId }: Props) {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReason) return;

    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_item_type: itemType,
      reported_item_id: itemId,
      reason: selectedReason === "Other" ? description : selectedReason,
    });

    setSubmitting(false);

    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSelectedReason("");
        setDescription("");
      }, 1500);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className="text-center py-8">
            <p className="text-2xl font-heading text-secondary">✓ Report Submitted</p>
            <p className="text-dark/60 font-body mt-2">Thank you for helping keep our community safe.</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-heading-styled text-secondary mb-4">Report {itemType}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-heading text-dark mb-2">Reason</label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full p-2 border border-dark/20 rounded-lg font-body"
                  required
                >
                  <option value="">Select a reason</option>
                  {REASONS[itemType].map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              {selectedReason === "Other" && (
                <div className="mb-4">
                  <label className="block text-sm font-heading text-dark mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border border-dark/20 rounded-lg font-body"
                    rows={3}
                    required
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-dark/20 text-dark rounded-lg font-heading hover:bg-dark/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-main text-bright rounded-lg font-heading hover:bg-main/90 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
