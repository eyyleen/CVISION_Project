import { clsx } from 'clsx'

export const cn = (...classes) => clsx(...classes)

export const formatDate = (dateString) => {
  if (!dateString) return '—'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString))
  } catch {
    return dateString
  }
}

export const formatDateShort = (dateString) => {
  if (!dateString) return '—'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
    }).format(new Date(dateString))
  } catch {
    return dateString
  }
}

export const getScoreColor = (score) => {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-blue-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-red-400'
}

export const getScoreBgColor = (score) => {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

export const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent Match'
  if (score >= 60) return 'Good Match'
  if (score >= 40) return 'Partial Match'
  return 'Low Match'
}

export const getExperienceLabel = (years) => {
  if (years === 0) return 'Fresh Graduate'
  if (years <= 1) return 'Entry Level'
  if (years <= 3) return 'Junior'
  if (years <= 5) return 'Mid-Level'
  if (years <= 10) return 'Senior'
  return 'Expert'
}

export const truncate = (text, maxLength = 100) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export const skillCategoryColors = {
  'Programming Languages': 'badge-blue',
  'Web Technologies': 'badge-purple',
  'Databases': 'badge-green',
  'Cloud & DevOps': 'badge-amber',
  'Data & AI/ML': 'badge-red',
  'Tools & Methods': 'badge-blue',
  'Other': 'badge-green',
}

export const CHART_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
]
