import React from 'react'
import { ChevronDown, ChevronUp, ListOrdered, Plus, Trash2 } from 'lucide-react'
import { Input, Textarea } from '../../../../components/ui/Field'
import Button from '../../../../components/ui/Button'
import EmptyState from '../../../../components/common/EmptyState'
import { IconButton } from '../FormBits'
import { useEditor } from './EditorContext'

const ItinerarySection = () => {
  const { form, itinerary } = useEditor()
  const days = form.itinerary || []

  return (
    <>
      {days.length === 0 && (
        <EmptyState icon={ListOrdered} title="No days yet" description="Build the day-by-day plan devotees see on the trip page." className="py-8" />
      )}

      {days.map((day, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-line bg-paper/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number" min={1} value={day.day} aria-label={`Day number for entry ${i + 1}`}
              onChange={(e) => itinerary.update(i, 'day', e.target.value)}
              className="w-20 shrink-0 text-center font-semibold"
            />
            <Input
              value={day.title} placeholder="Arrival & Mangala Aarti" aria-label={`Title for day ${i + 1}`}
              onChange={(e) => itinerary.update(i, 'title', e.target.value)}
              className="min-w-0 flex-1 basis-[11rem]"
            />
            <div className="ml-auto flex shrink-0 gap-1">
              <IconButton aria-label={`Move day ${i + 1} up`} disabled={i === 0} onClick={() => itinerary.move(i, -1)}><ChevronUp size={16} /></IconButton>
              <IconButton aria-label={`Move day ${i + 1} down`} disabled={i === days.length - 1} onClick={() => itinerary.move(i, 1)}><ChevronDown size={16} /></IconButton>
              <IconButton tone="danger" aria-label={`Remove day ${i + 1}`} onClick={() => itinerary.remove(i)}><Trash2 size={15} /></IconButton>
            </div>
          </div>
          <Textarea
            rows={2} value={day.details} placeholder="Temples visited, prasadam, evening programme…"
            aria-label={`Details for day ${i + 1}`} onChange={(e) => itinerary.update(i, 'details', e.target.value)}
            className="min-h-[72px] resize-none"
          />
        </div>
      ))}

      <Button type="button" variant="soft" className="w-full" onClick={itinerary.add}><Plus size={16} /> Add day</Button>
    </>
  )
}

export default ItinerarySection
