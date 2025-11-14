import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { Search, UserPlus, Check, Clock, Users, MessageSquare } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

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
        console.error('Error fetching users:', err);
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
      
      // Update the user's status in the list
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, has_pending_request: true, request_sent_by_me: true }
            : user
        )
      );
      
      // Show success message
      alert(message);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to send friend request. Please try again.';
      alert(errorMsg);
    }
  };

  const handleChat = (friendId) => {
    navigate(`/chat/${friendId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg ring-2 ring-primary/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Find Users
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Discover and connect with others</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline" 
            size="sm"
            className="bg-transparent hover:bg-muted/50 border-2 hover:border-primary/50 transition-all duration-200"
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Card */}
        <Card className="mb-6 border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Search className="w-4 h-4 text-white" />
              </div>
              Search Users
            </CardTitle>
            <CardDescription>
              Find users by username or email. Results are sorted by relevance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by username or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            {loading && (
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            )}
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Users List */}
        <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                  <Users className="w-4 h-4 text-white" />
                </div>
                {debouncedSearch ? `Search Results` : 'All Users'}
              </span>
              <Badge variant="outline" className="font-semibold">{users.length}</Badge>
            </CardTitle>
            <CardDescription>
              {users.length === 0
                ? debouncedSearch
                  ? 'No users found matching your search'
                  : 'Start typing to search for users'
                : 'Click on a user to send a friend request or chat'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {debouncedSearch
                    ? 'No users found. Try a different search term.'
                    : 'Start searching to find users to connect with'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 hover:border-primary/50 transition-all duration-200 group shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="h-11 w-11 flex-shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-base">
                          {user.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {user.preferred_language && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {user.preferred_language.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {user.is_friend ? (
                        <>
                          <Badge variant="outline" className="gap-1">
                            <Check className="w-3 h-3" />
                            Friend
                          </Badge>
                          <Button
                            onClick={() => handleChat(user.id)}
                            size="sm"
                            className="gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                            variant="default"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Chat
                          </Button>
                        </>
                      ) : user.has_pending_request ? (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="w-3 h-3" />
                          {user.request_sent_by_me ? 'Request Sent' : 'Pending'}
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => handleSendRequest(user.id)}
                          size="sm"
                          className="gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                          variant="default"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Add Friend
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserList;
