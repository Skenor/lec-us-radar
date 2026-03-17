export default function LiveBadge({ isLive, label }) {
  if (!isLive) return null;
  return (
    <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-live/30 bg-live/10 text-live">
      <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
      {label || "Live Data"}
    </span>
  );
}
