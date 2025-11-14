import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWebSocketURL, createWebSocket } from '../lib/websocket';
import apiClient from '../utils/apiClient';
import { Button } from "./ui/button";
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";

const Chat = () => {
  const { friendId } = useParams();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [user, setUser] = useState(null);
  const [friendInfo, setFriendInfo] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const userIdRef = useRef(null);
  const scrollerRef = useRef(null);
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
        userIdRef.current = userRes.data.id;

        const messagesRes = await apiClient.get(`/messages/${friendId}/`);
        setMessages(messagesRes.data.map(msg => ({
          ...msg,
          displayContent: msg.sender.id === userRes.data.id ? msg.content : msg.translated_content
        })));
      } catch (err) {
        console.error('Error fetching chat data:', err);
        if (err.response?.status === 403) {
          alert('You are not friends with this user. Please send a friend request first.');
          navigate('/users');
        }
      }
    };
    fetchData();

    const fetchFriendInfo = async () => {
      try {
        const friendsRes = await apiClient.get('/friends/');
        const friend = friendsRes.data.find(f => f.id === parseInt(friendId));
        setFriendInfo(friend);
      } catch (err) {
        console.error('Error fetching friend info:', err);
      }
    };
    if (friendId) fetchFriendInfo();

    // WebSocket setup
    const wsUrl = getWebSocketURL('/ws/chat/', token);
    const wsConnection = createWebSocket(
      wsUrl,
      (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.error) {
            console.error('WebSocket error:', data.error);
            alert(`Error: ${data.error}`);
            return;
          }

          if (data.receiver === parseInt(friendId) || data.sender === parseInt(friendId)) {
            const currentUserId = userIdRef.current;
            const displayContent = data.sender === currentUserId ? data.content : (data.translated_content || data.content);

            setMessages(prev => {
              const exists = prev.some(m => m.id === data.id);
              if (exists) return prev;
              return [...prev, { ...data, displayContent }];
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      },
      (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      },
      () => setWsConnected(true),
      (event) => {
        setWsConnected(false);
        if (event.code !== 1000 && event.code !== 1001) {
          console.error('WebSocket closed unexpectedly:', event.code, event.reason);
        }
      }
    );

    wsRef.current = wsConnection;

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [friendId, navigate]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const ws = wsRef.current?.ws();
    if (ws && ws.readyState === WebSocket.OPEN && content.trim()) {
      try {
        ws.send(JSON.stringify({ action: 'send_message', receiver_id: parseInt(friendId), content: content.trim() }));
        setContent('');
      } catch (err) {
        console.error('Error sending message:', err);
        alert('Failed to send message. Please try again.');
      }
    } else if (!content.trim()) {
      alert('Please enter a message');
    } else {
      alert('WebSocket not connected. Please wait or refresh.');
      if (wsRef.current) wsRef.current.reconnect();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-950 dark:to-blue-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-200/50 dark:border-purple-800/50 bg-transparent backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              size="sm"
              className="p-2 text-white hover:bg-purple-800/30"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {friendInfo && (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-purple-300 dark:ring-purple-700">
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white font-medium">
                    {friendInfo.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-white">{friendInfo.username}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
            <span className="text-xs font-medium text-white">
              {wsConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <p className="font-medium mb-1">No messages yet</p>
              <p className="text-sm text-white/70">Start a conversation by sending a message</p>
            </div>
          </div>
        ) : (
          messages.map(msg => {
            const isCurrentUser = msg.sender?.id === user?.id || msg.sender === user?.id;
            const ts = msg.timestamp ? new Date(msg.timestamp) : null;
            const timeStr = ts ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            return (
              <div
                key={msg.id || `${msg.sender}-${msg.timestamp}`}
                className={`flex gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                  <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-purple-200 dark:ring-purple-800">
                    <AvatarFallback className="bg-gray-700 text-white text-xs font-medium">
                      {msg.sender?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="flex flex-col gap-1 max-w-[70%]">
                  <div className="px-4 py-2 rounded-2xl break-words bg-gray-700 text-white shadow-sm">
                    <p className="text-sm leading-relaxed">{msg.displayContent || msg.content}</p>
                  </div>
                  <span className="text-xs text-white/70 px-2">{timeStr}</span>
                </div>

                {isCurrentUser && (
                  <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-purple-200 dark:ring-purple-800">
                    <AvatarFallback className="bg-gray-700 text-white text-xs font-medium">
                      {user?.username?.[0]?.toUpperCase() || 'Y'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-purple-200/50 dark:border-purple-800/50 bg-transparent backdrop-blur-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <div className="flex-1 flex items-center bg-gray-700 rounded-full px-4 py-2">
            <Input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              className="bg-transparent border-0 focus-visible:ring-0 p-0 text-sm placeholder:text-white text-white"
            />
          </div>
          <Button
            onClick={handleSend}
            size="icon"
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full shadow-md hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            disabled={!content.trim() || !wsConnected}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
