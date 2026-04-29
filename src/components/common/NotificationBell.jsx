import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../contexts/NotificationContext';
import { markAsRead, markAllAsRead } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const { notifications, unreadCount } = useNotifications();
  const { currentUser } = useAuth();

  const handleMarkAll = async () => {
    if (currentUser) await markAllAsRead(currentUser.uid);
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none">
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 focus:outline-none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-sm text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <CheckIcon className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">No notifications</p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <Menu.Item key={n.id}>
                  {({ active }) => (
                    <div
                      onClick={() => !n.read && markAsRead(n.id)}
                      className={`px-4 py-3 cursor-pointer border-b border-gray-50 last:border-0 ${
                        active ? 'bg-gray-50' : ''
                      } ${!n.read ? 'bg-blue-50/50' : ''}`}
                    >
                      <p className={`text-sm ${!n.read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {n.message}
                      </p>
                      {n.createdAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  )}
                </Menu.Item>
              ))
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
