'use client';

import { useState, useRef, useEffect } from 'react';
import { askExpert } from '@/app/actions/expert';
import { Button } from '@/components/ui/Button';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Trash2, Loader2, Info } from 'lucide-react';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export default function ExpertConsultantClient() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Prepare history for API
        const history = messages.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
        }));

        const result = await askExpert(input, history);

        if (result.error) {
            setMessages((prev) => [
                ...prev,
                { role: 'model', text: `⚠️ Hata: ${result.error}` },
            ]);
        } else {
            setMessages((prev) => [
                ...prev,
                { role: 'model', text: result.text },
            ]);
        }
        setIsTyping(false);
    };

    const clearChat = () => {
        if (confirm('Sohbet geçmişini silmek istediğinize emin misiniz?')) {
            setMessages([]);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white">Uluslararası Boya ve Kimya Uzmanı</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Teknik Danışman Çevrimiçi</span>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearChat} disabled={messages.length === 0} className="text-gray-500 hover:text-red-500 border-none bg-transparent">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Temizle
                </Button>
            </div>

            {/* Info Banner */}
            {messages.length === 0 && (
                <div className="m-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Nasıl yardımcı olabilirim?</strong> Boyama süreçleri, kimyasal haslıklar (ISO 105), pH kontrolü veya iplik türlerine özel boya reçeteleri hakkında teknik sorularınızı sorabilirsiniz.
                    </p>
                </div>
            )}

            {/* Chat Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700"
            >
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-blue-600'
                                }`}>
                                {msg.role === 'user' ? <User className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <Bot className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                                : 'bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'
                                }`}>
                                <div className="prose dark:prose-invert max-w-none 
                  prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-white 
                  prose-table:border prose-table:rounded-lg prose-th:bg-gray-100 dark:prose-th:bg-gray-800
                  prose-strong:text-inherit">
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[85%]">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3 bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <input
                        type="text"
                        placeholder="Teknik sorunuzu buraya yazın..."
                        className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="rounded-lg px-4"
                    >
                        {isTyping ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
                <p className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                    <Info className="w-3 h-3" />
                    Yapay zeka teknik hatalar yapabilir. Önemli kararlar için her zaman laboratuvar testlerini referans alınız.
                </p>
            </div>
        </div>
    );
}
