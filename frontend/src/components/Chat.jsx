import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWebSocketURL, createWebSocket } from '../lib/websocket';
import apiClient from '../utils/apiClient';
import { Button } from "./ui/button";
import { ArrowLeft, Send, Wifi, WifiOff } from 'lucide-react';
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
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

    // Fetch friend info
    const fetchFriendInfo = async () => {
      try {
        const friendsRes = await apiClient.get('/friends/');
        const friend = friendsRes.data.find(f => f.id === parseInt(friendId));
        setFriendInfo(friend);
      } catch (err) {
        console.error('Error fetching friend info:', err);
      }
    };
    if (friendId) {
      fetchFriendInfo();
    }

    // Setup WebSocket connection with retry logic
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

          // ✅ Fixed duplication issue here
          if (data.receiver === parseInt(friendId) || data.sender === parseInt(friendId)) {
            const currentUserId = userIdRef.current;
            const displayContent =
              data.sender === currentUserId
                ? data.content
                : (data.translated_content || data.content);

            setMessages(prev => {
              // prevent duplicates by checking unique message id
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
      () => {
        setWsConnected(true);
      },
      (event) => {
        setWsConnected(false);
        if (event.code !== 1000 && event.code !== 1001) {
          console.error('WebSocket closed unexpectedly:', event.code, event.reason);
        }
      }
    );

    wsRef.current = wsConnection;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [friendId, navigate]);

  // Scroll to bottom when messages update
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
      alert('WebSocket not connected. Please wait for connection or refresh the page.');
      if (wsRef.current) {
        wsRef.current.reconnect();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background via-background to-muted/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              size="sm"
              className="gap-2 hover:bg-muted/50 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            {friendInfo && (
              <div className="flex items-center gap-3 pl-3 border-l border-border/50">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {friendInfo.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{friendInfo.username}</p>
                  <p className="text-xs text-muted-foreground">{friendInfo.email}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={wsConnected ? "default" : "secondary"} 
              className={`gap-1.5 px-3 py-1 ${
                wsConnected 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" 
                  : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
              }`}
            >
              {wsConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                  Connecting...
                </>
              )}
            </Badge>
            {!wsConnected && (
              <Button
                onClick={() => wsRef.current?.reconnect()}
                variant="outline"
                size="sm"
                className="bg-transparent hover:bg-muted/50 border-2 hover:border-primary/50 transition-all duration-200"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <p className="text-foreground font-medium mb-1">No messages yet</p>
              <p className="text-sm text-muted-foreground">Start a conversation by sending a message</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.sender?.id === user?.id || msg.sender === user?.id;
            const ts = msg.timestamp ? new Date(msg.timestamp) : null;
            const timeStr = ts
              ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={msg.id || `${msg.sender}-${msg.timestamp}`}
                className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="text-xs font-semibold">
                      {msg.sender?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${
                    isCurrentUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl break-words ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-foreground rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">
                      {msg.displayContent || msg.content}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground px-2">{timeStr}</span>
                </div>

                {isCurrentUser && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="text-xs font-semibold">
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
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-border bg-card">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <div className="flex-1 flex items-center gap-2 bg-muted rounded-full px-4 py-2">
            <Input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="bg-transparent border-0 focus-visible:ring-0 p-0 text-sm placeholder:text-muted-foreground"
            />
          </div>
          <Button
            onClick={handleSend}
            size="icon"
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
            disabled={!content.trim() || !wsConnected}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );


      // <div className="flex flex-col h-screen bg-background">
      //   {/* Header */}
      //   <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm">
      //     <div>
      //       <h1 className="text-xl font-semibold text-foreground">Messages</h1>
      //       <p className="text-sm text-muted-foreground mt-0.5">AI Translator Chat</p>
      //     </div>
      //     <div className="flex items-center gap-3">
      //       <div className="flex items-center gap-2">
      //         <div className={`w-2.5 h-2.5 rounded-full ${wsConnected ? "bg-green-500" : "bg-yellow-500"}`}></div>
      //         <span className="text-xs font-medium text-muted-foreground">
      //         {wsConnected ? "Connected" : "Connecting..."}
      //       </span>
      //       </div>
      //       {!wsConnected && (
      //           <Button onClick={onRetry} size="sm" variant="outline" className="text-xs bg-transparent">
      //             Retry
      //           </Button>
      //       )}
      //     </div>
      //   </div>
      //
      //   {/* Messages Container */}
      //   <div ref={scrollerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-background">
      //     {messages.length === 0 ? (
      //         <div className="flex items-center justify-center h-full">
      //           <div className="text-center">
      //             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
      //               <MessageCircleIcon className="w-8 h-8 text-primary"/>
      //             </div>
      //             <p className="text-foreground font-medium mb-1">No messages yet</p>
      //             <p className="text-sm text-muted-foreground">Start a conversation by sending a message</p>
      //           </div>
      //         </div>
      //     ) : (
      //         messages.map((msg) => {
      //           const isCurrentUser = msg.sender?.id === user?.id || msg.sender === user?.id
      //           const ts = msg.timestamp ? new Date(msg.timestamp) : null
      //           const timeStr = ts ? ts.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}) : ""
      //
      //           return (
      //               <div
      //                   key={msg.id || `${msg.sender}-${msg.timestamp}`}
      //                   className={`flex gap-3 ${isCurrentUser ? "justify-end" : "justify-start"}`}
      //               >
      //                 {!isCurrentUser && (
      //                     <Avatar className="w-8 h-8 flex-shrink-0">
      //                       <AvatarImage src={msg.sender?.avatar || "/placeholder.svg"} alt={msg.sender?.username}/>
      //                       <AvatarFallback className="text-xs font-semibold">
      //                         {getInitials(msg.sender?.username)}
      //                       </AvatarFallback>
      //                     </Avatar>
      //                 )}
      //
      //                 <div className={`flex flex-col gap-1 max-w-xs ${isCurrentUser ? "items-end" : "items-start"}`}>
      //                   <div
      //                       className={`px-4 py-2.5 rounded-2xl break-words ${
      //                           isCurrentUser
      //                               ? "bg-primary text-primary-foreground rounded-br-none"
      //                               : "bg-muted text-foreground rounded-bl-none"
      //                       }`}
      //                   >
      //                     <p className="text-sm leading-relaxed">{msg.displayContent || msg.content}</p>
      //                   </div>
      //
      //                   <span className="text-xs text-muted-foreground px-2">{timeStr}</span>
      //                 </div>
      //
      //                 {isCurrentUser && (
      //                     <Avatar className="w-8 h-8 flex-shrink-0">
      //                       <AvatarImage src={msg.sender?.avatar || "/placeholder.svg"} alt="You"/>
      //                       <AvatarFallback
      //                           className="text-xs font-semibold">{getInitials(user?.username)}</AvatarFallback>
      //                     </Avatar>
      //                 )}
      //               </div>
      //           )
      //         })
      //     )}
      //   </div>
      //
      //   {/* Input Area */}
      //   <div className="px-6 py-4 border-t border-border bg-card">
      //     <div className="flex items-end gap-3">
      //       <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
      //         <Plus className="w-5 h-5"/>
      //       </Button>
      //
      //       <div className="flex-1 flex items-center gap-2 bg-muted rounded-full px-4 py-2">
      //         <Input
      //             type="text"
      //             value={content}
      //             onChange={(e) => setContent(e.target.value)}
      //             onKeyDown={handleKeyDown}
      //             placeholder="Aa"
      //             className="bg-transparent border-0 focus-visible:ring-0 p-0 text-sm placeholder:text-muted-foreground"
      //         />
      //         <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
      //           <Smile className="w-5 h-5"/>
      //         </Button>
      //       </div>
      //
      //       <Button
      //           onClick={handleSend}
      //           size="icon"
      //           className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
      //           disabled={!content.trim()}
      //       >
      //         <Send className="w-5 h-5"/>
      //       </Button>
      //     </div>
      //   </div>
      // </div>
};

export default Chat;
// function MessageCircleIcon(props) {
//   return (
//       <svg
//           {...props}
//           xmlns="http://www.w3.org/2000/svg"
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="2"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//       >
//         <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
//       </svg>
//   )
// }
