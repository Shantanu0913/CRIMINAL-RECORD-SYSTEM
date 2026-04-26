import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import WireframeBackground from './WireframeBackground';
import { HiOutlineMenuAlt2 } from 'react-icons/hi';

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <div className={`app-layout ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
      <WireframeBackground />
      
      {/* Floating Toggle Button (Hamburger) */}
      <button 
        className="sidebar-toggle-btn" 
        onClick={toggleSidebar}
        title={isSidebarOpen ? "Hide Menu" : "Show Menu"}
      >
        <HiOutlineMenuAlt2 />
      </button>

      <Sidebar isOpen={isSidebarOpen} />
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
