import { useState } from 'react';
import {
  Calendar,
  MapPin,
  Paperclip,
  Trash2,
  Pencil,
  MoreVertical,
  Clock,
  Flag,
} from 'lucide-react';
import WeatherBadge from './WeatherBadge';

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_PILL = {
  PENDING: 'pill-pending',
  IN_PROGRESS: 'pill-in-progress',
  DONE: 'pill-done',
};

const STATUS_LABEL = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const PRIORITY_PILL = {
  LOW: 'pill-low',
  MEDIUM: 'pill-medium',
  HIGH: 'pill-high',
};

// ── Date formatting ───────────────────────────────────────────────────────────

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });

  let urgency = 'text-slate-400';
  if (diffDays < 0) urgency = 'text-red-400 font-semibold';
  else if (diffDays <= 2) urgency = 'text-orange-400 font-semibold';
  else if (diffDays <= 7) urgency = 'text-yellow-400';

  return { formatted, urgency, isOverdue: diffDays < 0 };
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * TaskCard
 * Displays a single task in a glassmorphism card.
 * Provides edit and delete action buttons.
 */
function TaskCard({ task, onEdit, onDelete, isDeleting }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dueDate = formatDueDate(task.dueDate);

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3 hover:border-white/20 transition-all duration-300 animate-fade-in group relative">

      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-base leading-snug text-white group-hover:text-brand-300 transition-colors truncate ${task.status === 'DONE' ? 'line-through text-slate-400' : ''}`}>
            {task.title}
          </h3>
        </div>

        {/* Three-dot menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <MoreVertical size={15} />
          </button>

          {menuOpen && (
            <>
              {/* Click-outside overlay */}
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 glass rounded-xl py-1 min-w-[130px] border border-white/15 animate-scale-in shadow-xl">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(task); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Pencil size={14} />
                  Edit task
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(task._id); }}
                  disabled={isDeleting}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Description ── */}
      {task.description && (
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
          {task.description}
        </p>
      )}

      {/* ── Badges row: status + priority ── */}
      <div className="flex flex-wrap gap-2">
        <span className={STATUS_PILL[task.status] || 'pill-pending'}>
          {STATUS_LABEL[task.status] || task.status}
        </span>
        <span className={`flex items-center gap-1 ${PRIORITY_PILL[task.priority] || 'pill-medium'}`}>
          <Flag size={10} />
          {task.priority}
        </span>
      </div>

      {/* ── Meta row: location, weather, due date ── */}
      <div className="flex flex-wrap gap-2 mt-auto pt-1">
        {task.location && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin size={12} className="text-rose-400 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{task.location}</span>
          </div>
        )}

        {task.weather && (
          <WeatherBadge weather={task.weather} />
        )}

        {dueDate && (
          <div className={`flex items-center gap-1 text-xs ${dueDate.urgency}`}>
            <Clock size={12} className="flex-shrink-0" />
            <span>{dueDate.isOverdue ? 'Overdue · ' : ''}{dueDate.formatted}</span>
          </div>
        )}
      </div>

      {/* ── Attachment link ── */}
      {task.fileUrl && (
        <a
          href={task.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors w-fit"
        >
          <Paperclip size={12} />
          View attachment
        </a>
      )}
    </div>
  );
}

export default TaskCard;
