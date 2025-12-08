'use client';

import { useState, useMemo } from 'react';
import { Search, Info, Download } from 'lucide-react';

interface UserActivity {
  email: string;
  name: string;
  sessions: number;
  pageViews: number;
  primaryTool: string;
  lastActive: string;
}

interface UserTableProps {
  users: UserActivity[];
  excludeDevsLabel?: boolean;
  onExportCSV?: () => void;
}

export function UserTable({ users, excludeDevsLabel = false, onExportCSV }: UserTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      user => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    );
  }, [searchQuery, users]);

  return (
    <div className="lg:col-span-3">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-medium text-gray-900"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            User Activity
          </h2>
          <p className="text-sm text-gray-500">
            Users ranked by total page views
            {excludeDevsLabel && (
              <span className="text-amber-600 ml-1">(dev users hidden)</span>
            )}
          </p>
        </div>
        {onExportCSV && (
          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Export user data to CSV"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00f0db] focus:border-transparent"
              aria-label="Search users"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Sessions
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Page Views
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  <span
                    className="inline-flex items-center gap-1 cursor-help"
                    title="Page views divided by sessions"
                  >
                    Pages/Session
                    <Info className="w-3 h-3 text-gray-400" aria-hidden="true" />
                  </span>
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Primary Tool
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {searchQuery ? 'No users match your search' : 'No user data available'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {user.sessions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {user.pageViews.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {(user.pageViews / user.sessions).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.primaryTool}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.lastActive}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Skeleton version for loading state
export function UserTableSkeleton() {
  return (
    <div className="lg:col-span-3">
      <div className="mb-6">
        <div className="h-6 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
        <div className="p-4 border-b border-gray-100">
          <div className="h-10 bg-gray-100 rounded-lg" />
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-48 bg-gray-100 rounded" />
                </div>
                <div className="h-4 w-12 bg-gray-200 rounded" />
                <div className="h-4 w-12 bg-gray-200 rounded" />
                <div className="h-4 w-10 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
