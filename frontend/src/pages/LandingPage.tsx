import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Users, MessageCircle, Timer, Calendar, FolderOpen,
  ArrowRight, BookOpen, Sparkles, Shield, Zap
} from "lucide-react";

const features = [
  {
    icon: <Users className="w-7 h-7" />,
    title: "Study Groups",
    description: "Create or join groups, collaborate with peers, and stay accountable together.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: <MessageCircle className="w-7 h-7" />,
    title: "Real-Time Chat",
    description: "Message your study partners instantly with WebSocket-powered conversations.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: <Timer className="w-7 h-7" />,
    title: "Pomodoro Timer",
    description: "Focus with shared Pomodoro sessions. Stay productive with timed work sprints.",
    gradient: "from-red-500 to-orange-500",
  },
  {
    icon: <Calendar className="w-7 h-7" />,
    title: "Study Planner",
    description: "Schedule sessions, set reminders, and never miss a study date.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: <FolderOpen className="w-7 h-7" />,
    title: "Resource Library",
    description: "Upload, share, and organize study materials with your groups.",
    gradient: "from-amber-500 to-yellow-500",
  },
  {
    icon: <Sparkles className="w-7 h-7" />,
    title: "Premium Access",
    description: "Unlock advanced features, custom themes, and analytics with a subscription.",
    gradient: "from-indigo-500 to-violet-500",
  },
];

const steps = [
  {
    number: "01",
    title: "Create or Join a Group",
    description: "Find study partners or invite your own. Set goals and start learning together.",
    icon: <Users className="w-6 h-6" />,
  },
  {
    number: "02",
    title: "Plan & Focus",
    description: "Schedule study sessions, share resources, and use Pomodoro timers to stay focused.",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    number: "03",
    title: "Track & Grow",
    description: "Monitor your progress, earn streaks, and celebrate achievements as you study.",
    icon: <Shield className="w-6 h-6" />,
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white overflow-hidden">
      {/* ── Navbar ────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-shadow">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              StudyBuddy
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-medium text-sm transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-slate-300 hover:text-white font-medium text-sm transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-medium text-sm transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative pt-20 pb-32 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-gradient-to-t from-cyan-500/5 to-transparent rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            The platform for focused students
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Study Smarter,
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Together.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            StudyBuddy brings your study group online — with real-time chat, shared Pomodoro timers,
            a study planner, resource library, and progress tracking all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? "/dashboard" : "/signup"}
              className="group px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-2xl font-semibold text-lg transition-all shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center gap-2"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started Now"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-semibold text-lg transition-all text-slate-300 hover:text-white"
              >
                I already have an account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to study better
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Powerful tools designed to help you stay focused, organized, and collaborative.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl transition-all duration-300"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg opacity-90 group-hover:opacity-100 transition-opacity`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-[#0d1420]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Get started in 3 simple steps
            </h2>
            <p className="text-slate-400 text-lg">From signup to productive study sessions in minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative text-center group">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center group-hover:border-cyan-500/40 transition-colors">
                  <span className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/15 rounded-3xl p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to boost your productivity?
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Join students who are studying smarter together. Simple, powerful, and collaborative.
            </p>
            <Link
              to={isAuthenticated ? "/dashboard" : "/signup"}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-2xl font-semibold text-lg transition-all shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started Today"}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <BookOpen className="w-4 h-4" />
            <span>© {new Date().getFullYear()} StudyBuddy. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
