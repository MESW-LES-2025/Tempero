import { useState } from "react";
import { supabase } from "../config/supabaseClient";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  report: any;
  onResolved: () => void;
};

export default function ResolveReportModal({ isOpen, onClose, report, onResolved }: Props) {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  async function handleDeleteContent() {
    const confirmed = window.confirm(`Are you sure you want to delete this ${report.reported_item_type}?`);
    if (!confirmed) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from(getTableName(report.reported_item_type))
        .delete()
        .eq("id", report.reported_item_id);

      if (error) throw error;

      // Mark report as resolved
      await supabase
        .from("reports")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", report.id);

      alert(`${report.reported_item_type} deleted successfully`);
      onResolved();
      onClose();
    } catch (err) {
      console.error("Error deleting content:", err);
      alert("Failed to delete content");
    } finally {
      setDeleting(false);
    }
  }

  async function handleKeepContent() {
    // Just mark as resolved without deleting
    await supabase
      .from("reports")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", report.id);

    onResolved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-heading-styled text-secondary mb-4">Resolve Report</h2>
        
        <p className="text-dark font-body mb-6">
          What action do you want to take on this reported {report.reported_item_type}?
        </p>

        <div className="space-y-3">
          <button
            onClick={handleDeleteContent}
            disabled={deleting}
            className="w-full bg-danger text-bright px-4 py-3 rounded-lg font-heading hover:bg-danger/90 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : `Delete ${report.reported_item_type}`}
          </button>

          <button
            onClick={handleKeepContent}
            className="w-full bg-main text-bright px-4 py-3 rounded-lg font-heading hover:bg-main/90"
          >
            Keep content & mark as resolved
          </button>

          <button
            onClick={onClose}
            className="w-full bg-dark/20 text-dark px-4 py-3 rounded-lg font-heading hover:bg-dark/30"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function getTableName(itemType: string): string {
  if (itemType === "recipe") return "recipes";
  if (itemType === "review") return "reviews";
  if (itemType === "comment") return "comments";
  if (itemType === "user") return "profiles";
  return "";
}
