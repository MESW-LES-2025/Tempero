import { useEffect } from "react";

type Props = {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
};

export default function Toast({ message, type = "success", onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg
        text-bright font-body transition-opacity
        ${type === "success" ? "bg-secondary/50" : "bg-red-600"}
      `}
    >
      {message}
    </div>
  );
}
