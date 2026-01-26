import { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import GroupsList from '../components/groups/GroupsList';
import NewGroupModal from '../components/NewGroupModel';

export default function Groups() {
    const [showModal, setShowModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleCreateSuccess = () => {
        setRefreshKey(prev => prev + 1); // Trigger refresh of groups list
    };

    return (
        <div className="flex h-screen bg-[#0f172a] overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-hide">
                    <div className="max-w-7xl mx-auto">
                        <GroupsList
                            key={refreshKey}
                            onCreateClick={() => setShowModal(true)}
                        />
                    </div>
                </main>
            </div>

            {showModal && (
                <NewGroupModal
                    onClose={() => setShowModal(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
}
