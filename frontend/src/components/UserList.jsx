import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { Search, Users, ArrowLeft } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = debouncedSearch ? { search: debouncedSearch } : {};
        const response = await apiClient.get('/users/', { params });
        setUsers(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [debouncedSearch]);

  const handleSendRequest = async (userId) => {
    try {
      const response = await apiClient.post(`/friend-request/${userId}/`);
      const message = response.data.message || 'Friend request sent';
      setUsers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, has_pending_request: true, request_sent_by_me: true } : user
        )
      );
      alert(message);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send friend request.');
    }
  };

  const handleChat = (friendId) => navigate(`/chat/${friendId}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-950 dark:to-blue-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-200/50 dark:border-purple-800/50 bg-transparent backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4 text-white">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            size="sm"
            className="p-2 text-white hover:bg-purple-800/30"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Find Users
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
            <Input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-700 text-white border border-gray-600 focus:border-purple-400 focus-visible:ring-0 rounded-lg"
            />
          </div>
          {loading && (
            <p className="text-sm text-white/70 mt-2 px-3">Searching...</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Users List */}
        <div className="bg-gray-700/80 backdrop-blur-lg border border-gray-600 rounded-xl shadow-sm">
          {users.length === 0 && !loading ? (
            <div className="text-center py-16 text-white">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <p className="text-white/70">
                {debouncedSearch
                  ? 'No users found. Try a different search term.'
                  : 'Start searching to find users to connect with'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-600/50">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-gray-600">
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white font-medium">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                      <p className="text-xs text-white/70 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {user.is_friend ? (
                      <Button
                        onClick={() => handleChat(user.id)}
                        variant="ghost"
                        size="sm"
                        className="text-white/90 hover:text-white font-medium"
                      >
                        Message
                      </Button>
                    ) : user.has_pending_request ? (
                      <span className="text-sm text-white/70">
                        {user.request_sent_by_me ? 'Request Sent' : 'Pending'}
                      </span>
                    ) : (
                      <Button
                        onClick={() => handleSendRequest(user.id)}
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-4 py-1.5 rounded-lg text-sm shadow-md"
                      >
                        Follow
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserList;
