import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * MainLayout - Fixed sidebar layout that persists across all protected pages
 * The sidebar stays fixed on the left while content changes on the right
 */
export default function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[#0f172a] overflow-hidden relative">
            {/* Fixed Sidebar - Always visible on desktop, drawer on mobile */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navbar */}
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

                {/* Page Content - Scrollable */}
                <main className="flex-1 overflow-y-auto scrollbar-hide">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
