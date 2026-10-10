export const EMPTY_COURSE = { title: '', description: '', sessions: 6, schedule: '', active: true }

export const courseToForm = (c) => ({
  title: c.title || '', description: c.description || '', sessions: c.sessions || 6, schedule: c.schedule || '', active: c.active !== false,
})

/** Open courses first, then A to Z. Members never see closed ones. */
export const visibleCourses = (courses, isStaff) => courses
  .filter((c) => isStaff || c.active !== false)
  .sort((a, b) => Number(b.active !== false) - Number(a.active !== false) || String(a.title).localeCompare(String(b.title)))

/** Returns { data } ready to write, or { error }. */
export const validateCourse = (form) => {
  const sessions = parseInt(form.sessions, 10)
  if (!form.title.trim() || !Number.isInteger(sessions) || sessions < 1 || sessions > 100) return { error: 'Add a title and between 1 and 100 sessions.' }
  return { data: { title: form.title.trim(), description: form.description.trim(), sessions, schedule: form.schedule.trim(), active: !!form.active } }
}

export const percent = (done, total) => (total ? Math.min(100, Math.round((done / total) * 100)) : 0)
