import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth';
import { subscribeToMessages, sendMessage, markChatAsRead, Message } from '../../lib/chat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import EmojiPicker from 'emoji-picker-react';

interface FloatingChatProps {
    chatId: string;
    onClose: () => void;
    sellerName: string;
    sellerPhoto: string;
}

export default function FloatingChat({ chatId, onClose, sellerName, sellerPhoto }: FloatingChatProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user || !chatId) return;
        const unsubscribe = subscribeToMessages(chatId, (data) => {
            setMessages(data);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });
        return () => unsubscribe();
    }, [chatId, user]);

    useEffect(() => {
        if (user && chatId) {
            markChatAsRead(chatId, user.uid);
        }
    }, [chatId, user, messages.length]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;
        const text = newMessage;
        setNewMessage('');
        try {
            await sendMessage(chatId, user.uid, text);
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    if (!user) return null;

    return (
        <div className={`fixed bottom-4 right-4 w-[340px] sm:w-96 ${isMinimized ? 'h-16' : 'h-[500px] max-h-[80vh]'} bg-white rounded-2xl shadow-2xl flex flex-col z-[100] border border-outline-variant/30 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 transition-all`}>
            {/* Header */}
            <div 
                className="h-16 bg-primary flex items-center justify-between px-4 text-white shrink-0 cursor-pointer select-none"
                onClick={() => isMinimized && setIsMinimized(false)}
            >
                <div className="flex items-center gap-3">
                    <img src={sellerPhoto} alt={sellerName} className="w-10 h-10 rounded-full object-cover border-2 border-white/20 bg-white" />
                    <div>
                        <h4 className="font-bold text-sm leading-tight">{sellerName}</h4>
                        <span className="text-[10px] font-medium text-white/80">Chat en vivo</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} 
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                        title={isMinimized ? "Maximizar" : "Minimizar"}
                    >
                        <span className="material-symbols-outlined text-xl">{isMinimized ? 'expand_less' : 'remove'}</span>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClose(); }} 
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                        title="Cerrar"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 bg-surface-container-lowest space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-60">
                                <span className="material-symbols-outlined text-4xl mb-2">chat_bubble</span>
                                <p className="text-xs font-bold text-center">Iniciá la conversación con {sellerName}</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = msg.senderId === user.uid;
                                return (
                                    <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-medium ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-surface-container-low text-on-surface rounded-tl-sm'}`}>
                                            {msg.text}
                                        </div>
                                        {msg.timestamp && (
                                            <span className="text-[9px] font-bold text-on-surface-variant mt-1.5 px-1">
                                                {format(msg.timestamp.toDate(), 'HH:mm')}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-outline-variant/20 flex gap-2 shrink-0 items-center relative">
                        {showEmojiPicker && (
                            <div className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl rounded-lg overflow-hidden">
                                <EmojiPicker 
                                    onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)} 
                                    width={280}
                                    height={300}
                                    previewConfig={{ showPreview: false }}
                                />
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors shrink-0"
                            title="Insertar emoji"
                        >
                            <span className="material-symbols-outlined text-xl">mood</span>
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe un mensaje..."
                            className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                            onClick={() => setShowEmojiPicker(false)}
                        />
                        <button 
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:bg-surface-container-highest disabled:text-on-surface-variant transition-all hover:bg-primary/90 shrink-0 shadow-sm active:scale-95"
                            onClick={() => setShowEmojiPicker(false)}
                        >
                            <span className="material-symbols-outlined text-xl">send</span>
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}
