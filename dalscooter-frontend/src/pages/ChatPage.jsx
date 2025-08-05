import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, MessageCircle, User, Clock, Search, ChevronRight } from 'lucide-react';
import Navbar from '../components/NavBar';
import { apiService } from '../services/apiService';
import '../styles/ChatApp.css';

const ChatPage = () => {
  const [concerns, setConcerns] = useState([]);
  const [activeChats, setActiveChats] = useState({});
  const [currentConcernId, setCurrentConcernId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingConcerns, setLoadingConcerns] = useState(false);
  const [loadingChats, setLoadingChats] = useState({});
  const messagesEndRef = useRef(null);

  // pull user email from localStorage
  const getUserEmail = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      return stored.email;
    } catch {
      return null;
    }
  };

  // scroll to bottom when messages change
  useEffect(() => {
    async function fetchConcerns() {
      setLoadingConcerns(true);
      setError('');
      try {
        const { concerns } = await apiService.getConcerns();
        setConcerns(concerns || []);
      } catch (err) {
        setError('Could not load concerns: ' + err.message);
      } finally {
        setLoadingConcerns(false);
      }
    }
    fetchConcerns();
  }, []);

  // load chats for one concern
  const loadChats = async (concernId) => {
    if (!concernId) return;
    setLoadingChats(prev => ({ ...prev, [concernId]: true }));
    setError('');
    try {
      const { chats } = await apiService.getConcernChats(concernId);
      setActiveChats(prev => ({ ...prev, [concernId]: chats || [] }));
    } catch (err) {
      setError('Failed to load chats: ' + err.message);
    } finally {
      setLoadingChats(prev => ({ ...prev, [concernId]: false }));
    }
  };

  // open a concern
  const openChat = (concern) => {
    if (!concern?.concernId) return;
    setCurrentConcernId(concern.concernId);
    if (!activeChats[concern.concernId]) {
      loadChats(concern.concernId);
    }
  };

  // determine if a message is mine
  const isMine = (msg) => {
    const me = getUserEmail();
    return msg.from === me;
  };

  // send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConcernId) return;

    setSending(true);
    setError('');

    try {
      const me = getUserEmail();
      const currentConcern = concerns.find(c => c.concernId === currentConcernId) || {};

      const messageData = {
        from: me,
        to: currentConcern.to_user,            // or however you track the other party
        message: newMessage.trim(),
        bookingReference: currentConcern.bookingReference
      };

      const chat = await apiService.postConcernChat(currentConcernId, messageData);
      setActiveChats(prev => ({
        ...prev,
        [currentConcernId]: [...(prev[currentConcernId] || []), chat]
      }));
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // search‐filtered concerns
  const filteredConcerns = concerns.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.concernType?.toLowerCase().includes(q) ||
      c.concernId?.toLowerCase().includes(q) ||
      c.bookingReference?.toLowerCase().includes(q)
    );
  });

  const currentChats   = activeChats[currentConcernId] || [];
  const currentConcern = concerns.find(c => c.concernId === currentConcernId) || {};

  return (
    <>
      <Navbar />
      <div className="chat-app">
        {/* sidebar */}
        <aside className="chat-sidebar">
          <div className="sidebar-header">
            <h2>Customer Concerns</h2>
            <div className="search-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search concerns..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <nav className="concern-list">
            {loadingConcerns ? (
              <div className="loading">Loading concerns...</div>
            ) : filteredConcerns.length === 0 ? (
              <div className="empty">
                {concerns.length === 0
                  ? 'No concerns available.'
                  : 'No concerns match your search.'}
              </div>
            ) : (
              filteredConcerns.map(concern => (
                <button
                  key={concern.concernId}
                  onClick={() => openChat(concern)}
                  className={concern.concernId === currentConcernId ? 'active' : ''}
                >
                  <div>
                    <h3>{concern.concernType || 'Unknown Concern'}</h3>
                    <p>ID: {concern.concernId}</p>
                    <p>Booking: {concern.bookingReference}</p>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))
            )}
          </nav>
        </aside>

        {/* main chat */}
        <main className="chat-main">
          {currentConcernId ? (
            <>
              <header className="chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageCircle size={20} />
                  <h1>{currentConcern.concernType || 'Unknown Concern'}</h1>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    {currentConcern.concernId}
                  </span>
                  <span style={{ marginLeft: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    Booking: {currentConcern.bookingReference}
                  </span>
                </div>
                <button onClick={() => loadChats(currentConcernId)} disabled={loadingChats[currentConcernId]}>
                  <RefreshCw size={16} className={loadingChats[currentConcernId] ? 'animate-spin' : ''} />
                </button>
              </header>

              {error && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                  {error}
                </div>
              )}

              <section className="chat-messages">
                {loadingChats[currentConcernId] ? (
                  <div className="loading">Loading messages...</div>
                ) : currentChats.length === 0 ? (
                  <div className="empty">No messages yet. Start the conversation!</div>
                ) : (
                  currentChats.map(msg => (
                    <div
                      key={msg.chatId}
                      className={isMine(msg) ? 'message mine' : 'message'}
                    >
                      <div className="meta">
                        <User size={14} />
                        <span>{msg.from}</span>
                        <Clock size={14} />
                        <time>{new Date(msg.timestamp).toLocaleString()}</time>
                      </div>
                      <p>{msg.messageText || msg.message}</p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </section>

              <form className="chat-input" onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  style={{
                    opacity: sending || !newMessage.trim() ? 0.5 : 1,
                    cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="empty-state">
              <MessageCircle size={48} />
              <p>Select a concern from the sidebar to view and send messages</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ChatPage;
