import { useState } from 'react';
import GroupsList from '../components/groups/GroupsList';
import NewGroupModal from '../components/NewGroupModel';

export default function Groups() {
    const [showModal, setShowModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleCreateSuccess = () => {
        setRefreshKey(prev => prev + 1); // Trigger refresh of groups list
    };

    return (
        <div className="p-4 sm:p-6 lg:p-10 min-h-full bg-[#0f172a] animate-in fade-in duration-500">
            <div className="max-w-[1400px] mx-auto">
                <GroupsList
                    key={refreshKey}
                    onCreateClick={() => setShowModal(true)}
                />
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
