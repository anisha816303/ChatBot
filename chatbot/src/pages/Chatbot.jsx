import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import ToolSelector from './ToolSelector.jsx';
import Sidebar from './Sidebar.jsx';
import PromptTemplates from './PromptTemplates.jsx';
import {
  Card,
  CardBody,
  Input,
  Button,
  Row,
  Col,
  Badge,
  FormGroup,
  Label,
  Spinner,
  ListGroup,
  ListGroupItem,
  Container
} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../argon-design-system-react-master/src/assets/css/argon-design-system-react.css';
import './Chatbot.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendEmailToolEnabled, setSendEmailToolEnabled] = useState(false);
  const [sendSlackToolEnabled, setSlackToolEnabled] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isPromptTemplatesOpen, setIsPromptTemplatesOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Mock user profile - replace with actual user data from your auth system
  const [userProfile] = useState({
    name: 'Anisha Ajit',
    avatar: null // You can add avatar URL here
  });

  const handleEmailToolToggle = async (checked) => {
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = checked
        ? 'http://localhost:8080/tools/enable-email-tool'
        : 'http://localhost:8080/tools/disable-email-tool';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to update tool');
      setSendEmailToolEnabled(checked);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `✅ Email tool has been ${checked ? 'enabled' : 'disabled'}.`
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: '❌ Failed to update email tool. Please try again.'
      }]);
    }
  };

  const handleSlackToolToggle = async (checked) => {
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = checked
        ? 'http://localhost:8080/tools/enable-slack-tool'
        : 'http://localhost:8080/tools/disable-slack-tool';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to update tool');
      setSlackToolEnabled(checked);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `✅ Slack tool has been ${checked ? 'enabled' : 'disabled'}.`
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: '❌ Failed to update slack tool. Please try again.'
      }]);
    }
  };

  const handleFileAttachment = (event) => {
    const files = Array.from(event.target.files);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const sendMessage = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);

    let finalPrompt = input;
    if (sendEmailToolEnabled && !input.toLowerCase().includes('email')) {
      finalPrompt += ' and send email';
    }
    if (sendSlackToolEnabled && !input.toLowerCase().includes('slack')) {
      finalPrompt += ' and send a slack notification';
    }

    setInput('');
    setAttachedFiles([]);
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('prompt', finalPrompt);
      formData.append('chatId', currentChatId || '');
      
      // Add attached files to form data
      attachedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const response = await fetch('http://localhost:7000/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Server error');
      const data = await response.json();

      if (Array.isArray(data)) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            type: 'tool-selection',
            text: "🧠 Select and order the tools you want to run:",
            tools: data,
            prompt: finalPrompt
          }
        ]);
      } else if (data.response) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.response }]);
      } else {
        setMessages(prev => [
          ...prev,
          { sender: 'bot', text: typeof data === 'string' ? data : JSON.stringify(data) }
        ]);
      }

    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: '❌ Something went wrong. Please try again later.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([{ sender: 'bot', text: 'Hello! How can I help you today?' }]);
    setCurrentChatId(null);
    setInput('');
    setAttachedFiles([]);
  };

  const handleChatSelect = async (chatId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/api/chats/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load chat');
      const chatData = await response.json();
      
      setCurrentChatId(chatId);
      setMessages(chatData.messages || []);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    // Redirect to login page or trigger logout in your auth system
    window.location.href = '/login';
  };

  const handleTemplateSelect = (templateContent) => {
    setInput(templateContent);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };



