import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { CheckCircle2, ArrowRight, AlertCircle, Brain, Zap, FileText } from 'lucide-react'
import FileUploader from '../components/FileUploader'
import CandidateCard from '../components/CandidateCard'
import { uploadCV } from '../utils/api'

const TIPS = [
  { icon: FileText, text: 'Supports PDF and DOCX formats up to 10MB' },
  { icon: Brain, text: 'AI automatically extracts name, contact, education, and skills' },
  { icon: Zap, text: 'NLP analyzes experience and categorizes technical skills' },
]

export default function UploadPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleUpload = async (file) => {
    setLoading(true)
    setError(null)
    setResult(null)

    const toastId = toast.loading(`Extracting data from ${file.name}...`)
    try {
      const data = await uploadCV(file)
      setResult(data)
      toast.success('CV extracted successfully!', { id: toastId })
    } catch (err) {
      setError(err.message)
      toast.error(err.message, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Upload CV</h2>
        <p className="text-slate-400 text-sm mt-1">
          Upload a PDF or DOCX resume to automatically extract structured candidate data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upload panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <FileUploader onUpload={handleUpload} loading={loading} />
          </div>

          {/* Tips */}
          <div className="card p-5 space-y-3">
            <p className="label">How it works</p>
            {TIPS.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={14} className="text-blue-400" />
                </div>
                <p className="text-slate-400 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Result panel */}
        <div className="lg:col-span-3">
          {error && (
            <div className="card p-6 border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-medium">Extraction Failed</p>
                  <p className="text-slate-400 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result ? (
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <h3 className="section-title">Extraction Complete</h3>
                </div>
                <button
                  onClick={() => navigate(`/candidates/${result.id}`)}
                  className="btn-primary text-sm py-1.5"
                >
                  View Full Profile
                  <ArrowRight size={14} />
                </button>
              </div>
              <div className="card-body">
                <CandidateCard candidate={result} compact={false} />
              </div>
            </div>
          ) : !error && (
            <div className="card h-full min-h-[300px] flex items-center justify-center border-dashed">
              <div className="text-center space-y-3 px-8">
                <div className="w-16 h-16 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center">
                  <Brain size={28} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Extracted data will appear here</p>
                  <p className="text-slate-600 text-sm mt-1">
                    Upload a CV on the left to get started
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
