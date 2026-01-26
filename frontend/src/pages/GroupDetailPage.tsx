import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import GroupDetail from '../components/groups/GroupDetail';

export default function GroupDetailPage() {
    return (
        <div className="flex h-screen bg-[#0f172a] overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />

                <main className="flex-1 overflow-y-auto scrollbar-hide">
                    <GroupDetail />
                </main>
            </div>
        </div>
    );
}
