import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Users, Search, Trash2, Eye, Upload, Loader2,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import { getCandidates, deleteCandidate } from '../utils/api'
import { formatDate, getExperienceLabel, getInitials } from '../utils/helpers'

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 12

  const loadCandidates = () => {
    setLoading(true)
    getCandidates(0, 500)
      .then(setCandidates)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCandidates() }, [])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await deleteCandidate(id)
      setCandidates((prev) => prev.filter((c) => c.id !== id))
      toast.success(`"${name}" deleted.`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = candidates.filter((c) => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.skills?.some((s) => s.toLowerCase().includes(q))
    )
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Candidates</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {candidates.length} total candidate{candidates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by name, skill..."
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1) }}
              className="input-field pl-9 w-56 text-sm py-2"
            />
          </div>
          <Link to="/upload" className="btn-primary text-sm py-2">
            <Upload size={15} />
            Upload
          </Link>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 gap-4">
          <Users size={40} className="text-slate-700" />
          <div className="text-center">
            <p className="text-slate-300 font-medium">
              {filter ? 'No candidates match your filter' : 'No candidates yet'}
            </p>
            {!filter && (
              <Link to="/upload" className="text-blue-400 hover:text-blue-300 text-sm mt-1 inline-block">
                Upload your first CV →
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 label w-8">#</th>
                  <th className="text-left px-5 py-3 label">Candidate</th>
                  <th className="text-left px-5 py-3 label hidden md:table-cell">Contact</th>
                  <th className="text-left px-5 py-3 label hidden lg:table-cell">Experience</th>
                  <th className="text-left px-5 py-3 label hidden xl:table-cell">Top Skills</th>
                  <th className="text-left px-5 py-3 label hidden sm:table-cell">Uploaded</th>
                  <th className="text-right px-5 py-3 label">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {paginated.map((c, i) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-3.5 text-slate-600 text-sm">
                      {(page - 1) * PER_PAGE + i + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {getInitials(c.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-200 font-medium text-sm truncate max-w-[180px]">
                            {c.name}
                          </p>
                          {c.location && (
                            <p className="text-slate-500 text-xs">{c.location}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-slate-400 text-sm truncate max-w-[180px]">
                        {c.email || '—'}
                      </p>
                      {c.phone && (
                        <p className="text-slate-500 text-xs">{c.phone}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div>
                        <span className="badge badge-blue">
                          {c.years_of_experience}y
                        </span>
                        <p className="text-slate-500 text-xs mt-1">
                          {getExperienceLabel(c.years_of_experience)}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden xl:table-cell max-w-[220px]">
                      <div className="flex flex-wrap gap-1">
                        {c.skills?.slice(0, 3).map((s) => (
                          <span key={s} className="badge badge-purple text-xs">{s}</span>
                        ))}
                        {c.skills?.length > 3 && (
                          <span className="text-slate-500 text-xs">+{c.skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <p className="text-slate-500 text-xs">{formatDate(c.created_at)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/candidates/${c.id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="View profile"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          disabled={deletingId === c.id}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete candidate"
                        >
                          {deletingId === c.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 text-slate-500 hover:text-white disabled:opacity-30 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                      p === page
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-500 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 text-slate-500 hover:text-white disabled:opacity-30 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
