import { useEffect, useState } from 'react'
import { predictionsApi } from '../services/api'
import { BarChart2, PieChart as PieIcon, TrendingUp, Activity } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
const ACTION_COLORS = { PROCEED: '#10b981', REVIEW: '#f59e0b', WAIT: '#ef4444' }

export default function AnalyticsPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    predictionsApi.analytics()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!data || data.total === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Analytics</h1>
          <p className="text-gray-500 mt-1">Insights from your prediction history</p>
        </div>
        <div className="glass-card p-16 text-center">
          <BarChart2 size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="font-bold text-white text-lg mb-2">No analytics data yet</h3>
          <p className="text-gray-500">Make some predictions to see insights here.</p>
        </div>
      </div>
    )
  }

  const distributionData = Object.entries(data.distribution).map(([k, v]) => ({ name: k, count: v }))
  const actionsData      = Object.entries(data.actions).map(([k, v]) => ({ name: k, value: v, fill: ACTION_COLORS[k] || '#6366f1' }))
  const timelineData     = (data.recent_predictions || []).slice(0, 20).reverse().map((p, i) => ({
    index: i + 1, confidence: p.confidence, label: p.prediction,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title">Analytics</h1>
        <p className="text-gray-500 mt-1">Deep insights from your prediction history</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Predictions', value: data.total,           suffix: '',  color: 'bg-brand-500/20 text-brand-400 border-brand-500/30' },
          { label: 'Avg Confidence',    value: `${data.avg_confidence}%`, suffix: '', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
          { label: 'Min Confidence',    value: `${data.min_confidence}%`, suffix: '', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
          { label: 'Max Confidence',    value: `${data.max_confidence}%`, suffix: '', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`glass-card p-5 border ${color} animate-slide-up`}>
            <p className="text-xs text-gray-500 mb-2">{label}</p>
            <p className="text-2xl font-display font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Distribution Bar Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={18} className="text-brand-400" />
            <h3 className="font-bold text-white">Prediction Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distributionData} barSize={36}>
              <XAxis dataKey="name" stroke="#374151" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis stroke="#374151" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#161625', border: '1px solid #1e1e35', borderRadius: 10, color: '#fff' }}
                formatter={v => [v, 'Count']} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {distributionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Decision Actions Pie */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <PieIcon size={18} className="text-purple-400" />
            <h3 className="font-bold text-white">Decision Actions</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={actionsData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                innerRadius={60} outerRadius={90} paddingAngle={4} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#374151' }}>
                {actionsData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#161625', border: '1px solid #1e1e35', borderRadius: 10, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confidence Timeline */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity size={18} className="text-emerald-400" />
          <h3 className="font-bold text-white">Confidence Timeline (Last 20 Predictions)</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" />
            <XAxis dataKey="index" stroke="#374151" tick={{ fill: '#9ca3af', fontSize: 11 }} label={{ value: 'Prediction #', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 11 }} />
            <YAxis stroke="#374151" tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 100]} unit="%" />
            <Tooltip
              contentStyle={{ background: '#161625', border: '1px solid #1e1e35', borderRadius: 10, color: '#fff' }}
              formatter={(v, _, p) => [`${v.toFixed(1)}% confidence`, p.payload.label]}
            />
            <Line type="monotone" dataKey="confidence" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Table */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-blue-400" />
          <h3 className="font-bold text-white">Recent Predictions Log</h3>
        </div>
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-hover">
              <tr>
                {['#', 'Prediction', 'Confidence', 'Action', 'Time'].map(h => (
                  <th key={h} className="px-4 py-3 text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.recent_predictions || []).slice(0, 15).map((p, i) => (
                <tr key={i} className="border-t border-surface-border hover:bg-surface-hover">
                  <td className="px-4 py-3 text-gray-600">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-white">{p.prediction}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${p.confidence >= 75 ? 'text-emerald-400' : p.confidence >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {p.confidence.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.action === 'PROCEED' ? 'badge-green' : p.action === 'REVIEW' ? 'badge-yellow' : 'badge-red'}`}>
                      {p.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
