import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

const config = {
  PROCEED: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', badge: 'badge-green',  label: 'PROCEED' },
  REVIEW:  { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30',   badge: 'badge-yellow', label: 'REVIEW'  },
  WAIT:    { icon: XCircle,       color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/30',       badge: 'badge-red',    label: 'WAIT'    },
}

export default function DecisionCard({ action, suggestion, prediction, confidence }) {
  const c = config[action] || config['REVIEW']
  const Icon = c.icon

  return (
    <div className={`glass-card p-6 border ${c.bg} animate-slide-up`}>
      <div className="flex items-center gap-3 mb-4">
        <Icon size={22} className={c.color} />
        <h3 className="font-display font-bold text-white text-lg">AI Decision Engine</h3>
        <span className={`${c.badge} ml-auto`}>{c.label}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Prediction</p>
            <p className="font-bold text-white text-lg">{prediction}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Confidence</p>
            <p className={`font-bold text-xl ${c.color}`}>{confidence?.toFixed(1)}%</p>
          </div>
        </div>

        <div className="h-px bg-surface-border" />

        <div className="flex gap-3">
          <Info size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300 leading-relaxed">{suggestion}</p>
        </div>
      </div>
    </div>
  )
}
