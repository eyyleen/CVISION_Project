import {
  Mail, Phone, MapPin, Briefcase,
  GraduationCap, Code, Globe
} from 'lucide-react'
import { formatDate, getExperienceLabel, skillCategoryColors, getInitials, truncate } from '../utils/helpers'
import { analyzeSkills } from '../utils/api'
import { useEffect, useState } from 'react'

function Section({ title, icon: Icon, children, empty }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-blue-400" />
        <h3 className="section-title text-base">{title}</h3>
      </div>
      {empty ? (
        <p className="text-slate-500 text-sm italic pl-6">No data extracted</p>
      ) : (
        <div className="pl-6">{children}</div>
      )}
    </div>
  )
}

export default function CandidateCard({ candidate, compact = false }) {
  const [skillsData, setSkillsData] = useState(null)

  useEffect(() => {
    if (!compact && candidate?.id) {
      analyzeSkills(candidate.id)
        .then(setSkillsData)
        .catch(() => {})
    }
  }, [candidate?.id, compact])

  if (!candidate) return null

  const expLabel = getExperienceLabel(candidate.years_of_experience || 0)
  const initials = getInitials(candidate.name)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg shadow-blue-600/20">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-100 truncate">{candidate.name}</h2>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {candidate.years_of_experience > 0 && (
              <span className="badge badge-blue">
                <Briefcase size={10} className="mr-1" />
                {candidate.years_of_experience}y exp · {expLabel}
              </span>
            )}
            {candidate.file_type && (
              <span className="badge badge-purple uppercase">{candidate.file_type}</span>
            )}
            <span className="text-slate-500 text-xs">{formatDate(candidate.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {candidate.email && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Mail size={14} className="text-slate-600 shrink-0" />
            <span className="truncate">{candidate.email}</span>
          </div>
        )}
        {candidate.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Phone size={14} className="text-slate-600 shrink-0" />
            <span>{candidate.phone}</span>
          </div>
        )}
        {candidate.location && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MapPin size={14} className="text-slate-600 shrink-0" />
            <span>{candidate.location}</span>
          </div>
        )}
        {candidate.languages?.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Globe size={14} className="text-slate-600 shrink-0" />
            <span>{candidate.languages.slice(0, 3).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {candidate.summary && (
        <div className="bg-slate-800/60 rounded-lg p-4 text-sm text-slate-300 leading-relaxed border border-slate-700/50">
          {truncate(candidate.summary, 300)}
        </div>
      )}

      {/* Skills */}
      <Section
        title={`Skills ${candidate.skills?.length ? `(${candidate.skills.length})` : ''}`}
        icon={Code}
        empty={!candidate.skills?.length}
      >
        {skillsData ? (
          <div className="space-y-3">
            {Object.entries(skillsData.categorized_skills).map(([cat, skills]) => (
              <div key={cat}>
                <p className="text-xs text-slate-500 mb-1.5 font-medium">{cat}</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span key={skill} className={skillCategoryColors[cat] || 'badge-blue'}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {candidate.skills?.map((skill) => (
              <span key={skill} className="badge badge-blue">{skill}</span>
            ))}
          </div>
        )}
      </Section>

      {/* Education */}
      {!compact && (
        <Section
          title="Education"
          icon={GraduationCap}
          empty={!candidate.education?.length}
        >
          <div className="space-y-3">
            {candidate.education?.map((edu, i) => (
              <div key={i} className="border-l-2 border-blue-600/40 pl-4 py-0.5">
                <p className="text-slate-200 font-medium text-sm">{edu.institution}</p>
                {edu.degree && (
                  <p className="text-blue-400 text-xs mt-0.5">{edu.degree}{edu.field ? ` — ${edu.field}` : ''}</p>
                )}
                {(edu.start_year || edu.end_year) && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    {edu.start_year}{edu.end_year && edu.end_year !== edu.start_year ? ` – ${edu.end_year}` : ''}
                    {edu.gpa && ` · GPA ${edu.gpa}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Experience */}
      {!compact && (
        <Section
          title="Work Experience"
          icon={Briefcase}
          empty={!candidate.experience?.length}
        >
          <div className="space-y-4">
            {candidate.experience?.map((exp, i) => (
              <div key={i} className="border-l-2 border-indigo-600/40 pl-4 py-0.5">
                <p className="text-slate-200 font-medium text-sm">
                  {exp.title || exp.company}
                </p>
                {exp.title && exp.company && exp.title !== exp.company && (
                  <p className="text-slate-400 text-xs mt-0.5">{exp.company}</p>
                )}
                {(exp.start_date || exp.end_date) && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    {exp.start_date}{exp.end_date && exp.end_date !== exp.start_date ? ` – ${exp.end_date}` : ''}
                    {exp.is_current && <span className="ml-1 text-emerald-400">(Current)</span>}
                  </p>
                )}
                {exp.description && (
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                    {truncate(exp.description, 200)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
