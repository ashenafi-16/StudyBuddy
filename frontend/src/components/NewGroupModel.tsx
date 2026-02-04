import { useState } from "react";
import { X, Users, Lock, Globe } from "lucide-react";
import { createGroup } from "../api/groupsApi";
import type { CreateGroupRequest, GroupType } from "../types/groups";

interface NewGroupModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewGroupModal({ onClose, onSuccess }: NewGroupModalProps) {
  const [formData, setFormData] = useState<CreateGroupRequest>({
    group_name: "",
    group_description: "",
    group_type: "academic",
    max_members: 10,
    is_public: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.group_name.trim()) {
      setError("Group name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createGroup(formData);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] text-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold">Create Study Group</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Group Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.group_name}
              onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
              placeholder="e.g., Advanced Calculus Study Group"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Group Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Group Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'academic', label: 'Academic', icon: '📚' },
                { value: 'project', label: 'Project', icon: '💻' },
                { value: 'exam_prep', label: 'Exam Prep', icon: '📝' },
                { value: 'study_buddy', label: 'Study Buddy', icon: '👥' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, group_type: type.value as GroupType })}
                  className={`p-4 rounded-lg border-2 transition-all ${formData.group_type === type.value
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                    }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="font-semibold">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.group_description}
              onChange={(e) => setFormData({ ...formData, group_description: e.target.value })}
              placeholder="Describe your group's purpose and goals..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Max Members */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Maximum Members
            </label>
            <div className="flex items-center gap-3">
              <Users size={20} className="text-slate-400" />
              <input
                type="number"
                min="2"
                max="100"
                value={formData.max_members}
                onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 10 })}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Minimum 2, Maximum 100</p>
          </div>

          {/* Privacy Setting */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Privacy
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_public: true })}
                className={`p-4 rounded-lg border-2 transition-all ${formData.is_public
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
              >
                <Globe className="mx-auto mb-2" size={24} />
                <div className="font-semibold">Public</div>
                <div className="text-xs text-slate-400 mt-1">Anyone can join</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_public: false })}
                className={`p-4 rounded-lg border-2 transition-all ${!formData.is_public
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
              >
                <Lock className="mx-auto mb-2" size={24} />
                <div className="font-semibold">Private</div>
                <div className="text-xs text-slate-400 mt-1">Invite only</div>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
