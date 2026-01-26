import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, BookOpen, Clock, Activity, ArrowRight,
  MessageSquare
} from "lucide-react";
import Sidebar from "../components/common/Sidebar";
import Navbar from "../components/common/Navbar";

import { fetchDashboard, fetchAnalytics } from "../api/dashboardApi";
import { fetchGroups, type StudyGroup } from "../api/groupsApi";
import { Loading, ErrorMessage } from "../components/common/LoadingError";

// Helper Component for Stats
const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [recentGroups, setRecentGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);


  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const [dash, analytics, groups] = await Promise.all([
          fetchDashboard(token),
          fetchAnalytics(token),
          fetchGroups()
        ]);

        setDashboardData(dash);
        setAnalyticsData(analytics);
        setRecentGroups(groups.slice(0, 3)); // Show only 3 recent groups
      } catch (err: any) {
        console.error("Dashboard load error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar user_profile={dashboardData?.user_profile} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {dashboardData?.user_profile?.full_name || 'Student'}! 👋
                </h1>
                <p className="text-slate-400">Here's what's happening with your study groups today.</p>
              </div>
              {/* <Link
                to="/groups/create"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus size={20} />
                <span>New Group</span>
              </Link> */}
              
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Active Groups"
                value={recentGroups.length || 0}
                trend={12}
                color="bg-blue-500"
              />
              <StatCard
                icon={BookOpen}
                label="Study Hours"
                value={analyticsData?.study_hours || "0h"}
                trend={8}
                color="bg-purple-500"
              />
              <StatCard
                icon={MessageSquare}
                label="Messages"
                value={dashboardData?.stats?.total_messages || 0}
                trend={-2}
                color="bg-emerald-500"
              />
              <StatCard
                icon={Activity}
                label="Tasks Pending"
                value={dashboardData?.stats?.pending_tasks || 0}
                color="bg-orange-500"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left Column: Recent Groups */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="text-blue-400" size={24} />
                    Recent Groups
                  </h2>
                  <Link to="/groups" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    View All <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="grid gap-4">
                  {recentGroups.length > 0 ? (
                    recentGroups.map((group) => (
                      <div key={group.id} className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all group cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {group.group_name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                                {group.group_name}
                              </h3>
                              <p className="text-slate-400 text-sm line-clamp-1">
                                {group.group_description || "No description"}
                              </p>
                            </div>
                          </div>
                          <div className="flex -space-x-2">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-[#1e293b] flex items-center justify-center text-xs text-white">
                                ?
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            Active 2m ago
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {group.member_count || 0} members
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 bg-[#1e293b] rounded-xl border border-slate-700/50">
                      <Users size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No groups joined yet.</p>
                      <Link to="/groups/create" className="text-blue-400 hover:underline mt-2 inline-block">
                        Create one?
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Chat Preview */}
              <div className="lg:col-span-1">
                <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden h-[600px] flex flex-col">
                  <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <MessageSquare className="text-emerald-400" size={20} />
                      Quick Chat
                    </h3>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-8 text-center">
                    <div>
                      <MessageSquare size={48} className="mx-auto text-slate-600 mb-4" />
                      <p className="text-slate-400 mb-4">Access your messages and collaborate with your study groups.</p>
                      <Link to="/chat" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                        Open Messages
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}