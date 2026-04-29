import { Fragment } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../services/authService';
import NotificationBell from './NotificationBell';
import toast from 'react-hot-toast';

const NAV_LINKS = {
  user: [
    { to: '/user/dashboard', label: 'Dashboard' },
    { to: '/user/reports', label: 'My Reports' },
    { to: '/user/reports/new', label: 'Report Fault' },
  ],
  facility_manager: [
    { to: '/manager/dashboard', label: 'Dashboard' },
    { to: '/manager/issues', label: 'Issues' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/issues', label: 'All Issues' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/reports', label: 'Reports' },
  ],
};

export default function Navbar() {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const links = NAV_LINKS[userProfile?.role] || [];

  // Pick the most specific matching path so nested routes don't highlight multiple tabs.
  const activePath = [...links]
    .sort((a, b) => b.to.length - a.to.length)
    .find((l) => pathname === l.to || pathname.startsWith(`${l.to}/`))?.to;

  const handleLogout = async () => {
    await logoutUser();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-blue-600 font-bold text-lg">FMS</span>
            <span className="hidden sm:block text-gray-500 text-sm">Facility Management</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePath === l.to
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <NotificationBell />

            {/* User menu */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 focus:outline-none">
                <UserCircleIcon className="w-7 h-7 text-gray-500" />
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {userProfile?.name || currentUser?.email}
                </span>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 focus:outline-none z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs text-gray-400 capitalize">{userProfile?.role?.replace('_', ' ')}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{userProfile?.email}</p>
                  </div>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`block w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-50' : ''} text-red-600`}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
}
