import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { modelsApi, datasetsApi, predictionsApi } from '../services/api'
import MetricCard from '../components/MetricCard'
import { Database, BrainCircuit, Sparkles, TrendingUp, ArrowRight, Activity, Target, Zap } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const [activeModel, setActiveModel]     = useState(null)
  const [datasets, setDatasets]           = useState([])
  const [analytics, setAnalytics]         = useState(null)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    Promise.allSettled([
      modelsApi.active(),
      datasetsApi.list(),
      predictionsApi.analytics(),
    ]).then(([model, ds, anal]) => {
      if (model.status === 'fulfilled') setActiveModel(model.value.data)
      if (ds.status === 'fulfilled')   setDatasets(ds.value.data)
      if (anal.status === 'fulfilled') setAnalytics(anal.value.data)
      setLoading(false)
    })
  }, [])

  // Build simple chart data from analytics
  const chartData = analytics?.recent_predictions?.slice(0, 15).reverse().map((p, i) => ({
    name: `#${i + 1}`,
    confidence: p.confidence,
    label: p.prediction,
  })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="text-gray-500 mt-1">Your predictive analytics overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-gray-500">System Active</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Model Accuracy" value={activeModel?.accuracy} icon={Target}    color="brand"  suffix="%" />
        <MetricCard label="Datasets"        value={datasets.length}       icon={Database}  color="blue"   suffix="" />
        <MetricCard label="Total Predictions" value={analytics?.total || 0} icon={Sparkles} color="purple" suffix="" />
        <MetricCard label="Avg Confidence"  value={(analytics?.avg_confidence || 0) / 100} icon={TrendingUp} color="green" suffix="%" />
      </div>

      {/* Active Model Banner */}
      {activeModel ? (
        <div className="glass-card p-6 border-l-4 border-brand-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <BrainCircuit size={24} className="text-brand-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white">Active Model: {activeModel.version}</h3>
                  <span className="badge-green">Live</span>
                </div>
                <p className="text-sm text-gray-500">{activeModel.algorithm} · {activeModel.feature_names?.length} features · Target: {activeModel.target_column}</p>
              </div>
            </div>
            <Link to="/predict" className="btn-primary flex items-center gap-2">
              <Zap size={16} />
              Predict Now
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4">
            {[
              { l: 'Accuracy',  v: activeModel.accuracy },
              { l: 'Precision', v: activeModel.precision },
              { l: 'Recall',    v: activeModel.recall },
              { l: 'F1-Score',  v: activeModel.f1_score },
            ].map(({ l, v }) => (
              <div key={l} className="bg-surface rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{l}</p>
                <p className="text-lg font-bold text-white">{((v || 0) * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center border-dashed border-2 border-surface-border">
          <BrainCircuit size={40} className="text-gray-600 mx-auto mb-3" />
          <h3 className="font-bold text-white mb-2">No model trained yet</h3>
          <p className="text-gray-500 text-sm mb-4">Upload a dataset and train your first model to get started</p>
          <Link to="/train" className="btn-primary inline-flex items-center gap-2">
            <BrainCircuit size={16} /> Train Model
          </Link>
        </div>
      )}

      {/* Confidence Chart */}
      {chartData.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity size={20} className="text-brand-400" />
            <h3 className="font-bold text-white">Prediction Confidence Over Time</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"   stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%"  stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#374151" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis stroke="#374151" tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#161625', border: '1px solid #1e1e35', borderRadius: 10, color: '#fff' }}
                formatter={v => [`${v.toFixed(1)}%`, 'Confidence']}
              />
              <Area type="monotone" dataKey="confidence" stroke="#6366f1" strokeWidth={2} fill="url(#confGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { to: '/datasets',  icon: Database,     label: 'Upload Dataset',   desc: 'Add your CSV data',           color: 'text-blue-400' },
          { to: '/train',     icon: BrainCircuit, label: 'Train Model',      desc: 'Launch ML pipeline',          color: 'text-brand-400' },
          { to: '/analytics', icon: TrendingUp,   label: 'View Analytics',   desc: 'Insights & distributions',   color: 'text-purple-400' },
        ].map(({ to, icon: Icon, label, desc, color }) => (
          <Link key={to} to={to} className="glass-card p-5 hover:border-brand-500/40 transition-colors group">
            <Icon size={24} className={`${color} mb-3`} />
            <p className="font-semibold text-white mb-1">{label}</p>
            <p className="text-sm text-gray-500">{desc}</p>
            <ArrowRight size={16} className="text-gray-600 mt-3 group-hover:text-brand-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
