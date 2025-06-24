"use client";
import { useState } from "react";

const NoteCard = ({ note, onEdit, onDelete, isEditing = false }) => {
  const [editForm, setEditForm] = useState({
    title: note.title,
    content: note.content,
    category: note.category,
    priority: note.priority
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      alert("Title and content are required");
      return;
    }

    setIsLoading(true);
    try {
      await onEdit(note._id, editForm);
    } catch (error) {
      console.error("Failed to update note:", error);
      alert("Failed to update note. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      title: note.title,
      content: note.content,
      category: note.category,
      priority: note.priority
    });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    setIsLoading(true);
    try {
      await onDelete(note._id);
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert("Failed to delete note. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      pros: 'bg-green-100 text-green-800',
      cons: 'bg-red-100 text-red-800',
      visit: 'bg-blue-100 text-blue-800',
      research: 'bg-purple-100 text-purple-800',
      comparison: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.general;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || colors.medium;
  };

  if (isEditing) {
    return (
      <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Note title"
            value={editForm.title}
            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isLoading}
          />
          <select
            value={editForm.category}
            onChange={(e) => setEditForm({...editForm, category: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="general">General</option>
            <option value="pros">Pros</option>
            <option value="cons">Cons</option>
            <option value="visit">Visit Notes</option>
            <option value="research">Research</option>
            <option value="comparison">Comparison</option>
          </select>
        </div>
        <textarea
          placeholder="Write your note here..."
          value={editForm.content}
          onChange={(e) => setEditForm({...editForm, content: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 mb-4"
          required
          disabled={isLoading}
        />
        <div className="flex justify-between items-center">
          <select
            value={editForm.priority}
            onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-gray-900 text-lg">{note.title}</h4>
        <div className="flex gap-2">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getCategoryColor(note.category)}`}>
            {note.category}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(note.priority)}`}>
            {note.priority}
          </span>
        </div>
      </div>
      
      <p className="text-gray-700 mb-3 leading-relaxed">{note.content}</p>
      
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">
          {new Date(note.createdAt).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(note._id, null, true)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard; 