import React from 'react'
import { CheckSquare } from 'lucide-react'
import { cn } from '../ui/Card'

const TaskItem = ({ label, done }) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-saffron/5">
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors",
        done ? 'bg-saffron border-saffron text-white' : 'border-gray-200'
      )}>
        {done && <CheckSquare size={12} />}
      </div>
      <span className={cn(
        "text-sm",
        done ? 'text-gray-400 line-through' : 'font-medium'
      )}>
        {label}
      </span>
    </div>
  )
}

export default TaskItem
