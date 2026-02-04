import React, { useState } from 'react';
import { X, Users } from 'lucide-react';
import { createGroup } from '../../api/groupsApi'; // We have this!
import { useNavigate } from 'react-router-dom';

interface NewGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: () => void;
}

const NewGroupModal: React.FC<NewGroupModalProps> = ({ isOpen, onClose, onCreate }) => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('study_buddy');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');

            await createGroup({
                group_name: name,
                group_description: description,
                group_type: type,
                max_members: 10, // default
                is_public: true
            });

            onCreate();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="text-emerald-400" size={24} />
                    New Study Group
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Group Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Calculus 101"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-emerald-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this group about?"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-emerald-500 min-h-[80px]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-emerald-500"
                        >
                            <option value="study_buddy">Study Buddy</option>
                            <option value="academic">Academic</option>
                            <option value="project">Project</option>
                            <option value="exam_prep">Exam Prep</option>
                        </select>
                    </div>

                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewGroupModal;
