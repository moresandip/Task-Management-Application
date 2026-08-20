import { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, MapPin, Calendar, AlignLeft, Tag, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { taskApi } from '../services/api';

// ── Select component ──────────────────────────────────────────────────────────

function FormSelect({ label, id, value, onChange, options }) {
  return (
    <div>
      <label htmlFor={id} className="form-label">{label}</label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="form-input cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

/**
 * TaskFormModal
 *
 * A slide-up modal for creating and editing tasks.
 * Submits as multipart/form-data to support optional file attachments.
 *
 * Props:
 *   isOpen    - Whether the modal is visible
 *   onClose   - Called when the modal should close
 *   taskToEdit - If provided, the form pre-fills with this task's data (edit mode)
 */
function TaskFormModal({ isOpen, onClose, taskToEdit }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const isEditMode = Boolean(taskToEdit);

  // ── Form state ──────────────────────────────────────────────────────────────

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: '',
    location: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDragging, setFileDragging] = useState(false);

  // Pre-fill form when editing an existing task
  useEffect(() => {
    if (taskToEdit) {
      setForm({
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        status: taskToEdit.status || 'PENDING',
        priority: taskToEdit.priority || 'MEDIUM',
        dueDate: taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : '',
        location: taskToEdit.location || '',
      });
    } else {
      setForm({ title: '', description: '', status: 'PENDING', priority: 'MEDIUM', dueDate: '', location: '' });
    }
    setSelectedFile(null);
  }, [taskToEdit, isOpen]);

  // ── Mutations ───────────────────────────────────────────────────────────────

  const onSuccess = (message) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    onClose();
  };

  const onError = (error) => {
    toast.error(error.response?.data?.message || 'Something went wrong. Try again.');
  };

  const createMutation = useMutation({
    mutationFn: (formData) => taskApi.create(formData),
    onSuccess: () => onSuccess('Task created! Check your email for a confirmation.'),
    onError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => taskApi.update(id, formData),
    onSuccess: () => onSuccess('Task updated successfully!'),
    onError,
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileSelect = (file) => {
    if (file) setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setFileDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    // Build FormData for multipart submission
    const formData = new FormData();
    formData.append('title', form.title.trim());
    if (form.description) formData.append('description', form.description.trim());
    formData.append('status', form.status);
    formData.append('priority', form.priority);
    if (form.dueDate) formData.append('dueDate', form.dueDate);
    if (form.location) formData.append('location', form.location.trim());
    if (selectedFile) formData.append('attachment', selectedFile);

    if (isEditMode) {
      updateMutation.mutate({ id: taskToEdit._id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up border border-white/15">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEditMode ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditMode ? 'Update the task details below' : 'Fill in the details to create your task'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Title */}
          <div>
            <label htmlFor="task-title" className="form-label">
              <AlignLeft size={11} className="inline mr-1" />Title *
            </label>
            <input
              id="task-title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="What needs to be done?"
              className="form-input"
              maxLength={120}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className="form-label">Description</label>
            <textarea
              id="task-desc"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Add more details about this task..."
              rows={3}
              className="form-input resize-none"
              maxLength={1000}
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Status"
              id="task-status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              options={[
                { value: 'PENDING', label: '⏳ Pending' },
                { value: 'IN_PROGRESS', label: '🔄 In Progress' },
                { value: 'DONE', label: '✅ Done' },
              ]}
            />
            <FormSelect
              label="Priority"
              id="task-priority"
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
              options={[
                { value: 'LOW', label: '🟢 Low' },
                { value: 'MEDIUM', label: '🟡 Medium' },
                { value: 'HIGH', label: '🔴 High' },
              ]}
            />
          </div>

          {/* Due Date + Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-duedate" className="form-label">
                <Calendar size={11} className="inline mr-1" />Due Date
              </label>
              <input
                id="task-duedate"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="task-location" className="form-label">
                <MapPin size={11} className="inline mr-1" />Location
              </label>
              <input
                id="task-location"
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Mumbai"
                className="form-input"
              />
            </div>
          </div>

          {/* Location weather hint */}
          {form.location && (
            <p className="text-xs text-sky-400/70 flex items-center gap-1.5 -mt-3">
              <AlertCircle size={11} />
              Live weather for "{form.location}" will be fetched and shown on the card.
            </p>
          )}

          {/* File Upload */}
          <div>
            <label className="form-label">
              <Upload size={11} className="inline mr-1" />Attachment
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors
                ${fileDragging ? 'border-brand-500 bg-brand-500/10' : 'border-white/15 hover:border-white/30 hover:bg-white/5'}`}
              onDragOver={(e) => { e.preventDefault(); setFileDragging(true); }}
              onDragLeave={() => setFileDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-brand-400 font-medium">
                  <Upload size={16} />
                  {selectedFile.name}
                  <span className="text-slate-500 font-normal">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ) : taskToEdit?.fileUrl ? (
                <div className="text-sm text-slate-400">
                  <Upload size={16} className="inline mr-2 text-brand-400" />
                  Current file attached — upload a new one to replace it
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  <Upload size={18} className="mx-auto mb-2 text-slate-400" />
                  Drag & drop or <span className="text-brand-400 font-medium">browse</span>
                  <div className="text-xs mt-1">PNG, JPG, GIF, PDF, DOCX up to 10MB</div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {isEditMode ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Save Changes' : 'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskFormModal;
