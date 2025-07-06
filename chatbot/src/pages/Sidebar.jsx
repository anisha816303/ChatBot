import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  ListGroup,
  ListGroupItem,
  Input,
  Badge,
  Row,
  Col,
} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../argon-design-system-react-master/src/assets/css/argon-design-system-react.css';
import './Sidebar.css';
const Sidebar = ({ 
  onNewChat, 
  onChatSelect, 
  onLogout, 
  onPromptTemplatesOpen,
  currentChatId,
  userProfile 
}) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8080/api/chat-history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch chat history');
      const data = await response.json();
      setChatHistory(data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    onNewChat();
    fetchChatHistory();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateTitle = (title, maxLength = 30) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div className={`modern-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-content">
        {/* Header */}
        <div className="sidebar-header">
          <Button 
            className="collapse-btn" 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points={isCollapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
            </svg>
          </Button>
          
          {!isCollapsed && (
            <div className="user-profile">
              <div className="user-avatar">
                {userProfile?.avatar ? (
                  <img src={userProfile.avatar} alt="User Avatar" />
                ) : (
                  <span>{userProfile?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="user-info">
                <div className="user-name">{userProfile?.name || 'User'}</div>
              </div>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <>
            {/* Action Buttons */}
            <div className="sidebar-actions">
              <Button className="action-btn primary-btn" onClick={handleNewChat}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Chat
              </Button>
              
              <Button className="action-btn secondary-btn" onClick={onPromptTemplatesOpen}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                Templates
              </Button>
            </div>

            {/* Chat History */}
            <div className="chat-history-section">
              <h6 className="section-title">Recent Chats</h6>
              
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <span>Loading chats...</span>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="empty-state">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>No chats yet</span>
                </div>
              ) : (
                <div className="chat-list">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
                      onClick={() => onChatSelect(chat.id)}
                    >
                      <div className="chat-item-content">
                        <div className="chat-title">{truncateTitle(chat.title || 'Untitled Chat')}</div>
                        <div className="chat-meta">
                          <span className="chat-date">{formatDate(chat.createdAt)}</span>
                          <Badge className="message-count">{chat.messageCount || 0}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logout Button */}
            <div className="sidebar-footer">
              <Button className="logout-btn" onClick={onLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <path d="M21 12H9" />
                </svg>
                Logout
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;