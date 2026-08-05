import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useDialog } from '../context/DialogContext';
import { subscribeToChats, subscribeToMessages, sendMessage, markChatAsRead, deleteChat, setTypingStatus, updateUserPresence, Chat, Message } from '../lib/chat';
import { uploadFile } from '../lib/storage';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import EmojiPicker from 'emoji-picker-react';

export default function Messages() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { chatId } = useParams();
    const { showConfirm } = useDialog();

    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

    useEffect(() => {
        if (!user) return;
        updateUserPresence(user.uid);
        presenceIntervalRef.current = setInterval(() => {
            updateUserPresence(user.uid);
        }, 60000); // update every minute

        return () => {
            if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current);
        };
    }, [user]);

    // Subscribe to list of chats
    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToChats(user.uid, (data) => {
            setChats(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    // Handle chatId in URL
    useEffect(() => {
        if (!chatId) {
            setSelectedChat(null);
            return;
        }
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            setSelectedChat(chat);
        } else if (user && (!selectedChat || selectedChat.id !== chatId)) {
            // Select stub immediately so message subscription starts while chat list is loading
            setSelectedChat({
                id: chatId,
                participants: [user.uid],
                lastMessage: '',
                lastMessageTimestamp: null as any,
                unreadCount: {}
            });
        }
    }, [chatId, chats, user]);

    // Subscribe to messages when a chat is selected
    useEffect(() => {
        if (!selectedChat?.id || !user) return;

        const unsubscribe = subscribeToMessages(selectedChat.id, (data) => {
            setMessages(data);
            // Use a slightly longer timeout and check if we are already near bottom or if it's initial load
            setTimeout(scrollToBottom, 100);
        });

        return () => unsubscribe();
    }, [selectedChat?.id, user]);

    // Mark as read when viewing a chat with unread messages
    useEffect(() => {
        if (selectedChat?.id && user && selectedChat.unreadCount?.[user.uid] > 0) {
            markChatAsRead(selectedChat.id, user.uid);
        }
    }, [selectedChat?.id, selectedChat?.unreadCount?.[user?.uid || ''], user]);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !uploading) || !user || !selectedChat) return;

        try {
            const text = newMessage;
            setNewMessage('');
            setTypingStatus(selectedChat.id, user.uid, false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            await sendMessage(selectedChat.id, user.uid, text);
            scrollToBottom();
        } catch (error) {
            console.error("Failed to send", error);
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (!selectedChat || !user) return;

        setTypingStatus(selectedChat.id, user.uid, true);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setTypingStatus(selectedChat.id, user.uid, false);
        }, 2000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user || !selectedChat) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            const url = await uploadFile(file, `chats/${selectedChat.id}`);
            await sendMessage(selectedChat.id, user.uid, '', url);
            scrollToBottom();
        } catch (error) {
            console.error("Error uploading file:", error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteChat = async () => {
        if (!selectedChat) return;
        const confirmed = await showConfirm("Eliminar Chat", "¿Estás seguro de que quieres eliminar esta conversación?", "Eliminar", "Cancelar", "delete");
        if (!confirmed) return;

        try {
            await deleteChat(selectedChat.id);
            setSelectedChat(null);
            setShowMenu(false);
            navigate('/messages');
        } catch (error) {
            console.error("Error deleting chat", error);
        }
    };

    const handleArchiveChat = async () => {
        if (!selectedChat || !user) return;
        try {
            await deleteChat(selectedChat.id); // Re-using delete for now as requested user flow, or actually archive
            // Actually let's use the real archiveChat function I added
            await import('../lib/chat').then(mod => mod.archiveChat(selectedChat.id, user.uid));
            setSelectedChat(null);
            setShowMenu(false);
            navigate('/messages');
        } catch (error) {
            console.error("Error archiving chat", error);
        }
    };

    const getOtherParticipantId = (chat: Chat) => {
        return chat.participants.find(p => p !== user?.uid) || '';
    };

    const isOtherUserTyping = () => {
        if (!selectedChat) return false;
        const otherId = getOtherParticipantId(selectedChat);
        return selectedChat.typing?.[otherId] === true;
    };

    const getOnlineStatus = (chat: Chat) => {
        const otherId = getOtherParticipantId(chat);
        const lastSeen = chat.participantsData?.[otherId]?.lastSeen;
        if (!lastSeen) return 'Desconectado';
        
        // If seen in the last 3 minutes, consider online
        const isOnline = (Date.now() - lastSeen) < 3 * 60 * 1000;
        return isOnline ? 'En línea' : `Últ. vez ${format(new Date(lastSeen), 'HH:mm', { locale: es })}`;
    };

    const getDisplayName = (chat: Chat) => {
        const otherId = getOtherParticipantId(chat);
        return chat.participantsData?.[otherId]?.displayName || 'Usuario';
    };

    const getPhotoURL = (chat: Chat) => {
        const otherId = getOtherParticipantId(chat);
        const name = chat.participantsData?.[otherId]?.displayName || 'U';
        return chat.participantsData?.[otherId]?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    };

    if (!user) return <div className="p-4 md:p-10 text-center">Debes iniciar sesión.</div>;

    return (
        <div className="bg-light-50 h-[calc(100vh-80px)] overflow-hidden">
            <div className="max-w-[1440px] mx-auto h-full flex">

                {/* --- SIDEBAR LIST --- */}
                <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-light-200 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-6 border-b border-light-100">
                        <h1 className="text-2xl font-black text-dark-800 tracking-tighter">Mensajes</h1>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                        {loading ? (
                            <p className="text-center p-4 text-gray-400 text-xs font-bold uppercase">Cargando chats...</p>
                        ) : chats.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <span className="material-symbols-outlined text-4xl mb-2">chat_bubble_outline</span>
                                <p className="text-xs font-black uppercase tracking-widest">No tienes mensajes</p>
                            </div>
                        ) : (
                            chats.map(chat => {
                                const isUnread = (chat.unreadCount?.[user.uid] || 0) > 0;
                                const isActive = selectedChat?.id === chat.id;

                                return (
                                    <button
                                        key={chat.id}
                                        onClick={() => {
                                            navigate(`/messages/${chat.id}`);
                                            setSelectedChat(chat);
                                        }}
                                        className={`w-full text-left p-4 rounded-2xl transition-all flex gap-4 ${isActive ? 'bg-primary-50 ring-1 ring-primary-100' : 'hover:bg-light-50'}`}
                                    >
                                        <div className="relative shrink-0">
                                            <img src={getPhotoURL(chat)} className="size-12 rounded-full object-cover border border-light-200" />
                                            {isUnread && <div className="absolute top-0 right-0 size-3 bg-primary-vibrant rounded-full border-2 border-white" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className={`text-sm truncate pr-2 ${isUnread ? 'font-black text-dark-800' : 'font-bold text-dark-700'}`}>
                                                    {getDisplayName(chat)}
                                                </h4>
                                                {chat.lastMessageTimestamp && (
                                                    <span className="text-[9px] font-bold text-gray-400 no-wrap">
                                                        {format(chat.lastMessageTimestamp.toDate(), 'HH:mm', { locale: es })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-xs truncate ${isUnread ? 'text-primary-vibrant font-bold' : 'text-gray-400 font-medium'}`}>
                                                {chat.lastMessage || 'Nueva conversación'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* --- CHAT WINDOW --- */}
                <div className={`flex-1 flex-col bg-light-50 ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-20 bg-white border-b border-light-200 flex items-center px-6 justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => { setSelectedChat(null); navigate('/messages'); }} className="md:hidden p-2 -ml-2 text-gray-500">
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    <img src={getPhotoURL(selectedChat)} className="size-10 rounded-full object-cover" />
                                    <div>
                                        <h3 className="font-black text-dark-800 text-sm">{getDisplayName(selectedChat)}</h3>
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            {getOnlineStatus(selectedChat) === 'En línea' ? (
                                                <div className="size-1.5 bg-emerald-500 rounded-full" />
                                            ) : (
                                                <span className="material-symbols-outlined text-[10px]">schedule</span>
                                            )}
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-dark-600">
                                                {getOnlineStatus(selectedChat)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="p-2 text-gray-400 hover:text-dark-800 transition-colors rounded-full hover:bg-light-100"
                                    >
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </button>

                                    {showMenu && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-light-200 py-2 z-10">
                                            <button onClick={handleDeleteChat} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 font-medium flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                                Eliminar Chat
                                            </button>
                                            {/* Add Archive option later if needed */}
                                            <button onClick={handleArchiveChat} className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-light-50 font-medium flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">archive</span>
                                                Archivar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div
                                ref={messagesContainerRef}
                                className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col custom-scrollbar"
                            >
                                {messages.map((msg, idx) => {
                                    const isMe = msg.senderId === user.uid;
                                    return (
                                        <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed relative group ${isMe
                                                ? 'bg-primary-vibrant text-white rounded-br-none shadow-lg shadow-primary-500/20'
                                                : 'bg-white text-dark-800 border border-light-200 rounded-bl-none shadow-sm'
                                                }`}>
                                                {msg.type === 'image' && msg.image ? (
                                                    <img src={msg.image} className="max-w-full rounded-lg mb-1 cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.open(msg.image, '_blank')} />
                                                ) : (
                                                    msg.text
                                                )}
                                                <div className={`text-[9px] font-bold mt-1 text-right opacity-60 uppercase tracking-wider flex items-center justify-end gap-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {msg.createdAt ? format(msg.createdAt.toDate(), 'HH:mm') : '...'}
                                                    {isMe && (
                                                        <span className={`material-symbols-outlined text-[12px] ${msg.read ? 'text-blue-200' : ''}`}>
                                                            {msg.read ? 'done_all' : 'check'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {isOtherUserTyping() && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-light-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1.5 items-center">
                                            <div className="size-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="size-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="size-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-light-200 shrink-0 relative">
                                {showEmojiPicker && (
                                    <div className="absolute bottom-full left-4 mb-2 z-50 shadow-2xl rounded-lg overflow-hidden">
                                        <EmojiPicker 
                                            onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)} 
                                            width={280}
                                            height={300}
                                            previewConfig={{ showPreview: false }}
                                        />
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-3 text-gray-400 hover:text-primary-vibrant transition-colors bg-light-50 rounded-xl"
                                        title="Insertar emoji"
                                    >
                                        <span className="material-symbols-outlined">mood</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowEmojiPicker(false); fileInputRef.current?.click(); }}
                                        className="p-3 text-gray-400 hover:text-primary-vibrant transition-colors bg-light-50 rounded-xl"
                                        disabled={uploading}
                                    >
                                        <span className="material-symbols-outlined">{uploading ? 'hourglass_empty' : 'add_photo_alternate'}</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={handleTyping}
                                        onClick={() => setShowEmojiPicker(false)}
                                        placeholder="Escribe un mensaje..."
                                        className="flex-1 bg-light-50 border-none rounded-xl px-5 font-medium text-dark-800 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        onClick={() => setShowEmojiPicker(false)}
                                        className="bg-primary-vibrant text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-lg shadow-primary-500/20"
                                    >
                                        <span className="material-symbols-outlined">send</span>
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 opacity-60">
                            <span className="material-symbols-outlined text-6xl mb-4">forum</span>
                            <p className="text-sm font-black uppercase tracking-[0.2em]">Selecciona una conversación</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
