import { useEffect, useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell
} from 'recharts'
import { getDashboardStats } from '../utils/api'
import { CHART_COLORS } from '../utils/helpers'
import { BarChart2, Loader2, Brain } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-medium" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (!stats || stats.total_candidates === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Brain size={40} className="text-slate-600" />
        <div className="text-center">
          <p className="text-slate-300 font-medium">No analytics data yet</p>
          <p className="text-slate-500 text-sm mt-1">Upload CVs to generate analytics</p>
        </div>
      </div>
    )
  }

  const skillsData = stats.top_skills?.slice(0, 12) || []
  const expData = Object.entries(stats.experience_distribution || {}).map(([name, value]) => ({ name, value }))
  const catData = Object.entries(stats.skills_distribution || {}).map(([name, value]) => ({ name, value }))
  const locationData = stats.candidates_by_location?.slice(0, 8) || []

  // Radar chart for skill categories
  const radarData = Object.entries(stats.skills_distribution || {}).map(([name, value]) => ({
    category: name.split(' ')[0],
    count: value,
  }))

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Analytics</h2>
        <p className="text-slate-400 text-sm mt-1">
          Detailed visualizations of candidate pool and skill landscape.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Candidates', value: stats.total_candidates, color: 'text-blue-400' },
          { label: 'Avg Experience', value: `${stats.avg_experience}y`, color: 'text-emerald-400' },
          { label: 'Unique Skills', value: stats.top_skills?.length || 0, color: 'text-purple-400' },
          { label: 'Skill Categories', value: Object.keys(stats.skills_distribution || {}).length, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="label">{label}</p>
            <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Top skills */}
      <div className="card">
        <div className="card-header">
          <h3 className="section-title">Top Skills Frequency</h3>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillsData} margin={{ top: 5, right: 20, bottom: 30, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="skill"
                tick={{ fill: '#64748b', fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]}>
                {skillsData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two charts side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Skill categories radar */}
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Skill Category Distribution</h3>
          </div>
          <div className="card-body">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: '#475569', fontSize: 9 }} />
                  <Radar
                    name="Skills"
                    dataKey="count"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-600 text-sm">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Experience distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Experience Level Breakdown</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={expData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Candidates" radius={[4, 4, 0, 0]}>
                  {expData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Location chart */}
      {locationData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Candidates by Location</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={locationData} layout="vertical" margin={{ left: 10, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  dataKey="location" type="category"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Candidates" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Skill categories table */}
      <div className="card">
        <div className="card-header">
          <h3 className="section-title">Skills by Category</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {catData.map(({ name, value }, i) => (
              <div key={name} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                <div
                  className="w-2 h-2 rounded-full mb-2"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <p className="text-slate-300 text-sm font-medium">{name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{value} unique skills</p>
                <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((value / Math.max(...catData.map(d => d.value), 1)) * 100, 100)}%`,
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
