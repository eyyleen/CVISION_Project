import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Search, X, Loader2, Users, SlidersHorizontal } from 'lucide-react'
import { searchCandidates } from '../utils/api'
import { formatDate, getExperienceLabel, getInitials } from '../utils/helpers'

const SKILL_SUGGESTIONS = [
  'Python', 'JavaScript', 'React', 'Java', 'SQL', 'Machine Learning',
  'Docker', 'AWS', 'TypeScript', 'Go', 'Kubernetes', 'PostgreSQL',
]

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [minExp, setMinExp] = useState('')
  const [maxExp, setMaxExp] = useState('')
  const [location, setLocation] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const addSkill = (skill) => {
    const s = skill.trim()
    if (s && !skills.includes(s)) {
      setSkills([...skills, s])
    }
    setSkillInput('')
  }

  const removeSkill = (skill) => setSkills(skills.filter((s) => s !== skill))

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(skillInput)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    setResults(null)
    try {
      const data = await searchCandidates({
        query: query || null,
        skills: skills.length > 0 ? skills : null,
        min_experience: minExp ? parseFloat(minExp) : null,
        max_experience: maxExp ? parseFloat(maxExp) : null,
        location: location || null,
      })
      setResults(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const clearAll = () => {
    setQuery('')
    setSkills([])
    setSkillInput('')
    setMinExp('')
    setMaxExp('')
    setLocation('')
    setResults(null)
  }

  const hasFilters = query || skills.length > 0 || minExp || maxExp || location

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Search Candidates</h2>
        <p className="text-slate-400 text-sm mt-1">
          Find candidates by name, skills, location, and experience level.
        </p>
      </div>

      {/* Search panel */}
      <div className="card p-5 space-y-4">
        {/* Main search bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, location, or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'border-blue-500/50 text-blue-400' : ''}`}
          >
            <SlidersHorizontal size={16} />
            Filters
            {(skills.length > 0 || minExp || maxExp || location) && (
              <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {[skills.length > 0, minExp, maxExp, location].filter(Boolean).length}
              </span>
            )}
          </button>
          <button onClick={handleSearch} disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </div>

        {/* Skills */}
        <div>
          <label className="label mb-2 block">Required Skills</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {skills.map((skill) => (
              <span key={skill} className="badge badge-blue items-center gap-1.5">
                {skill}
                <button onClick={() => removeSkill(skill)} className="text-blue-300 hover:text-white">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a skill and press Enter..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              className="input-field text-sm py-2 flex-1"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 8).map((s) => (
              <button
                key={s}
                onClick={() => addSkill(s)}
                className="text-xs px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800 animate-slide-up">
            <div>
              <label className="label mb-1.5 block">Min Experience (years)</label>
              <input
                type="number" min="0" max="50" step="0.5"
                placeholder="e.g. 2"
                value={minExp}
                onChange={(e) => setMinExp(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">Max Experience (years)</label>
              <input
                type="number" min="0" max="50" step="0.5"
                placeholder="e.g. 8"
                value={maxExp}
                onChange={(e) => setMaxExp(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">Location</label>
              <input
                type="text"
                placeholder="e.g. Jakarta"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        )}

        {hasFilters && (
          <div className="flex justify-end">
            <button onClick={clearAll} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
              <X size={12} /> Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <p className="text-slate-400 text-sm">Searching candidates...</p>
          </div>
        </div>
      )}

      {!loading && results !== null && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              Found <span className="text-slate-200 font-semibold">{results.length}</span> candidate{results.length !== 1 ? 's' : ''}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 gap-4">
              <Users size={36} className="text-slate-700" />
              <div className="text-center">
                <p className="text-slate-300 font-medium">No candidates found</p>
                <p className="text-slate-500 text-sm mt-1">Try different keywords or filters</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((c) => (
                <Link
                  key={c.id}
                  to={`/candidates/${c.id}`}
                  className="card p-4 hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
                      {getInitials(c.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors truncate">
                        {c.name}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {c.email || c.location || '—'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="badge badge-blue text-xs">
                          {c.years_of_experience}y · {getExperienceLabel(c.years_of_experience)}
                        </span>
                        {c.skills?.length > 0 && (
                          <span className="text-slate-600 text-xs">{c.skills.length} skills</span>
                        )}
                      </div>
                      {c.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.skills.slice(0, 4).map((s) => (
                            <span key={s} className="badge badge-purple text-xs">{s}</span>
                          ))}
                          {c.skills.length > 4 && (
                            <span className="text-slate-600 text-xs self-center">+{c.skills.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && results === null && (
        <div className="card flex flex-col items-center justify-center py-16 gap-3 border-dashed">
          <Search size={36} className="text-slate-700" />
          <div className="text-center">
            <p className="text-slate-500">Enter a search query to find candidates</p>
            <p className="text-slate-600 text-sm mt-1">Use skills, name, location, or experience filters</p>
          </div>
        </div>
      )}
    </div>
  )
}
