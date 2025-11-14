import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getWebSocketURL, createWebSocket } from '../lib/websocket';
import apiClient from '../utils/apiClient';
import { LogOut, Users, UserPlus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const wsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const userRes = await apiClient.get('/me/');
        setUser(userRes.data);

        const friendsRes = await apiClient.get('/friends/');
        setFriends(friendsRes.data);

        const requestsRes = await apiClient.get('/friend-requests/');
        setFriendRequests(requestsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchData();

    const wsUrl = getWebSocketURL('/ws/chat/', token);
    const wsConnection = createWebSocket(
      wsUrl,
      (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'friend_request') {
            setNotifications(prev => [...prev, {
              id: Date.now(),
              message: `${data.from_user.username} sent you a friend request`,
              fromUser: data.from_user,
              friendshipId: data.friendship_id
            }]);
            fetchData();
          }
        } catch (err) {
          console.error('Error parsing notification:', err);
        }
      },
      (error) => console.error('WebSocket error:', error),
      () => console.log('WebSocket connected for notifications'),
      (event) => console.log('WebSocket closed:', event.code)
    );

    wsRef.current = wsConnection;

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [navigate]);

  const handleLogout = () => {
    if (wsRef.current) wsRef.current.close();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const handleAcceptRequest = async (friendshipId, fromUserId) => {
    try {
      await apiClient.post(`/friend-request/${fromUserId}/`);
      setNotifications(prev => prev.filter(n => n.friendshipId !== friendshipId));
      const friendsRes = await apiClient.get('/friends/');
      setFriends(friendsRes.data);
      const requestsRes = await apiClient.get('/friend-requests/');
      setFriendRequests(requestsRes.data);
      alert('Friend request accepted!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept friend request');
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!user) {
    return <div className="container py-4 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-950 dark:to-blue-950">
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-200/50 dark:border-purple-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              LingoBridge
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-purple-300 dark:ring-purple-700">
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-xs font-medium">
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white">{user.username}</span>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-purple-900/30"
            >
              <LogOut className="w-4 h-4"/>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-purple-200/50 dark:border-purple-800/50 rounded-xl shadow-sm">
            <div className="p-4 border-b border-purple-200/50 dark:border-purple-800/50">
              <h3 className="font-semibold text-white text-base">
                Friend Requests ({notifications.length})
              </h3>
            </div>
            <div className="divide-y divide-purple-200/50 dark:divide-purple-800/50">
              {notifications.map((notif) => (
                <div key={notif.id} className="flex items-center justify-between p-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-purple-200 dark:ring-purple-800">
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white font-medium">
                        {notif.fromUser.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">{notif.fromUser.username}</p>
                      <p className="text-xs text-white">wants to be your friend</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleAcceptRequest(notif.friendshipId, notif.fromUser.id)} size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium px-4 py-1.5 rounded-lg text-sm shadow-md">Accept</Button>
                    <Button onClick={() => dismissNotification(notif.id)} variant="ghost" size="sm" className="text-white hover:text-purple-400 px-4 py-1.5">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="mb-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-purple-200/50 dark:border-purple-800/50 rounded-xl shadow-sm">
          <div className="p-6 flex items-center gap-6 mb-6">
            <Avatar className="h-20 w-20 ring-4 ring-purple-200 dark:ring-purple-800">
              <AvatarFallback className="bg-gradient-to-br from-purple-400 via-pink-500 to-blue-500 text-white text-2xl font-medium">{user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-light text-white mb-2">{user.username}</h2>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="font-semibold text-white">{friends.length}</span>
                  <span className="text-white ml-1">friends</span>
                </div>
                <div>
                  <span className="text-white">{user.preferred_language.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <Link to="/users">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium px-4 py-2 rounded-lg shadow-md">Find Users</Button>
            </Link>
          </div>
        </div>

        {/* Pending Friend Requests */}
        {friendRequests.length > 0 && (
          <div className="mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-purple-200/50 dark:border-purple-800/50 rounded-xl shadow-sm">
            <div className="p-4 border-b border-purple-200/50 dark:border-purple-800/50">
              <h3 className="font-semibold text-white text-base">
                Pending Friend Requests ({friendRequests.length})
              </h3>
            </div>
            <div className="divide-y divide-purple-200/50 dark:divide-purple-800/50">
              {friendRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-purple-200 dark:ring-purple-800">
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white font-medium">{request.from_user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{request.from_user.username}</p>
                      <p className="text-xs text-white truncate">{request.from_user.email}</p>
                    </div>
                  </div>
                  <Button onClick={() => handleAcceptRequest(request.id, request.from_user.id)} size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium px-4 py-1.5 rounded-lg text-sm shadow-md">Accept</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-purple-200/50 dark:border-purple-800/50 rounded-xl shadow-sm">
          <div className="p-4 border-b border-purple-200/50 dark:border-purple-800/50">
            <h3 className="font-semibold text-white text-base">
              Your Friends ({friends.length})
            </h3>
          </div>
          {friends.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <Users className="w-8 h-8 text-white"/>
              </div>
              <p className="text-white mb-4">You don't have any friends yet.</p>
              <Link to="/users">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium px-4 py-2 rounded-lg shadow-md">
                  <UserPlus className="w-4 h-4 mr-2"/>
                  Find Users to Connect
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-purple-200/50 dark:divide-purple-800/50">
              {friends.map((friend) => (
                <div key={friend.id} onClick={() => navigate(`/chat/${friend.id}`)} className="flex items-center justify-between p-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-purple-200 dark:ring-purple-800">
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white font-medium">{friend.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{friend.username}</p>
                      <p className="text-xs text-white truncate">{friend.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-white hover:text-purple-400 font-medium" onClick={(e) => { e.stopPropagation(); navigate(`/chat/${friend.id}`); }}>
                    Message
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
