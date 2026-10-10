import React, { useMemo, useState } from 'react'
import { GraduationCap, Plus } from 'lucide-react'
import { Button, Skeleton } from '../../components/ui'
import { EmptyState, Page, PageHeader } from '../../components/common'
import { useAuth } from '../../hooks/useAuth'
import { useFirestore } from '../../hooks/useFirestore'
import { visibleCourses } from './lib/courses'
import { useMyEnrollments } from './hooks/useMyEnrollments'
import { useCourseEditor } from './hooks/useCourseEditor'
import CourseCard from './components/CourseCard'
import CourseFormModal from './components/CourseFormModal'
import RosterModal from './components/RosterModal'

const CoursesPage = () => {
  const { user } = useAuth()
  const isStaff = user?.role === 'admin' || user?.role === 'folks_head'
  const { data: courses, loading } = useFirestore('courses')
  const mine = useMyEnrollments(user)
  const editor = useCourseEditor(user)
  const [roster, setRoster] = useState(null)
  const visible = useMemo(() => visibleCourses([...courses], isStaff), [courses, isStaff])

  return (
    <Page revealKey={loading}>
      <PageHeader
        kicker="Learn"
        title="Courses"
        description="Step-by-step courses on the Bhagavad-gita, meditation and spiritual life."
        actions={isStaff && <Button onClick={() => editor.open('new')}><Plus size={17} aria-hidden="true" /> New course</Button>}
      />

      {mine.error && <p role="alert" data-reveal className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">{mine.error}</p>}

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No courses open right now"
          description={isStaff ? 'Create the first course with “New course”.' : 'New courses are announced here and on WhatsApp.'}
          action={isStaff && <Button onClick={() => editor.open('new')}><Plus size={17} aria-hidden="true" /> New course</Button>}
        />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              enrollment={mine.enrolledBy.get(c.id)}
              isStaff={isStaff}
              enrolling={mine.busy === c.id}
              onEnroll={() => mine.enroll(c)}
              onRoster={() => setRoster(c)}
              onEdit={() => editor.open(c)}
            />
          ))}
        </ul>
      )}

      <CourseFormModal open={!!editor.editing} isNew={editor.editing === 'new'} form={editor.form} onChange={editor.change} onSubmit={editor.save} onClose={editor.close} saving={editor.saving} error={editor.error} />
      <RosterModal course={roster} onClose={() => setRoster(null)} />
    </Page>
  )
}

export default CoursesPage
