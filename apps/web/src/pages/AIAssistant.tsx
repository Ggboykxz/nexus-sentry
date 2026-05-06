import { useState } from 'react';
import { apiPost } from '../lib/api';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiPost<{ data: { message: Message } }>('/api/v1/ai/chat', {
        messages: [...messages, userMessage],
      });
      setMessages(prev => [...prev, response.data.message]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not get response from AI' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-12rem)] flex flex-col">
      <h1 className="text-2xl font-semibold">AI Assistant</h1>

      <div className="flex-1 rounded-lg border bg-card overflow-hidden flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot size={32} className="mx-auto mb-2 opacity-50" />
              <p>Ask me anything about your incidents or events</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="flex gap-3">
              {msg.role === 'user' ? (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-primary-foreground" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <Bot size={16} />
                </div>
              )}
              <div className="flex-1 prose prose-sm dark:prose-invert">
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="text-muted-foreground animate-pulse">Thinking...</div>
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your incidents..."
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm resize-none"
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="rounded-md bg-primary px-4 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}