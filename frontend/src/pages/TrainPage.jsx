import { useEffect, useState } from 'react'
import { datasetsApi, modelsApi } from '../services/api'
import toast from 'react-hot-toast'
import MetricCard from '../components/MetricCard'
import ProgressBar from '../components/ProgressBar'
import { BrainCircuit, Play, CheckCircle, Clock, Target, Layers, ChevronDown } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

export default function TrainPage() {
  const [datasets, setDatasets]   = useState([])
  const [models, setModels]       = useState([])
  const [columns, setColumns]     = useState([])
  const [form, setForm] = useState({
    dataset_id: '', target_column: '', algorithm: 'XGBoost', test_size: 0.2, n_estimators: 100,
  })
  const [training, setTraining]   = useState(false)
  const [progress, setProgress]   = useState(0)
  const [result, setResult]       = useState(null)

  useEffect(() => {
    datasetsApi.list().then(r => setDatasets(r.data)).catch(() => {})
    modelsApi.list().then(r => setModels(r.data)).catch(() => {})
  }, [])

  const handleDatasetChange = async id => {
    setForm(f => ({ ...f, dataset_id: id, target_column: '' }))
    setColumns([])
    if (!id) return
    try {
      const { data } = await datasetsApi.preview(id)
      setColumns(data.columns || [])
    } catch { toast.error('Could not load columns') }
  }

  const handleTrain = async e => {
    e.preventDefault()
    if (!form.dataset_id) { toast.error('Select a dataset'); return }
    if (!form.target_column) { toast.error('Select a target column'); return }

    setTraining(true)
    setResult(null)
    setProgress(0)

    // Simulate progress bar
    const interval = setInterval(() => {
      setProgress(p => p < 90 ? p + Math.random() * 8 : p)
    }, 400)

    try {
      const { data } = await modelsApi.train({
        ...form,
        dataset_id: parseInt(form.dataset_id),
        test_size: parseFloat(form.test_size),
        n_estimators: parseInt(form.n_estimators),
      })
      setProgress(100)
      setResult(data)
      setModels(prev => [data, ...prev])
      toast.success(`🎉 Model ${data.version} trained! Accuracy: ${(data.accuracy * 100).toFixed(1)}%`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Training failed')
    } finally {
      clearInterval(interval)
      setTraining(false)
    }
  }

  const radarData = result ? [
    { metric: 'Accuracy',  value: result.accuracy  * 100 },
    { metric: 'Precision', value: result.precision * 100 },
    { metric: 'Recall',    value: result.recall    * 100 },
    { metric: 'F1-Score',  value: result.f1_score  * 100 },
  ] : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title">Train Model</h1>
        <p className="text-gray-500 mt-1">Configure and launch your ML pipeline</p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Config Panel */}
        <div className="col-span-2 space-y-5">
          <div className="glass-card p-6">
            <h2 className="font-bold text-white mb-5 flex items-center gap-2">
              <BrainCircuit size={18} className="text-brand-400" />
              Training Configuration
            </h2>

            <form onSubmit={handleTrain} className="space-y-4">
              <div>
                <label className="label">Dataset</label>
                <div className="relative">
                  <select className="input-field appearance-none pr-10"
                    value={form.dataset_id} onChange={e => handleDatasetChange(e.target.value)} required>
                    {datasets.length === 0 ? (
                      <option value="">⚠️ No datasets found. Go to 'Datasets' to upload first!</option>
                    ) : (
                      <>
                        <option value="">Select a dataset…</option>
                        {datasets.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.row_count} rows)</option>
                        ))}
                      </>
                    )}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="label">Target Column</label>
                <div className="relative">
                  <select className="input-field appearance-none pr-10"
                    value={form.target_column} onChange={e => setForm(f => ({ ...f, target_column: e.target.value }))} required>
                    <option value="">Select target column…</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="label">Algorithm</label>
                <div className="relative">
                  <select className="input-field appearance-none pr-10"
                    value={form.algorithm} onChange={e => setForm(f => ({ ...f, algorithm: e.target.value }))}>
                    <option value="XGBoost">XGBoost (Auto-tuned)</option>
                    <option value="RandomForest">Random Forest</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Test Split</label>
                  <input type="number" className="input-field" min="0.1" max="0.4" step="0.05"
                    value={form.test_size} onChange={e => setForm(f => ({ ...f, test_size: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Estimators</label>
                  <input type="number" className="input-field" min="10" max="500" step="10"
                    value={form.n_estimators} onChange={e => setForm(f => ({ ...f, n_estimators: e.target.value }))} />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={training}>
                {training
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Training…</>
                  : <><Play size={16} />Launch Training</>
                }
              </button>
            </form>
          </div>

          {/* Training Progress */}
          {(training || progress > 0) && (
            <div className="glass-card p-5 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                {progress === 100 ? <CheckCircle size={18} className="text-emerald-400" /> : <Clock size={18} className="text-brand-400 animate-spin" />}
                <h3 className="font-bold text-white">{progress === 100 ? 'Training Complete!' : 'Training in progress…'}</h3>
              </div>
              <ProgressBar value={progress} max={100} label="Pipeline Progress" />
              <p className="text-xs text-gray-500 mt-3">
                {progress < 30 ? 'Loading and preprocessing data features...'
                  : progress < 60 ? 'Auto-tuning hyperparameters via cross-validation...'
                  : progress < 90 ? 'Evaluating model accuracy and generating confidence scores...'
                  : 'Saving enterprise model artifacts...'}
              </p>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="col-span-3 space-y-5">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard label="Accuracy"  value={result.accuracy}  color="brand"  />
                <MetricCard label="F1-Score"  value={result.f1_score}  color="green"  />
                <MetricCard label="Precision" value={result.precision} color="blue"   />
                <MetricCard label="Recall"    value={result.recall}    color="purple" />
              </div>

              <div className="glass-card p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Target size={18} className="text-brand-400" /> Performance Radar
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1e1e35" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: '#161625', border: '1px solid #1e1e35', borderRadius: 10, color: '#fff' }}
                      formatter={v => [`${v.toFixed(1)}%`]} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={16} className="text-brand-400" />
                  <h3 className="font-bold text-white">Feature Set ({result.feature_names?.length})</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.feature_names?.map(f => (
                    <span key={f} className="badge-blue text-xs">{f}</span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Previous models table */
            <div className="glass-card p-6">
              <h3 className="font-bold text-white mb-4">Model History</h3>
              {models.length === 0
                ? <p className="text-gray-500 text-center py-8">No models trained yet.</p>
                : (
                  <div className="space-y-3">
                    {models.map(m => (
                      <div key={m.id} className="flex items-center gap-4 p-3 rounded-xl bg-surface hover:bg-surface-hover transition-colors">
                        <div className="flex items-center gap-2 flex-1">
                          <span className={`badge ${m.is_active ? 'badge-green' : 'badge-blue'}`}>{m.version}</span>
                          <span className="text-sm text-white">{m.algorithm}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-center flex-1">
                          {['accuracy','precision','recall','f1_score'].map(k => (
                            <div key={k}>
                              <p className="text-xs text-gray-500 capitalize">{k.replace('_',' ')}</p>
                              <p className="text-sm font-bold text-white">{((m[k] || 0) * 100).toFixed(1)}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
