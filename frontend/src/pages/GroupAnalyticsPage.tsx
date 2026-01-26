import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import GroupAnalytics from '../components/groups/GroupAnalytics';

export default function GroupAnalyticsPage() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="flex h-screen bg-[#0f172a] overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-hide">
                    <div className="max-w-7xl mx-auto">
                        <Link
                            to={`/groups/${id}`}
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Back to Group</span>
                        </Link>

                        <GroupAnalytics />
                    </div>
                </main>
            </div>
        </div>
    );
}
