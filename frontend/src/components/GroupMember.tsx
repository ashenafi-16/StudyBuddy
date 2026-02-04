import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, UserPlus, Shield, Crown, Trash2 } from "lucide-react";
import {
  fetchGroupMembers,
  addGroupMember,
  updateGroupMember,
  fetchGroupDetail
} from "../api/groupsApi";
import type { GroupMember, StudyGroupDetail } from "../types/groups";
import { Loading, ErrorMessage } from "./common/LoadingError";
import Sidebar from "./common/Sidebar";
import Navbar from "./common/Navbar";

export default function GroupMembers() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<StudyGroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emailToAdd, setEmailToAdd] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupData, membersData] = await Promise.all([
        fetchGroupDetail(Number(id)),
        fetchGroupMembers(Number(id))
      ]);
      setGroup(groupData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!emailToAdd.trim()) {
      alert("Please enter an email");
      return;
    }

    try {
      setActionLoading(-1);
      await addGroupMember({
        group_id: Number(id),
        user_email: emailToAdd
      });
      setEmailToAdd("");
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.user_email?.[0] || "Error adding member");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromote = async (memberId: number, currentRole: string) => {
    const newRole = currentRole === 'member' ? 'moderator' : 'admin';

    try {
      setActionLoading(memberId);
      await updateGroupMember(memberId, { role: newRole });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error updating role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (memberId: number, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the group?`)) return;

    try {
      setActionLoading(memberId);
      await updateGroupMember(memberId, { is_active: false });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error removing member");
    } finally {
      setActionLoading(null);
    }
  };

  const canManage = group?.user_role === 'admin' || group?.user_role === 'moderator';

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;
  if (!group) return <ErrorMessage error="Group not found" />;

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-hide">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <Link
              to={`/groups/${id}`}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Group</span>
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {group.group_name} - Members ({members.length})
              </h1>
              <p className="text-slate-400">Manage group members and roles</p>
            </div>

            {/* Add Member Section (Admin/Moderator only) */}
            {canManage && (
              <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <UserPlus className="text-blue-400" size={24} />
                  <h2 className="text-xl font-semibold text-white">Add Member</h2>
                </div>

                <div className="flex gap-3">
                  <input
                    type="email"
                    value={emailToAdd}
                    onChange={(e) => setEmailToAdd(e.target.value)}
                    placeholder="Enter user's email address"
                    className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    onClick={handleAddMember}
                    disabled={actionLoading === -1}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    {actionLoading === -1 ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-5 bg-[#1e293b] rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all"
                >
                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        member.user.profile_pic_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.full_name)}&background=random`
                      }
                      alt={member.user.full_name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-700"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg text-white">
                          {member.user.full_name || "Unnamed User"}
                        </p>
                        {member.role === 'admin' && <Crown size={16} className="text-yellow-400" />}
                        {member.role === 'moderator' && <Shield size={16} className="text-purple-400" />}
                      </div>
                      <p className="text-slate-400 text-sm">{member.user.email}</p>
                      <p className="text-slate-500 text-xs mt-1">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Role Badge and Actions */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-semibold ${member.role === "admin"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : member.role === "moderator"
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}
                    >
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>

                    {/* Admin Controls */}
                    {canManage && member.role !== 'admin' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePromote(member.id, member.role)}
                          disabled={actionLoading === member.id}
                          className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
                        >
                          Promote
                        </button>
                        <button
                          onClick={() => handleRemove(member.id, member.user.full_name)}
                          disabled={actionLoading === member.id}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border border-red-500/30"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {members.length === 0 && (
                <div className="text-center py-16 bg-[#1e293b] rounded-2xl border border-slate-700/50">
                  <p className="text-slate-500">No members found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
