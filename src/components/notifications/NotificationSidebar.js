'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  X, 
  Check, 
  CheckCheck, 
  Filter, 
  Trash2, 
  ExternalLink, 
  Bell,
  ClipboardList,
  DollarSign,
  Wrench,
  Home,
  Waves,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Megaphone
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import CustomDropdown from '@/components/ui/CustomDropdown';

export default function NotificationSidebar({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const filterOptions = [
    { value: 'all', label: 'All Notifications' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        ...(filter !== 'all' && { isRead: filter === 'read' ? 'true' : 'false' })
      });
      
      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications?action=mark_all_read', {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        const deletedNotif = notifications.find(n => n._id === notificationId);
        if (deletedNotif && !deletedNotif.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onClose();
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      'booking_request': ClipboardList,
      'payment_received': DollarSign,
      'maintenance_request': Wrench,
      'tenant_checkin': Home,
      'tenant_checkout': Waves,
      'booking_approved': CheckCircle,
      'booking_rejected': XCircle,
      'system_alert': AlertTriangle,
      'general': Megaphone
    };
    
    const IconComponent = iconMap[type] || Megaphone;
    return <IconComponent className="h-4 w-4" />;
  };

  const getIconColor = (type) => {
    const colorMap = {
      'booking_request': 'text-blue-600',
      'payment_received': 'text-green-600',
      'maintenance_request': 'text-orange-600',
      'tenant_checkin': 'text-purple-600',
      'tenant_checkout': 'text-gray-600',
      'booking_approved': 'text-green-600',
      'booking_rejected': 'text-red-600',
      'system_alert': 'text-yellow-600',
      'general': 'text-blue-600'
    };
    
    return colorMap[type] || 'text-gray-600';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'urgent': 'border-l-red-500 bg-red-50',
      'high': 'border-l-orange-500 bg-orange-50',
      'medium': 'border-l-blue-500 bg-blue-50',
      'low': 'border-l-gray-500 bg-gray-50'
    };
    return colors[priority] || colors.medium;
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Now';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-white/30 backdrop-blur-sm bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <CustomDropdown
                options={filterOptions}
                value={filter}
                onChange={setFilter}
                placeholder="Filter notifications"
              />
            </div>
            <button
              onClick={markAllAsRead}
              className="px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 flex items-center"
              title="Mark all as read"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No notifications found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    getPriorityColor(notification.priority)
                  } ${!notification.isRead ? 'bg-blue-50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={getIconColor(notification.type)}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {notification.actionUrl && (
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!notification.isRead) {
                                markAsRead(notification._id);
                              }
                            }}
                            className="text-gray-400 hover:text-green-600"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
