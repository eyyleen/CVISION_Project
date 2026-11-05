import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft, Edit3, Save, X, Loader2,
  Trash2, History, Target
} from 'lucide-react'
import { getCandidate, updateCandidate, deleteCandidate, getCandidateMatches } from '../utils/api'
import CandidateCard from '../components/CandidateCard'
import { formatDate, getScoreColor } from '../utils/helpers'

export default function CandidateDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getCandidate(id),
      getCandidateMatches(id).catch(() => []),
    ])
      .then(([c, m]) => {
        setCandidate(c)
        setEditData({ name: c.name, email: c.email, phone: c.phone, location: c.location, summary: c.summary })
        setMatches(m)
      })
      .catch((err) => {
        toast.error(err.message)
        navigate('/candidates')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateCandidate(id, editData)
      setCandidate(updated)
      setEditing(false)
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${candidate.name}"?`)) return
    try {
      await deleteCandidate(id)
      toast.success('Candidate deleted.')
      navigate('/candidates')
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (!candidate) return null

  return (
    <div className="max-w-5xl space-y-5">
      {/* Back + actions */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm py-2">
          <ArrowLeft size={15} />
          Back
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Link to={`/job-match?candidate=${id}`} className="btn-primary text-sm py-2">
            <Target size={15} />
            Job Match
          </Link>
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="btn-secondary text-sm py-2">
                <X size={15} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-2">
                <Edit3 size={15} /> Edit
              </button>
              <button onClick={handleDelete} className="btn-danger text-sm">
                <Trash2 size={15} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main card */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="section-title">Candidate Profile</h3>
          </div>
          <div className="card-body">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="label mb-1.5 block">Full Name</label>
                  <input
                    className="input-field"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1.5 block">Email</label>
                    <input
                      className="input-field"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label mb-1.5 block">Phone</label>
                    <input
                      className="input-field"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label mb-1.5 block">Location</label>
                  <input
                    className="input-field"
                    value={editData.location || ''}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">Summary</label>
                  <textarea
                    className="input-field resize-none h-24"
                    value={editData.summary || ''}
                    onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <CandidateCard candidate={candidate} compact={false} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* File info */}
          <div className="card p-5 space-y-3">
            <p className="label">File Info</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Filename</span>
                <span className="text-slate-300 text-right max-w-[150px] truncate">
                  {candidate.file_name || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="badge badge-purple uppercase">{candidate.file_type || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Uploaded</span>
                <span className="text-slate-300">{formatDate(candidate.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Skills found</span>
                <span className="text-slate-300">{candidate.skills?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Match history */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <History size={14} className="text-slate-500" />
              <p className="label">Match History</p>
            </div>
            {matches.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-600 text-sm">No job matches yet</p>
                <Link
                  to={`/job-match?candidate=${id}`}
                  className="text-blue-400 hover:text-blue-300 text-xs mt-1 inline-block"
                >
                  Run a job match →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {matches.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-slate-300 text-xs font-medium truncate">{m.job_title}</p>
                      <p className="text-slate-600 text-xs">{formatDate(m.created_at)}</p>
                    </div>
                    <span className={`text-sm font-bold ${getScoreColor(m.match_score)}`}>
                      {m.match_score}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
