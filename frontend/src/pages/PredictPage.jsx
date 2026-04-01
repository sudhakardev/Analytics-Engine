import { useEffect, useState } from 'react'
import { modelsApi, predictionsApi } from '../services/api'
import toast from 'react-hot-toast'
import DecisionCard from '../components/DecisionCard'
import { Sparkles, Send, Clock, ChevronDown, AlertCircle, Terminal, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

const FIELD_CONFIGS = {
  age: { type: 'slider', min: 18, max: 100, step: 1 },
  income: { type: 'slider', min: 10000, max: 250000, step: 1000, prefix: '$' },
  credit_score: { type: 'slider', min: 300, max: 850, step: 1 },
  loan_amount: { type: 'slider', min: 1000, max: 200000, step: 1000, prefix: '$' },
  employment_years: { type: 'slider', min: 0, max: 40, step: 1 },
  debt_ratio: { type: 'slider', min: 0.0, max: 1.0, step: 0.01 },
  num_credit_lines: { type: 'slider', min: 0, max: 20, step: 1 },
  marital_status: { type: 'select', options: ['Single', 'Married', 'Divorced'] },
  education: { type: 'select', options: ['High School', 'Bachelor', 'Master', 'PhD'] },
  loan_purpose: { type: 'select', options: ['Home', 'Auto', 'Business', 'Personal', 'Education'] }
}

export default function PredictPage() {
  const [models, setModels]       = useState([])
  const [activeModel, setActiveModel] = useState(null)
  const [selectedModel, setSelectedModel] = useState(null)
  const [inputFields, setInputFields] = useState({})
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [history, setHistory]     = useState([])

  useEffect(() => {
    modelsApi.list().then(r => {
      setModels(r.data)
      const active = r.data.find(m => m.is_active)
      if (active) {
        setSelectedModel(active)
        setActiveModel(active)
        initFields(active)
      }
    }).catch(() => {})
    predictionsApi.history().then(r => setHistory(r.data)).catch(() => {})
  }, [])

  const initFields = model => {
    if (!model?.feature_names) return
    const f = {}
    model.feature_names.forEach(n => {
      const config = FIELD_CONFIGS[n]
      if (config?.type === 'slider') f[n] = config.min + (config.max - config.min) / 2
      else if (config?.type === 'select') f[n] = config.options[0]
      else f[n] = ''
    })
    setInputFields(f)
  }

  const handleModelChange = id => {
    const m = models.find(m => m.id === parseInt(id))
    setSelectedModel(m)
    setResult(null)
    initFields(m)
  }

  const handlePredict = async e => {
    e.preventDefault()
    if (!selectedModel) { toast.error('Select a model first'); return }
    const emptyFields = Object.entries(inputFields).filter(([,v]) => v === '')
    if (emptyFields.length > 0) { toast.error(`Fill in: ${emptyFields[0][0]}`); return }

    const processedData = {}
    Object.entries(inputFields).forEach(([k, v]) => {
      processedData[k] = isNaN(v) || v === '' ? v : parseFloat(v)
    })

    setLoading(true)
    try {
      const { data } = await predictionsApi.predict({ model_id: selectedModel.id, input_data: processedData })
      setResult(data)
      setHistory(prev => [data, ...prev.slice(0, 49)])
      toast.success(`Prediction: ${data.prediction} (${data.confidence_percent}% confidence)`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title">Predictions</h1>
        <p className="text-gray-500 mt-1">Highly interactive real-time inference engine</p>
      </div>

      {models.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <AlertCircle size={40} className="text-amber-400 mx-auto mb-4 animate-pulse" />
          <h3 className="font-bold text-white text-lg mb-2">No trained models available</h3>
          <p className="text-gray-500">Go to the Train Model page to train your first ML model.</p>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-6">
          {/* Input Form */}
          <div className="col-span-2 space-y-4">
            <div className="glass-card p-6 shadow-xl shadow-brand-500/5 transition-all hover:shadow-brand-500/10 hover:-translate-y-1">
              <h2 className="font-bold text-white mb-5 flex items-center gap-2">
                <Activity size={18} className="text-brand-400 animate-pulse" />
                Interactive Data Simulator
              </h2>

              <div className="mb-5">
                <label className="label">Active Intelligence Model</label>
                <div className="relative">
                  <select className="input-field appearance-none pr-10 border-brand-500/30 bg-surface-hover transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    value={selectedModel?.id || ''}
                    onChange={e => handleModelChange(e.target.value)}>
                    {models.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.version} – {m.algorithm} {m.is_active ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-3.5 text-brand-400 pointer-events-none" />
                </div>
              </div>

              {selectedModel && (
                <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-surface to-brand-900/10 border border-brand-500/20 shadow-inner">
                  <p className="text-xs text-gray-500">Targetting Output Column:</p>
                  <p className="font-bold text-brand-300 tracking-wide uppercase text-sm">{selectedModel.target_column}</p>
                </div>
              )}

              <form onSubmit={handlePredict} className="space-y-5">
                {Object.keys(inputFields).map(field => {
                  const config = FIELD_CONFIGS[field];
                  return (
                    <div key={field} className="group transition-all">
                      <label className="label text-xs capitalize flex justify-between">
                        <span className="text-gray-400 group-hover:text-brand-200 transition-colors">
                          {field.replace(/_/g, ' ')}
                        </span>
                        {config?.type === 'slider' && (
                          <span className="text-brand-400 font-mono bg-brand-500/10 px-2 py-0.5 rounded text-xs select-none shadow">
                            {config.prefix || ''}{inputFields[field]}
                          </span>
                        )}
                      </label>
                      
                      {config?.type === 'slider' ? (
                        <div className="mt-2.5 relative flex items-center">
                          <input
                            type="range"
                            min={config.min} max={config.max} step={config.step}
                            className="w-full h-1.5 bg-surface-border rounded-lg appearance-none cursor-pointer hover:h-2 transition-all 
                                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                                       [&::-webkit-slider-thumb]:bg-brand-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                            value={inputFields[field]}
                            onChange={e => setInputFields(f => ({ ...f, [field]: parseFloat(e.target.value) }))}
                          />
                        </div>
                      ) : config?.type === 'select' ? (
                        <div className="relative mt-1">
                          <select 
                            className="input-field appearance-none pr-10 group-hover:border-brand-500/50 transition-colors"
                            value={inputFields[field]}
                            onChange={e => setInputFields(f => ({ ...f, [field]: e.target.value }))}
                          >
                            {config.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-4 top-[14px] text-gray-500 group-hover:text-brand-400 transition-colors pointer-events-none" />
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="input-field py-2.5 text-sm mt-1 transition-all focus:scale-[1.02]"
                          placeholder={`Enter ${field}`}
                          value={inputFields[field]}
                          onChange={e => setInputFields(f => ({ ...f, [field]: e.target.value }))}
                        />
                      )}
                    </div>
                  )
                })}

                {Object.keys(inputFields).length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-4">Select a model to see input fields</p>
                )}

                <div className="pt-4">
                  <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all" disabled={loading}>
                    {loading
                      ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing Space-Time Variables...</>
                      : <><Sparkles size={18} />Generate Prediction</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Result Panel */}
          <div className="col-span-3 space-y-5">
            {result ? (
              <>
                <div className="glass-card p-6 animate-slide-up bg-surface/80 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Sparkles size={18} className="text-brand-400" /> Result Output
                    </h3>
                    <span className="text-xs text-brand-300/60 font-mono tracking-wider">{new Date(result.timestamp).toLocaleTimeString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-surface rounded-xl p-4 text-center border whitespace-nowrap overflow-hidden text-ellipsis border-surface-border hover:border-brand-500/30 transition-colors">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Predicted Class</p>
                      <p className="text-2xl font-display font-bold text-white">{result.prediction}</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4 text-center border border-surface-border relative overflow-hidden group">
                      <div className="absolute inset-0 bg-brand-500/5 group-hover:bg-brand-500/10 transition-colors" />
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide relative z-10">Confidence Score</p>
                      <p className="text-2xl font-display font-bold text-brand-400 relative z-10">{result.confidence_percent}%</p>
                    </div>
                  </div>

                  {/* Confidence visual */}
                  <div className="space-y-1.5 mt-6">
                    <div className="flex justify-between text-xs text-gray-500 mb-1 font-mono">
                      <span>CERTAINTY INDEX</span>
                      <span className="text-brand-400">{result.confidence_percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        style={{
                          width: `${result.confidence_percent}%`,
                          background: result.confidence_percent >= 75
                            ? 'linear-gradient(90deg, #10b981, #059669)'
                            : result.confidence_percent >= 40
                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                            : 'linear-gradient(90deg, #ef4444, #dc2626)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <DecisionCard
                  action={result.decision_action}
                  suggestion={result.decision_suggestion}
                  prediction={result.prediction}
                  confidence={result.confidence_percent}
                />

                {/* AI Reasoning Trace */}
                {result.reasoning_trace && result.reasoning_trace.length > 0 && (
                  <div className="glass-card p-5 animate-slide-up bg-[#0f0f17] border-l-2 border-l-brand-400 shadow-[0_0_20px_rgba(99,102,241,0.05)]">
                    <h3 className="font-bold text-brand-300 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Terminal size={14} /> Agentic Reasoning Trace
                    </h3>
                    <div className="font-mono text-xs text-brand-100/60 space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-2">
                      {result.reasoning_trace.map((trace, i) => (
                        <div key={i} className="flex gap-2 animate-fade-in opacity-0" style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'forwards' }}>
                          <span className="text-brand-500/50 select-none">❯</span>
                          <span className={trace.includes('[ACTION]') || trace.includes('[OUTPUT]') ? 'text-brand-300 font-bold' : ''}>{trace}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card p-6 h-full flex flex-col justify-center items-center opacity-50 border-dashed border-2 border-surface-border">
                <Activity size={32} className="text-brand-500/40 mb-3" />
                <h3 className="font-bold text-white mb-2">Awaiting Input parameters</h3>
                <p className="text-sm text-gray-500 text-center">Adjust the sliders on the left<br/>and click Generate Prediction to begin.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
