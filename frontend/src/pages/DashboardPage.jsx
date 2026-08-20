import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search,
  SlidersHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskFormModal from '../components/TaskFormModal';
import { taskApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'PENDING', label: '⏳ Pending' },
  { value: 'IN_PROGRESS', label: '🔄 In Progress' },
  { value: 'DONE', label: '✅ Done' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priority' },
  { value: 'LOW', label: '🟢 Low' },
  { value: 'MEDIUM', label: '🟡 Medium' },
  { value: 'HIGH', label: '🔴 High' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title' },
];

// ── Skeleton card ─────────────────────────────────────────────────────────────

function TaskCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-2/3" />
      <div className="flex gap-2 mt-2">
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar({ data }) {
  if (!data) return null;
  const tasks = data.data || [];
  const total = data.meta?.total || 0;
  const done = tasks.filter((t) => t.status === 'DONE').length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Total Tasks', value: total, color: 'text-brand-400' },
        { label: 'This Page Done', value: done, color: 'text-emerald-400' },
        { label: 'In Progress', value: inProgress, color: 'text-blue-400' },
        { label: 'Pending', value: tasks.filter((t) => t.status === 'PENDING').length, color: 'text-amber-400' },
      ].map((stat) => (
        <div key={stat.label} className="glass rounded-xl px-4 py-3">
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

/**
 * DashboardPage
 *
 * The main authenticated view. Shows:
 * - Stats bar
 * - Filters: search, status, priority, date range, sort
 * - Task grid (React Query fetched + cached)
 * - Pagination controls
 * - Task form modal (create / edit)
 */
function DashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // ── Filter + pagination state ───────────────────────────────────────────────
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    order: 'desc',
  });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch tasks ─────────────────────────────────────────────────────────────

  const queryParams = {
    page,
    limit: 9,
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['tasks', queryParams],
    queryFn: () => taskApi.getAll(queryParams).then((r) => r.data),
    keepPreviousData: true,
    staleTime: 30_000, // 30 seconds
  });

  // ── Delete mutation ─────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id) => taskApi.delete(id),
    onSuccess: () => {
      toast.success('Task deleted');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => toast.error('Failed to delete task'),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleFilterChange('search', searchInput);
  };

  const openCreateModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(id);
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '', priority: '', startDate: '', endDate: '', sortBy: 'createdAt', order: 'desc' });
    setSearchInput('');
    setPage(1);
  };

  const hasActiveFilters = filters.search || filters.status || filters.priority || filters.startDate || filters.endDate;

  const tasks = data?.data || [];
  const meta = data?.meta;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen gradient-page">
      <Navbar onNewTask={openCreateModal} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            Good day, <span className="text-brand-400">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Here are all your tasks. Stay focused!</p>
        </div>

        {/* Stats */}
        <StatsBar data={data} />

        {/* ── Filters bar ── */}
        <div className="glass rounded-2xl p-4 mb-6 space-y-3">

          {/* Search + toggle filters */}
          <div className="flex gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search tasks by title or description..."
                  className="form-input pl-10 py-2.5"
                />
              </div>
              <button type="submit" className="btn-primary px-4 py-2.5">
                Search
              </button>
            </form>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`btn-ghost px-4 py-2.5 ${showFilters ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : ''}`}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-brand-400 rounded-full" />
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1 border-t border-white/10 animate-fade-in">

              {/* Status */}
              <div>
                <label className="form-label">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="form-input py-2"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="form-label">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="form-input py-2"
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="form-input py-2"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="form-input py-2"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="form-label">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="form-input py-2"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Order + Clear */}
              <div className="flex flex-col justify-between gap-2">
                <div>
                  <label className="form-label">Order</label>
                  <select
                    value={filters.order}
                    onChange={(e) => handleFilterChange('order', e.target.value)}
                    className="form-input py-2"
                  >
                    <option value="desc" className="bg-slate-900">Newest first</option>
                    <option value="asc" className="bg-slate-900">Oldest first</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 transition-colors text-left">
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Task Grid ── */}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <TaskCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-center py-20">
            <AlertTriangle className="mx-auto text-red-400 mb-3" size={40} />
            <p className="text-red-400 font-semibold">Failed to load tasks</p>
            <p className="text-slate-500 text-sm mt-1">{error?.response?.data?.message || 'Please try again.'}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && tasks.length === 0 && (
          <div className="text-center py-24 animate-fade-in">
            <ClipboardList className="mx-auto text-slate-600 mb-4" size={56} />
            <p className="text-slate-300 text-lg font-semibold">
              {hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
            </p>
            <p className="text-slate-500 text-sm mt-2 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or clearing them.'
                : 'Create your first task to get started!'}
            </p>
            {!hasActiveFilters && (
              <button onClick={openCreateModal} className="btn-primary">
                <Plus size={16} />
                Create first task
              </button>
            )}
          </div>
        )}

        {/* Task cards */}
        {!isLoading && tasks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={openEditModal}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost !px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Page number bubbles */}
            <div className="flex gap-1.5">
              {Array.from({ length: meta.lastPage }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.lastPage || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-500 self-center">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200 ${
                        item === page
                          ? 'gradient-brand text-white shadow-lg shadow-brand-500/25'
                          : 'text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
              disabled={page === meta.lastPage}
              className="btn-ghost !px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>

            <span className="text-xs text-slate-500 ml-2">
              {meta.total} task{meta.total !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </main>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
      />

      {/* Mobile FAB */}
      <button
        onClick={openCreateModal}
        className="sm:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full gradient-brand shadow-2xl shadow-brand-500/40 flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition-all"
        title="New Task"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

export default DashboardPage;
