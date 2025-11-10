import logo from "../assets/tempro.png";

export default function Loader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Rotating bordered frame with logo inside */}
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl border-4 border-[#e57f22]/30 flex items-center justify-center animate-spin-slow">
          <div className="h-14 w-14 rounded-xl bg-[#e57f22]/10 flex items-center justify-center">
            <img
              src={logo}
              alt="Tempero logo"
              className="h-10 w-10 object-contain drop-shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Message text */}
      <p className="mt-4 text-[#e57f22] font-semibold tracking-wide text-base">
        {message || "Loading..."}
      </p>
    </div>
  );
}
