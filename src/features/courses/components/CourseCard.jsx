import React from 'react'
import { CheckCircle2, GraduationCap, Pencil, Users } from 'lucide-react'
import { Badge, Button, Card } from '../../../components/ui'
import { cn } from '../../../lib/utils'
import SessionProgress from './SessionProgress'

const CourseCard = ({ course, enrollment, isStaff, enrolling, onEnroll, onRoster, onEdit }) => {
  const closed = course.active === false
  return (
    <li className="flex">
      <Card padded={false} hover data-reveal className={cn('flex w-full flex-col', closed && 'opacity-75')}>
        <Card.Header>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-marigold-light"><GraduationCap size={24} aria-hidden="true" /></span>
          {closed && <Badge>Closed</Badge>}
        </Card.Header>
        <Card.Body className="flex flex-1 flex-col">
          <h2 className="user-text font-display text-[20px] font-semibold leading-snug text-ink">{course.title}</h2>
          <p className="mt-1 text-[14px] text-ink-muted">{course.sessions} sessions{course.schedule ? ` · ${course.schedule}` : ''}</p>
          {course.description && <p className="user-text mt-3 text-[15px] leading-relaxed text-ink-soft">{course.description}</p>}
          <div className="mt-auto space-y-3 pt-5">
            {enrollment ? (
              enrollment.status === 'completed'
                ? <p className="flex items-center gap-2 font-semibold text-emerald-700"><CheckCircle2 size={18} aria-hidden="true" /> Completed. Jaya!</p>
                : <SessionProgress done={enrollment.sessionsAttended || 0} total={course.sessions || 0} />
            ) : !closed && <Button variant="dark" className="w-full" onClick={onEnroll} loading={enrolling}>Enroll</Button>}
            {isStaff && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={onRoster}><Users size={16} aria-hidden="true" /> Participants</Button>
                <Button variant="secondary" size="sm" onClick={onEdit}><Pencil size={16} aria-hidden="true" /> Edit</Button>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </li>
  )
}

export default CourseCard
