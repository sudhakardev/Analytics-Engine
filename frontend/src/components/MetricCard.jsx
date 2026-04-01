export default function MetricCard({ label, value, icon: Icon, color = 'brand', suffix = '' }) {
  const colors = {
    brand:   'from-brand-500/20 to-brand-600/10 border-brand-500/30 text-brand-400',
    green:   'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    yellow:  'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    purple:  'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    red:     'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    blue:    'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
  }

  return (
    <div className={`glass-card p-5 bg-gradient-to-br ${colors[color]} animate-slide-up`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
            <Icon size={17} className={colors[color].split(' ').find(c => c.startsWith('text-'))} />
          </div>
        )}
      </div>
      <p className="text-3xl font-display font-bold text-white">
        {value !== undefined && value !== null
          ? typeof value === 'number' ? `${(value * 100).toFixed(1)}${suffix}` : `${value}${suffix}`
          : '—'
        }
      </p>
    </div>
  )
}
