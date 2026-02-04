import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import GroupAnalytics from '../components/groups/GroupAnalytics';

export default function GroupAnalyticsPage() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="p-4 sm:p-6 lg:p-8">
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
        </div>
    );
}
