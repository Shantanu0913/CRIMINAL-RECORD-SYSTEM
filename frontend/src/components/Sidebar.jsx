import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineViewGrid, 
  HiOutlineUserGroup, 
  HiOutlineDocumentText, 
  HiOutlineFolder,
  HiOutlineLogout,
  HiOutlineShieldCheck,
  HiOutlineUserCircle,
  HiOutlineCollection,
  HiOutlineScale
} from 'react-icons/hi';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard',   icon: <HiOutlineViewGrid /> },
    { path: '/criminals', label: 'Criminals',   icon: <HiOutlineUserGroup /> },
    { path: '/firs',      label: 'FIR Records', icon: <HiOutlineDocumentText /> },
    { path: '/cases',     label: 'Case Files',  icon: <HiOutlineFolder /> },
    { path: '/evidence',  label: 'Evidence',    icon: <HiOutlineCollection /> },
    { path: '/hearings',  label: 'Hearings',    icon: <HiOutlineScale /> },
    { path: '/roles',     label: 'Roles',       icon: <HiOutlineUserCircle />, adminOnly: true },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || user?.role === 'Admin');

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <HiOutlineShieldCheck className="logo-icon" />
          <div>
            <h2>CRMS</h2>
            <span className="logo-sub">Criminal Records</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name || user?.full_name || 'User'}</span>
            <span className="user-role">{user?.role || 'Officer'}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <HiOutlineLogout />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
