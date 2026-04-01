export default function ProgressBar({ value, max = 1, label, color = '#6366f1' }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{label}</span>
          <span className="font-semibold text-white">{pct}%</span>
        </div>
      )}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
        />
      </div>
    </div>
  )
}
