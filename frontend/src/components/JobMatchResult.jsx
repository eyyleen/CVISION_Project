import { getScoreColor, getScoreLabel, getScoreBgColor } from '../utils/helpers'

function ScoreRing({ score }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const filled = (score / 100) * circumference
  const empty = circumference - filled

  const strokeColor =
    score >= 80 ? '#10b981' :
    score >= 60 ? '#3b82f6' :
    score >= 40 ? '#f59e0b' :
    '#ef4444'

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg viewBox="0 0 96 96" className="w-28 h-28 -rotate-90">
        <circle
          cx="48" cy="48" r={radius}
          fill="none" stroke="#1e293b" strokeWidth="8"
        />
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${empty}`}
          strokeDashoffset="0"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</span>
      </div>
    </div>
  )
}

export default function JobMatchResult({ result }) {
  if (!result) return null

  const { match_score, matched_skills, missing_skills, score_breakdown } = result

  const breakdown = [
    { label: 'Text Similarity', value: score_breakdown?.text_similarity || 0, color: 'bg-blue-500' },
    { label: 'Skill Match', value: score_breakdown?.skill_match || 0, color: 'bg-purple-500' },
    { label: 'Experience', value: score_breakdown?.experience_match || 0, color: 'bg-emerald-500' },
    { label: 'Education', value: score_breakdown?.education_match || 0, color: 'bg-amber-500' },
  ]

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Score header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
        <ScoreRing score={match_score} />
        <div className="text-center sm:text-left">
          <p className="text-slate-400 text-sm">Match Score</p>
          <p className={`text-3xl font-bold mt-1 ${getScoreColor(match_score)}`}>
            {match_score}%
          </p>
          <p className={`text-sm font-medium mt-1 ${getScoreColor(match_score)}`}>
            {getScoreLabel(match_score)}
          </p>
        </div>
      </div>

      {/* Score breakdown */}
      <div>
        <p className="label mb-3">Score Breakdown</p>
        <div className="space-y-3">
          {breakdown.map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{label}</span>
                <span className="text-slate-400 font-mono">{value}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-700`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Matched skills */}
      {matched_skills?.length > 0 && (
        <div>
          <p className="label mb-2.5">✓ Matched Skills ({matched_skills.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {matched_skills.map((skill) => (
              <span key={skill} className="badge badge-green">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Missing skills */}
      {missing_skills?.length > 0 && (
        <div>
          <p className="label mb-2.5">⚠ Skill Gaps ({missing_skills.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {missing_skills.map((skill) => (
              <span key={skill} className="badge badge-red">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {matched_skills?.length === 0 && missing_skills?.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-4">
          No skill keywords detected in the job description.
        </p>
      )}
    </div>
  )
}
