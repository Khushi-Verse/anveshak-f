import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Users, Pin, Paperclip, Send, AtSign, 
  Eye, FileText, File, ExternalLink, ChevronDown, ChevronRight,
  Menu, X
} from 'lucide-react';

// Helper to get role colors based on role name
const getRoleStyles = (role) => {
  const normalizedRole = (role || '').toLowerCase();
  switch (normalizedRole) {
    case 'judiciary':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'police':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'forensics':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'complainant':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getVisibilityStyles = (visibility) => {
  const vis = (visibility || '').toLowerCase();
  if (vis.includes('all')) return 'text-forest bg-forest/10 border-forest/20';
  if (vis.includes('internal')) return 'text-alert bg-alert/10 border-alert/20';
  return 'text-saffron bg-saffron/10 border-saffron/20';
};

const FormalCaseChat = ({ caseId = 'CASE-0000', caseName = 'Untitled Case', currentStage = 'Investigation' }) => {
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [visibility, setVisibility] = useState('All Participants');
  const [mentionDropdownOpen, setMentionDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        
        // Fetch participants (mock for now as backend may not have an explicit participants route)
        setParticipants([
          { id: 'u1', name: 'Insp. Priya Sharma', role: 'Police', designation: 'Investigating Officer' },
          { id: 'u2', name: 'Dr. A. Verma', role: 'Forensics', designation: 'Lead Analyst' },
          { id: 'u3', name: 'Hon. Justice K. Rao', role: 'Judiciary', designation: 'District Judge' }
        ]);

        const res = await fetch(`${API_URL}/chat/case/${caseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if(res.ok) {
          const data = await res.json();
          // Transform backend chat format to UI format
          const formatted = (data.messages || data).map(m => ({
            id: m._id || m.id,
            senderName: m.senderId?.name || 'User',
            senderDesignation: m.senderId?.role || 'Officer',
            senderRole: m.senderId?.role || 'Police',
            timestamp: m.createdAt || new Date().toISOString(),
            subject: (m.text || '').substring(0, 20) + '...',
            body: m.text,
            visibility: 'All Participants',
            isPinned: false,
            attachments: []
          }));
          setMessages(formatted);
        }
      } catch(err) {
        console.error("Failed to load chat", err);
      }
    };
    fetchChat();
  }, [caseId]);

  // Group participants by role
  const groupedParticipants = (Array.isArray(participants) ? participants : []).reduce((acc, p) => {
    const role = p.role || 'Other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(p);
    return acc;
  }, {});

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!composeBody.trim()) return;

    try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${API_URL}/chat/case/${caseId}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ text: composeBody })
        });
        if(res.ok) {
          const response = await res.json();
          const savedMsg = response.data || response;
          const newMessage = {
            id: savedMsg._id || `msg-${Date.now()}`,
            senderName: savedMsg.senderId?.name || 'Current User',
            senderDesignation: savedMsg.senderId?.role || 'Investigating Officer',
            senderRole: savedMsg.senderId?.role || 'Police',
            timestamp: savedMsg.createdAt || new Date().toISOString(),
            subject: composeSubject || composeBody.substring(0, 20),
            body: composeBody,
            visibility: visibility,
            isPinned: false,
            attachments: []
          };
          setMessages([...messages, newMessage]);
          setComposeSubject('');
          setComposeBody('');
        }
    } catch (err) {
       console.error("Failed to send message", err);
    }
  };

  const insertMention = (name) => {
    setComposeBody((prev) => prev + `@${name} `);
    setMentionDropdownOpen(false);
  };

  // Helper to render message body with highlighted mentions
  const renderMessageBody = (text) => {
    if (!text) return null;
    const parts = text.split(/(@\w+(?: \w+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-navy font-semibold bg-blue-50 px-1 rounded">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-cream border border-charcoal/10 rounded-lg overflow-hidden glass-card shadow-sm">
      
      {/* SECTION A: Pinned Case Summary Panel */}
      <div className="bg-white border-b border-charcoal/10 p-4 shrink-0 shadow-sm z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-navy font-serif">{caseId}: {caseName}</h2>
            <span className="px-3 py-1 bg-navy/10 text-navy text-xs font-semibold rounded-full uppercase tracking-wider">
              {currentStage}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-charcoal/70">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-navy" />
              <span>{participants.length} Total Participants</span>
            </div>
            {Object.entries(groupedParticipants).map(([role, list]) => (
              <span key={role} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-charcoal/40"></span>
                {list.length} {role}
              </span>
            ))}
          </div>
        </div>
        
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden flex items-center justify-center p-2 rounded-md bg-white border border-charcoal/20 text-navy hover:bg-gray-50"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span className="ml-2 font-medium text-sm">Participants</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SECTION B: Participant Sidebar */}
        <div className={`
          absolute md:static inset-y-0 left-0 z-20 w-72 bg-white border-r border-charcoal/10 overflow-y-auto transition-transform duration-300 ease-in-out shadow-lg md:shadow-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-4 border-b border-charcoal/10 bg-gray-50 sticky top-0">
            <h3 className="font-semibold text-navy flex items-center gap-2">
              <Users className="w-5 h-5" />
              Directory
            </h3>
          </div>
          <div className="p-4 space-y-6">
            {Object.entries(groupedParticipants).map(([role, list]) => (
              <div key={role} className="space-y-3">
                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider border-b border-charcoal/10 pb-1">
                  {role} ({list.length})
                </h4>
                <div className="space-y-3">
                  {list.map((p, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="text-sm font-semibold text-navy">{p.name}</span>
                      <span className="text-xs text-charcoal/70">{p.designation}</span>
                      {p.department && (
                        <span className="text-xs text-charcoal/50">{p.department}</span>
                      )}
                      <div className="mt-1">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getRoleStyles(role)}`}>
                          {role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION C: Message Thread (Main Area) */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-charcoal/40">
                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                <p>No formal communications recorded yet.</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={msg.id} 
                  className={`bg-white border border-charcoal/10 rounded-lg shadow-sm overflow-hidden scale-in ${index % 2 === 1 ? 'bg-navy/5' : ''}`}
                >
                  {/* Message Header */}
                  <div className="flex items-start justify-between p-3 border-b border-charcoal/10 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-charcoal/10 text-navy font-bold">
                        {(msg.senderName || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy">{msg.senderName || 'Unknown'}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getRoleStyles(msg.senderRole)}`}>
                            {msg.senderRole}
                          </span>
                          {msg.isPinned && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-saffron/10 text-saffron border border-saffron/20 rounded text-[10px] font-bold uppercase">
                              <Pin className="w-3 h-3" /> Pinned
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-charcoal/70">
                          {msg.senderDesignation} • {new Date(msg.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Message Content */}
                  <div className="p-4 space-y-3">
                    <h4 className="font-serif font-bold text-lg text-charcoal">{msg.subject}</h4>
                    <div className="text-sm text-charcoal whitespace-pre-wrap leading-relaxed">
                      {renderMessageBody(msg.body)}
                    </div>
                    
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-charcoal/10">
                        <p className="text-xs font-semibold text-charcoal/60 uppercase tracking-wider mb-2">Attachments</p>
                        <div className="flex flex-wrap gap-3">
                          {msg.attachments.map((file, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 bg-white border border-charcoal/20 rounded-md shadow-sm min-w-[200px]">
                              <div className="p-2 bg-navy/5 rounded text-navy">
                                {file.type.includes('pdf') ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-navy truncate">{file.filename}</p>
                                <p className="text-xs text-charcoal/60">{file.size} • {file.uploadedBy}</p>
                              </div>
                              <a 
                                href={file.url || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1.5 text-navy hover:bg-navy/10 rounded transition-colors"
                                title="View File"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Visibility Tag */}
                  <div className="px-4 py-2 bg-gray-50 border-t border-charcoal/10 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-charcoal/50" />
                    <span className={`px-2 py-0.5 text-xs font-semibold border rounded-full ${getVisibilityStyles(msg.visibility)}`}>
                      Visible to: {msg.visibility}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* SECTION D: Compose Area */}
          <div className="p-4 bg-white border-t border-charcoal/20 z-10">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <input 
                type="text" 
                placeholder="Subject (Formal)" 
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-charcoal/20 rounded-md text-sm font-serif focus:outline-none focus:ring-2 focus:ring-navy/50 focus:border-transparent transition-all"
                required
              />
              
              <div className="relative">
                <textarea 
                  placeholder="Draft your formal memo or update here..." 
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full h-24 px-3 py-2 bg-gray-50 border border-charcoal/20 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy/50 focus:border-transparent transition-all"
                  required
                />
                
                {/* Mention Dropdown */}
                {mentionDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-charcoal/20 rounded-md shadow-lg overflow-hidden z-30">
                    <div className="p-2 bg-gray-50 border-b border-charcoal/10 text-xs font-semibold text-charcoal">
                      Select Participant to Mention
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {participants.map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => insertMention(p.name)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-navy/5 focus:bg-navy/5 transition-colors border-b border-charcoal/5 last:border-0"
                        >
                          <span className="font-semibold text-navy">{p.name}</span>
                          <span className="block text-xs text-charcoal/70">{p.designation}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="appearance-none pl-8 pr-8 py-2 bg-gray-50 border border-charcoal/20 rounded-md text-sm text-navy font-medium focus:outline-none focus:ring-2 focus:ring-navy/50 cursor-pointer"
                    >
                      <option value="All Participants">All Participants</option>
                      <option value="Police & Forensics Only">Police & Forensics Only</option>
                      <option value="Internal — Police Only">Internal — Police Only</option>
                    </select>
                    <Eye className="w-4 h-4 text-charcoal/50 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <ChevronDown className="w-4 h-4 text-charcoal/50 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setMentionDropdownOpen(!mentionDropdownOpen)}
                    className="p-2 text-navy hover:bg-navy/10 rounded-md transition-colors border border-transparent hover:border-charcoal/20"
                    title="Mention Participant"
                  >
                    <AtSign className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-navy hover:bg-navy/10 rounded-md transition-colors border border-transparent hover:border-charcoal/20"
                    title="Attach File"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={!composeSubject.trim() || !composeBody.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-navy text-white text-sm font-semibold rounded-md hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Submit Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormalCaseChat;