return (
  <div className="main-content">
    {/* Argon background shape */}
    <div className="position-relative">
      <section className="section section-lg section-shaped pb-0 mb-0">
        <div className="shape shape-style-1 shape-primary">
          <span className="argon-bubble" />
          <span className="argon-bubble" />
          <span className="argon-bubble" />
          <span className="argon-bubble" />
          <span className="argon-bubble" />
          <span className="argon-bubble" />
          <span className="argon-bubble" />
          <span className="argon-bubble" />
        </div>
        <Container fluid className="py-0">
          <Row noGutters style={{ minHeight: '100vh' }}>
            <Col xs="auto">
              <Sidebar
                onNewChat={handleNewChat}
                onChatSelect={handleChatSelect}
                onLogout={handleLogout}
                onPromptTemplatesOpen={() => setIsPromptTemplatesOpen(true)}
                currentChatId={currentChatId}
                userProfile={userProfile}
              />
            </Col>
            <Col className="d-flex flex-column" style={{ minHeight: '100vh' }}>
              <div
                className="flex-grow-1 m-4 p-0 chat-container"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(248, 250, 252, 0.65) 100%)',
                  borderRadius: '1.5rem',
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  height: '85vh',
                  position: 'relative'

                }}
              >
                {/* Fixed Professional Bottom Bubbles */}
                <div className="fixed-bubble-container">
                  <div className="fixed-bubble fixed-bubble-1"></div>
                  <div className="fixed-bubble fixed-bubble-2"></div>
                  <div className="fixed-bubble fixed-bubble-3"></div>
                  <div className="fixed-bubble fixed-bubble-4"></div>
                  <div className="fixed-bubble fixed-bubble-5"></div>
                  <div className="fixed-bubble fixed-bubble-6"></div>
                  <div className="fixed-bubble fixed-bubble-7"></div>
                  <div className="fixed-bubble fixed-bubble-8"></div>
                </div>

                <div className="d-flex flex-column h-100">
                  {/* Conversation Flow */}
                  <div 
                    className="flex-grow-1 p-5" 
                    style={{ 
                      overflowY: 'auto', 
                      minHeight: 0,
                      background: 'transparent',
                      paddingTop: '2rem 2.5rem 1rem 2.5rem',
                      position: 'relative',
                      zIndex: 2
                    }}
                  >
                    <div className="conversation-flow">
                      {messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`message-item mb-4 ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
                        >
                          <div className="message-meta mb-2">
                            <div className="message-sender-with-icon">
                              {msg.sender === 'user' ? (
                                <svg className="message-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                                </svg>
                              ) : (
                                <svg className="message-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2c-1.1 0-2 .9-2 2v1H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-2V4c0-1.1-.9-2-2-2zm0 2h0zm-4 7h2v2H8v-2zm6 0h2v2h-2v-2zm-4 4h8v2H8v-2zm2-8c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" fill="currentColor"/>
                              </svg>
                              )}
                              <span className="message-sender">
                                {msg.sender === 'user' ? 'You' : 'ChatBot'}
                              </span>
                            </div>
                            <span className="message-time">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="message-content">
                            {(() => {
                              if (msg.type === 'tool-selection') {
                                return (
                                  <div className="tool-selection-container">
                                    <ToolSelector
                                      tools={msg.tools}
                                      prompt={msg.prompt}
                                      onConfirm={async (orderedToolNames) => { /*...*/ }}
                                      onResample={() => sendMessage()}
                                    />
                                  </div>
                                );
                              } else if (msg.sender === 'bot') {
                                return (
                                  <div className="bot-message-text">
                                    <ReactMarkdown>{msg.text.replace(/^[^\w\s] /, '')}</ReactMarkdown>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="user-message-text">
                                    {msg.text.replace(/^[^\w\s] /, '')}
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="message-item mb-4 bot-message">
                          <div className="message-meta mb-2">
                            <div className="message-sender-with-icon">
                              <svg className="message-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                              </svg>
                              <span className="message-sender">Assistant</span>
                            </div>
                            <span className="message-time">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="message-content">
                            <div className="bot-message-text">
                              <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                              Processing your request...
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Input Panel */}
                  <div 
                    className="p-4 border-top"
                    style={{ 
                      background: 'rgba(248, 250, 252, 0.9)',
                      backdropFilter: 'blur(20px)',
                      borderTop: '1px solid rgba(226, 232, 240, 0.6)',
                      position: 'relative',
                      zIndex: 10
                    }}
                  >
                    <Row className="align-items-center mb-3">
                      <Col xs="12" className="d-flex flex-wrap align-items-center gap-3">
                        <Label check className="d-flex align-items-center mr-4 mb-0 text-slate-600">
                          <Input 
                            type="checkbox" 
                            checked={sendEmailToolEnabled} 
                            onChange={e => handleEmailToolToggle(e.target.checked)}
                            style={{ accentColor: '#3b82f6' }}
                          />
                          <span className="ml-2 font-weight-medium">Email Tool</span>
                        </Label>
                        <Label check className="d-flex align-items-center mb-0 text-slate-600">
                          <Input 
                            type="checkbox" 
                            checked={sendSlackToolEnabled} 
                            onChange={e => handleSlackToolToggle(e.target.checked)}
                            style={{ accentColor: '#3b82f6' }}
                          />
                          <span className="ml-2 font-weight-medium">Slack Tool</span>
                        </Label>
                      </Col>
                    </Row>

                    <Row className="align-items-center">
                      <Col xs="auto">
                        <Button 
                          color="link" 
                          onClick={handleAttachmentClick} 
                          className="p-3 text-slate-500 hover-lift"
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.7)',
                            borderRadius: '12px',
                            border: '1px solid rgba(226, 232, 240, 0.6)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.5,6.5 L9,14 C8.17157288,14.8284271 6.82842712,14.8284271 6,14 C5.17157288,13.1715729 5.17157288,11.8284271 6,11 L14.5,2.5 C16.1568542,0.843145751 18.8431458,0.843145751 20.5,2.5 C22.1568542,4.15685425 22.1568542,6.84314575 20.5,8.5 L10,19 C7.790861,21.209139 4.209139,21.209139 2,19 C-0.209139,16.790861 -0.209139,13.209139 2,11" stroke="currentColor" strokeWidth="2" fill="none" />
                          </svg>
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".png,.jpg,.jpeg"
                          onChange={handleFileAttachment}
                          style={{ display: 'none' }}
                        />
                      </Col>
                      <Col>
                        <Input
                          type="textarea"
                          placeholder="Type your message... (Shift+Enter for newline)"
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          rows={2}
                          className="form-control-lg"
                          style={{
                            resize: 'none',
                            minHeight: 56,
                            background: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '16px',
                            fontSize: '1rem',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            color: '#1e293b',
                            padding: '16px 20px',
                            transition: 'all 0.2s ease'
                          }}
                        />
                      </Col>
                      <Col xs="auto">
                        <Button 
                          onClick={sendMessage} 
                          disabled={loading || (!input.trim() && attachedFiles.length === 0)} 
                          className="p-3 hover-lift"
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            border: 'none',
                            borderRadius: '16px',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                            transition: 'all 0.2s ease',
                            minWidth: '56px',
                            minHeight: '56px'
                          }}
                        >
                          {loading ? <Spinner size="sm" /> : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 24 24">
                              <path d="M2,21 L23,12 L2,3 L2,10 L17,12 L2,14 L2,21 Z" />
                            </svg>
                          )}
                        </Button>
                      </Col>
                    </Row>

                    {attachedFiles.length > 0 && (
                      <div className="mt-3">
                        <div className="d-flex flex-wrap gap-2">
                          {attachedFiles.map((file, fileIdx) => (
                            <div 
                              key={file.name + file.size + fileIdx} 
                              className="d-flex align-items-center p-2 rounded"
                              style={{
                                background: 'rgba(255, 255, 255, 0.8)',
                                border: '1px solid rgba(226, 232, 240, 0.6)',
                                borderRadius: '8px',
                                fontSize: '0.875rem'
                              }}
                            >
                              <span className="font-weight-medium mr-2" style={{ color: '#3b82f6' }}>
                                {file.name}
                              </span>
                              <span className="text-muted small mr-2">
                                ({formatFileSize(file.size)})
                              </span>
                              <Button 
                                close 
                                onClick={() => removeAttachment(fileIdx)} 
                                title="Remove file" 
                                className="text-slate-400 ml-1"
                                style={{ fontSize: '0.75rem' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <PromptTemplates
                isOpen={isPromptTemplatesOpen}
                onClose={() => setIsPromptTemplatesOpen(false)}
                onSelectTemplate={handleTemplateSelect}
              />
            </Col>
          </Row>
        </Container>
      </section>
    </div>

  </div>
);
};

export default Chatbot;