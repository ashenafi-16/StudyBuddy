import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, BookOpen, Clock, ArrowRight,
  Calendar, FolderOpen, Timer, TrendingUp,
  Zap, Target, Award
} from "lucide-react";

import { fetchDashboard, fetchAnalytics } from "../api/dashboardApi";
import { fetchGroups, type StudyGroup } from "../api/groupsApi";
import { Loading, ErrorMessage } from "../components/common/LoadingError";

// Stats Card Component
const StatCard = ({ icon: Icon, label, value, color, gradient }: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  gradient: string;
}) => (
  <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} p-6 rounded-2xl border border-slate-700/50 group hover:scale-[1.02] transition-all duration-300`}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
    <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <p className="text-slate-300 text-sm font-medium mb-1">{label}</p>
    <p className="text-3xl font-bold text-white">{value}</p>
  </div>
);

// Quick Action Card
const QuickActionCard = ({ icon: Icon, title, description, to, color, bgColor }: {
  icon: any;
  title: string;
  description: string;
  to: string;
  color: string;
  bgColor: string;
}) => (
  <Link
    to={to}
    className="bg-[#1e293b] p-5 rounded-2xl border border-slate-700/50 hover:border-slate-500 transition-all group flex items-center gap-4"
  >
    <div className={`w-14 h-14 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
      <Icon className={`w-7 h-7 ${color}`} />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-white font-semibold mb-1 group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-slate-400 text-sm truncate">{description}</p>
    </div>
    <ArrowRight className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" size={20} />
  </Link>
);

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [recentGroups, setRecentGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setRecentGroups(groups.slice(0, 4));
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

  const userName = dashboardData?.user_profile?.first_name || dashboardData?.user_profile?.full_name?.split(' ')[0] || 'Student';

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-3xl p-8 border border-slate-700/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">👋</span>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Welcome back, {userName}!
              </h1>
            </div>
            <p className="text-slate-300 text-lg max-w-2xl">
              Ready to boost your learning? Let's make today productive.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/planner"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all backdrop-blur-sm"
              >
                <Calendar size={18} />
                View Schedule
              </Link>
              <Link
                to="/pomodoro"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25"
              >
                <Timer size={18} />
                Start Focus Session
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Study Groups"
            value={recentGroups.length}
            color="text-blue-400"
            gradient="from-blue-900/40 to-blue-800/20"
          />
          <StatCard
            icon={BookOpen}
            label="Study Hours"
            value={analyticsData?.study_hours || "0h"}
            color="text-purple-400"
            gradient="from-purple-900/40 to-purple-800/20"
          />
          <StatCard
            icon={Clock}
            label="Sessions Today"
            value={dashboardData?.stats?.sessions_today || 0}
            color="text-emerald-400"
            gradient="from-emerald-900/40 to-emerald-800/20"
          />
          <StatCard
            icon={Target}
            label="Sessions Completed"
            value={dashboardData?.stats?.sessions_completed || 0}
            color="text-orange-400"
            gradient="from-orange-900/40 to-orange-800/20"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Quick Actions & Groups */}
          <div className="lg:col-span-2 space-y-6">

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="text-yellow-400" size={24} />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickActionCard
                  icon={Calendar}
                  title="Study Planner"
                  description="Schedule your sessions"
                  to="/planner"
                  color="text-blue-400"
                  bgColor="bg-blue-500/20"
                />
                <QuickActionCard
                  icon={FolderOpen}
                  title="Resources"
                  description="Upload & share materials"
                  to="/resources"
                  color="text-purple-400"
                  bgColor="bg-purple-500/20"
                />
                <QuickActionCard
                  icon={Timer}
                  title="Pomodoro Timer"
                  description="Focus with timed sessions"
                  to="/pomodoro"
                  color="text-red-400"
                  bgColor="bg-red-500/20"
                />
                <QuickActionCard
                  icon={Users}
                  title="Study Groups"
                  description="Join or create groups"
                  to="/groups"
                  color="text-emerald-400"
                  bgColor="bg-emerald-500/20"
                />
              </div>
            </div>

            {/* Recent Groups */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="text-blue-400" size={24} />
                  Your Study Groups
                </h2>
                <Link to="/groups" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  View All <ArrowRight size={16} />
                </Link>
              </div>

              {recentGroups.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentGroups.map((group) => (
                    <Link
                      key={group.id}
                      to={`/groups/${group.id}`}
                      className="bg-[#1e293b] p-5 rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                          {group.group_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate group-hover:text-blue-400 transition-colors">
                            {group.group_name}
                          </h3>
                          <p className="text-slate-400 text-sm line-clamp-2 mt-1">
                            {group.group_description || "No description"}
                          </p>
                          <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {group.member_count || 0} members
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-[#1e293b] rounded-2xl border border-slate-700/50">
                  <Users size={48} className="mx-auto text-slate-600 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No groups yet</h3>
                  <p className="text-slate-400 mb-4">Join or create a study group to get started!</p>
                  <Link
                    to="/groups"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
                  >
                    Browse Groups
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Activity & Tips */}
          <div className="space-y-6">

            {/* Today's Progress */}
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-emerald-400" size={20} />
                Today's Progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Study Sessions</span>
                    <span className="text-white font-medium">0/4</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Focus Time</span>
                    <span className="text-white font-medium">0h/2h</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Resources Reviewed</span>
                    <span className="text-white font-medium">0/5</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Study Tips */}
            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-2xl border border-slate-700/50 p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Award className="text-yellow-400" size={20} />
                Study Tip
              </h3>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-slate-300 text-sm leading-relaxed">
                  💡 <strong className="text-white">Pomodoro Technique:</strong> Work in 25-minute focused sessions with 5-minute breaks. After 4 sessions, take a longer 15-minute break.
                </p>
              </div>
              <Link
                to="/pomodoro"
                className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 mt-4"
              >
                Try it now <ArrowRight size={14} />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}