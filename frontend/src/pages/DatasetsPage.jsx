import { useEffect, useState, useRef } from 'react'
import { datasetsApi } from '../services/api'
import toast from 'react-hot-toast'
import { Upload, Database, Eye, RowsIcon, ColumnsIcon, FileText, X, ChevronRight } from 'lucide-react'

export default function DatasetsPage() {
  const [datasets, setDatasets]   = useState([])
  const [preview, setPreview]     = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging]   = useState(false)
  const [loading, setLoading]     = useState(true)
  const fileRef = useRef()

  useEffect(() => {
    datasetsApi.list().then(r => setDatasets(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleUpload = async file => {
    if (!file) return
    if (!file.name.endsWith('.csv')) { toast.error('Only CSV files are supported'); return }
    setUploading(true)
    try {
      const { data } = await datasetsApi.upload(file)
      setDatasets(prev => [data, ...prev])
      toast.success(`✅ "${data.name}" uploaded — ${data.row_count} rows, ${data.column_count} columns`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const showPreview = async id => {
    try {
      setPreview({ loading: true })
      const { data } = await datasetsApi.preview(id)
      setPreview(data)
    } catch {
      toast.error('Could not load preview')
      setPreview(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title">Datasets</h1>
        <p className="text-gray-500 mt-1">Upload and manage your CSV training data</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`glass-card p-10 text-center border-2 border-dashed transition-all duration-200 cursor-pointer
          ${dragging ? 'border-brand-500 bg-brand-500/5' : 'border-surface-border hover:border-brand-500/50'}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv" className="hidden"
          onChange={e => handleUpload(e.target.files[0])} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-gray-400">Uploading and parsing CSV...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center">
              <Upload size={28} className="text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Drop your CSV here or click to browse</p>
              <p className="text-sm text-gray-500 mt-1">Supports CSV files up to 50 MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Dataset List */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading datasets...</div>
      ) : datasets.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Database size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No datasets yet. Upload your first CSV above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-bold text-white">Your Datasets ({datasets.length})</h2>
          {datasets.map(ds => (
            <div key={ds.id} className="glass-card p-5 flex items-center gap-4 hover:border-brand-500/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{ds.name}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1"><span>{ds.row_count?.toLocaleString()} rows</span></span>
                  <span className="text-xs text-gray-500">{ds.column_count} columns</span>
                  <span className="text-xs text-gray-500">{new Date(ds.upload_time).toLocaleDateString()}</span>
                  {ds.target_column && <span className="badge-purple text-xs">Target: {ds.target_column}</span>}
                </div>
              </div>
              <button
                onClick={() => showPreview(ds.id)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Eye size={14} /> Preview
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setPreview(null)}>
          <div className="glass-card p-6 w-full max-w-5xl max-h-[80vh] overflow-auto animate-slide-up"
            onClick={e => e.stopPropagation()}>
            {preview.loading ? (
              <div className="text-center py-8"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg">Dataset Preview</h3>
                    <p className="text-sm text-gray-500">{preview.shape?.rows} rows × {preview.shape?.columns} columns</p>
                  </div>
                  <button onClick={() => setPreview(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-surface-border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-surface-hover">
                      <tr>
                        {preview.columns?.map(col => (
                          <th key={col} className="px-4 py-3 text-gray-400 font-medium whitespace-nowrap">
                            {col}
                            <span className="ml-1 text-xs text-gray-600">({preview.dtypes?.[col]})</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview?.map((row, i) => (
                        <tr key={i} className="border-t border-surface-border hover:bg-surface-hover">
                          {preview.columns?.map(col => (
                            <td key={col} className="px-4 py-2.5 text-gray-300 whitespace-nowrap">
                              {String(row[col] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
