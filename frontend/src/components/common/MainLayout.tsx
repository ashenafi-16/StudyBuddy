import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * MainLayout - Fixed sidebar layout that persists across all protected pages
 * The sidebar stays fixed on the left while content changes on the right
 */
export default function MainLayout() {
    return (
        <div className="flex h-screen bg-[#0f172a] overflow-hidden">
            {/* Fixed Sidebar - Always visible */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navbar */}
                <Navbar />

                {/* Page Content - Scrollable */}
                <main className="flex-1 overflow-y-auto scrollbar-hide">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
