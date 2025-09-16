'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Settings, User, Bell, Shield, Database } from 'lucide-react';

export default function SettingsPage() {
  const [adminName, setAdminName] = useState('Administrator');
  const [email, setEmail] = useState('admin@saphireapartments.com');
  const [notifications, setNotifications] = useState({
    maintenance: true,
    payments: true,
    sms: false
  });

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Settings className="h-6 w-6 text-purple-600 mr-2" />
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Settings Menu</h3>
              <nav className="space-y-2">
                <a href="#profile" className="flex items-center p-2 text-purple-600 bg-purple-50 rounded-lg">
                  <User className="h-4 w-4 mr-2" />
                  Profile Settings
                </a>
                <a href="#notifications" className="flex items-center p-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </a>
                <a href="#security" className="flex items-center p-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </a>
                <a href="#backup" className="flex items-center p-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Database className="h-4 w-4 mr-2" />
                  Backup & Data
                </a>
              </nav>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={notifications.maintenance}
                    onChange={() => handleNotificationChange('maintenance')}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Email notifications for new maintenance requests</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={notifications.payments}
                    onChange={() => handleNotificationChange('payments')}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Email notifications for payment reminders</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={notifications.sms}
                    onChange={() => handleNotificationChange('sms')}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                  />
                  <span className="ml-2 text-sm text-gray-700">SMS notifications for urgent matters</span>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
              <div className="space-y-4">
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Change Password
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Update Access Code
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Two-Factor Authentication
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
