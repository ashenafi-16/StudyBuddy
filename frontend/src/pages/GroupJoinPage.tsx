import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupService } from '../services/group.service';
import { toast } from 'react-hot-toast';
import { Users, AlertCircle } from 'lucide-react';

const GroupJoinPage = () => {
    const { groupId, token } = useParams<{ groupId: string; token: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleJoin = async () => {
        if (!groupId || !token) return;
        setLoading(true);
        try {
            await groupService.joinViaLink(groupId, token);
            toast.success("Successfully joined the group!");
            navigate(`/groups/${groupId}`);
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.error || "Invalid or expired invitation link.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 max-w-md w-full text-center shadow-xl space-y-6">
                <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-indigo-500/10">
                    <Users className="w-10 h-10 text-indigo-400" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Join Study Group</h1>
                    <p className="text-gray-400">
                        You've been invited to join a study group. Click the button below to accept the invitation.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-left">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-200">{error}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={handleJoin}
                        disabled={loading || !!error}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Joining..." : "Accept Invitation"}
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupJoinPage;
