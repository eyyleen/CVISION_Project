import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import { cn } from '../utils/helpers'

export default function FileUploader({ onUpload, loading }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null)
    if (rejectedFiles.length > 0) {
      const err = rejectedFiles[0].errors[0]
      if (err.code === 'file-too-large') setError('File too large. Maximum size is 10MB.')
      else if (err.code === 'file-invalid-type') setError('Only PDF and DOCX files are supported.')
      else setError(err.message)
      return
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  const handleSubmit = () => {
    if (!file) return
    setError(null)
    onUpload(file)
  }

  const clearFile = (e) => {
    e.stopPropagation()
    setFile(null)
    setError(null)
  }

  const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : null
  const fileIcon = file?.name?.endsWith('.pdf') ? '📄' : '📝'

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-blue-500 bg-blue-500/5'
            : file
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
        )}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="space-y-3">
            <div className="w-14 h-14 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-200 font-medium text-lg">{fileIcon} {file.name}</p>
              <p className="text-slate-500 text-sm mt-1">{fileSizeMB} MB — Ready to upload</p>
            </div>
            <button
              onClick={clearFile}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              <X size={12} /> Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-14 h-14 mx-auto bg-slate-700 rounded-full flex items-center justify-center">
              {isDragActive ? (
                <Upload size={28} className="text-blue-400 animate-bounce" />
              ) : (
                <FileText size={28} className="text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-slate-200 font-medium text-lg">
                {isDragActive ? 'Drop your CV here' : 'Drag & drop your CV'}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                or <span className="text-blue-400 hover:text-blue-300">browse files</span>
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full" /> PDF
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full" /> DOCX
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full" /> Max 10MB
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="btn-primary w-full justify-center py-3 text-base"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Extracting CV data...
          </>
        ) : (
          <>
            <Upload size={20} />
            Extract CV Data
          </>
        )}
      </button>
    </div>
  )
}
