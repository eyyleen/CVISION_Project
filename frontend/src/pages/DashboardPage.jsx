import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, TrendingUp, Star, Upload,
  ArrowRight, BarChart2, Brain
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts'
import { getDashboardStats } from '../utils/api'
import { formatDate, CHART_COLORS } from '../utils/helpers'

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', border: 'border-blue-500/20' },
    green: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
    amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400', border: 'border-amber-500/20' },
  }
  const c = colors[color] || colors.blue

  return (
    <div className={`stat-card border ${c.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="label">{label}</p>
          <p className="text-3xl font-bold text-slate-100 mt-2">{value ?? '—'}</p>
          {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon size={22} className={c.icon} />
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-slate-200 font-medium">{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Brain size={40} className="text-slate-600" />
        <div className="text-center">
          <p className="text-slate-300 font-medium">Could not connect to API</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
          <p className="text-slate-600 text-xs mt-2">Make sure the backend is running on port 8000</p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          Retry
        </button>
      </div>
    )
  }

  const topSkillsData = stats?.top_skills?.slice(0, 10).map(s => ({
    name: s.skill,
    count: s.count,
  })) || []

  const skillsDistData = Object.entries(stats?.skills_distribution || {}).map(([name, value]) => ({
    name, value
  }))

  const expDistData = Object.entries(stats?.experience_distribution || {}).map(([name, value]) => ({
    name, value
  }))

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome banner */}
      {stats?.total_candidates === 0 && (
        <div className="card p-6 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-blue-500/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <Brain size={24} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-100 font-semibold text-lg">Welcome to CVision!</h3>
              <p className="text-slate-400 text-sm mt-1">
                Start by uploading your first CV to see AI-powered extraction and analytics in action.
              </p>
            </div>
            <Link to="/upload" className="btn-primary shrink-0">
              <Upload size={16} />
              Upload CV
            </Link>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Candidates"
          value={stats?.total_candidates ?? 0}
          sub="Profiles extracted"
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. Experience"
          value={`${stats?.avg_experience ?? 0}y`}
          sub="Across all candidates"
          color="green"
        />
        <StatCard
          icon={Star}
          label="Unique Skills"
          value={stats?.top_skills?.length ?? 0}
          sub="Skills detected"
          color="purple"
        />
        <StatCard
          icon={BarChart2}
          label="Skill Categories"
          value={Object.keys(stats?.skills_distribution || {}).length}
          sub="Technology areas"
          color="amber"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top skills bar chart */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="section-title">Top 10 Skills</h3>
            <span className="text-xs text-slate-500">by frequency</span>
          </div>
          <div className="card-body">
            {topSkillsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topSkillsData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis
                    dataKey="name" type="category"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-600 text-sm">
                Upload CVs to see skill data
              </div>
            )}
          </div>
        </div>

        {/* Experience distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Experience Distribution</h3>
          </div>
          <div className="card-body">
            {expDistData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={expDistData} margin={{ top: 0, right: 10, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Candidates" radius={[4, 4, 0, 0]}>
                    {expDistData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-600 text-sm">
                No experience data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills category pie + Recent uploads */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Skills by Category</h3>
          </div>
          <div className="card-body">
            {skillsDistData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={skillsDistData}
                    cx="50%" cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: '#475569' }}
                  >
                    {skillsDistData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-slate-600 text-sm">
                No skills data yet
              </div>
            )}
          </div>
        </div>

        {/* Recent uploads */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="section-title">Recent Uploads</h3>
            <Link to="/candidates" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="card-body">
            {stats?.recent_uploads?.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_uploads.map((u) => (
                  <Link
                    key={u.id}
                    to={`/candidates/${u.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-blue-400">
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-medium truncate group-hover:text-white">
                        {u.name}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {u.skills_count} skills · {formatDate(u.created_at)}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-slate-700 group-hover:text-slate-400 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Upload size={32} className="text-slate-700" />
                <div className="text-center">
                  <p className="text-slate-500 text-sm">No candidates yet</p>
                  <Link to="/upload" className="text-blue-400 hover:text-blue-300 text-sm mt-1 inline-block">
                    Upload your first CV →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
