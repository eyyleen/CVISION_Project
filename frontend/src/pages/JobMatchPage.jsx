import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Target, Loader2, ChevronDown, AlertCircle, Users, ArrowRight
} from 'lucide-react'
import { getCandidates, matchJob } from '../utils/api'
import JobMatchResult from '../components/JobMatchResult'
import { getInitials } from '../utils/helpers'

const SAMPLE_JDS = [
  {
    label: 'Senior Backend Engineer',
    text: `We are looking for a Senior Backend Engineer with 5+ years of experience.
Requirements:
- Strong proficiency in Python, Django, or FastAPI
- Experience with PostgreSQL, Redis, and message queues
- AWS or GCP cloud infrastructure experience
- Docker and Kubernetes knowledge
- Experience with microservices architecture
- RESTful API design
- Git version control
- Agile/Scrum methodology`
  },
  {
    label: 'Data Scientist',
    text: `We need an experienced Data Scientist to join our AI team.
Requirements:
- Bachelor or Master degree in Computer Science, Statistics, or related field
- 3+ years experience in machine learning and deep learning
- Proficiency in Python, TensorFlow, PyTorch, scikit-learn
- Experience with pandas, numpy, matplotlib
- Knowledge of NLP and computer vision
- SQL and big data tools (Spark, Hadoop)
- Experience with Jupyter, Git
- Strong analytical and problem-solving skills`
  },
  {
    label: 'Full Stack Developer',
    text: `Full Stack Developer for our product team.
Requirements:
- 2+ years experience in web development
- React.js, TypeScript, Node.js
- RESTful API development
- SQL and NoSQL databases (MySQL, MongoDB)
- Docker, Git
- Responsive UI/UX implementation
- Agile development process`
  },
]

export default function JobMatchPage() {
  const [searchParams] = useSearchParams()
  const preselectedId = searchParams.get('candidate')

  const [candidates, setCandidates] = useState([])
  const [selectedId, setSelectedId] = useState(preselectedId || '')
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingCandidates, setLoadingCandidates] = useState(true)

  useEffect(() => {
    getCandidates(0, 500)
      .then(setCandidates)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoadingCandidates(false))
  }, [])

  const handleMatch = async () => {
    if (!selectedId) return toast.error('Please select a candidate.')
    if (!jobTitle.trim()) return toast.error('Please enter a job title.')
    if (!jobDescription.trim() || jobDescription.length < 50)
      return toast.error('Please enter a detailed job description (min 50 chars).')

    setLoading(true)
    setResult(null)
    try {
      const res = await matchJob({
        candidate_id: parseInt(selectedId),
        job_title: jobTitle,
        job_description: jobDescription,
      })
      setResult(res)
      toast.success('Matching complete!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedCandidate = candidates.find((c) => c.id === parseInt(selectedId))

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Job Matching</h2>
        <p className="text-slate-400 text-sm mt-1">
          Compare a candidate's profile against a job description to get an AI-powered match score.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-5">
          {/* Candidate selector */}
          <div className="card p-5 space-y-4">
            <p className="section-title">1. Select Candidate</p>

            {loadingCandidates ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
                <Loader2 size={16} className="animate-spin" />
                Loading candidates...
              </div>
            ) : candidates.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>
                  No candidates yet.{' '}
                  <Link to="/upload" className="underline">Upload a CV first.</Link>
                </span>
              </div>
            ) : (
              <>
                <div className="relative">
                  <select
                    value={selectedId}
                    onChange={(e) => { setSelectedId(e.target.value); setResult(null) }}
                    className="input-field appearance-none pr-10 cursor-pointer"
                  >
                    <option value="">— Select a candidate —</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.years_of_experience}y exp · {c.skills?.length || 0} skills
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>

                {selectedCandidate && (
                  <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-lg border border-slate-700/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {getInitials(selectedCandidate.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 font-medium text-sm">{selectedCandidate.name}</p>
                      <p className="text-slate-500 text-xs">
                        {selectedCandidate.years_of_experience}y exp ·{' '}
                        {selectedCandidate.skills?.slice(0, 3).join(', ')}
                        {selectedCandidate.skills?.length > 3 && ` +${selectedCandidate.skills.length - 3} more`}
                      </p>
                    </div>
                    <Link
                      to={`/candidates/${selectedCandidate.id}`}
                      className="text-slate-500 hover:text-blue-400 transition-colors"
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Job description */}
          <div className="card p-5 space-y-4">
            <p className="section-title">2. Job Description</p>

            <div>
              <label className="label mb-1.5 block">Job Title</label>
              <input
                className="input-field"
                placeholder="e.g. Senior Backend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            {/* Sample JD templates */}
            <div>
              <label className="label mb-1.5 block">Quick Templates</label>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_JDS.map((jd) => (
                  <button
                    key={jd.label}
                    onClick={() => { setJobTitle(jd.label); setJobDescription(jd.text) }}
                    className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                  >
                    {jd.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label mb-1.5 block">Description</label>
              <textarea
                className="input-field resize-none h-52 text-sm"
                placeholder="Paste the full job description here including requirements, responsibilities, and qualifications..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <p className="text-slate-600 text-xs mt-1">{jobDescription.length} characters</p>
            </div>

            <button
              onClick={handleMatch}
              disabled={loading || !selectedId || !jobTitle || !jobDescription}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing match...
                </>
              ) : (
                <>
                  <Target size={18} />
                  Analyze Job Match
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Result */}
        <div>
          {result ? (
            <div className="card">
              <div className="card-header">
                <h3 className="section-title flex items-center gap-2">
                  <Target size={18} className="text-blue-400" />
                  Match Analysis: {jobTitle}
                </h3>
                {result.candidate && (
                  <p className="text-slate-500 text-sm mt-0.5">
                    for {result.candidate.name}
                  </p>
                )}
              </div>
              <div className="card-body">
                <JobMatchResult result={result} />
              </div>
            </div>
          ) : (
            <div className="card h-full min-h-[400px] flex items-center justify-center border-dashed">
              <div className="text-center space-y-3 px-8">
                <div className="w-16 h-16 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center">
                  <Target size={28} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Match results will appear here</p>
                  <p className="text-slate-600 text-sm mt-1">
                    Select a candidate and enter a job description
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
