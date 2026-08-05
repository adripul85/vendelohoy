
import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { FaWhatsapp, FaXTwitter, FaFacebookF } from 'react-icons/fa6';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
}

const ShareModal: React.FC<Props> = ({ isOpen, onClose, title }) => {
    const { notify } = useNotification();
    const shareUrl = window.location.href;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        notify({
            type: 'success',
            title: 'Protocol Link Copied',
            message: 'Target information is now available on your clipboard.',
            icon: 'content_copy'
        });
        onClose();
    };

    if (!isOpen) return null;

    const socialLinks = [
        { name: 'WhatsApp', icon: <FaWhatsapp className="text-xl" />, color: 'bg-[#25D366]', text: 'WHATSAPP', url: `https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}` },
        { name: 'X', icon: <FaXTwitter className="text-xl" />, color: 'bg-dark-900', text: 'X (TWITTER)', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}` },
        { name: 'Facebook', icon: <FaFacebookF className="text-xl" />, color: 'bg-[#1877F2]', text: 'FACEBOOK', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` }
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-dark-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose}>
            <div className="bg-white p-4 md:p-12 max-w-md w-full rounded-[40px] shadow-premium border border-light-200/50 relative animate-in zoom-in duration-500" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 size-10 bg-light-100 hover:bg-light-200 text-dark-800 rounded-xl flex items-center justify-center transition-all group"
                >
                    <span className="material-symbols-outlined font-black group-hover:rotate-90 transition-transform">close</span>
                </button>

                <div className="flex flex-col items-center text-center mb-10">
                    <div className="size-20 bg-primary-50 rounded-3xl mb-6 flex items-center justify-center border border-primary-100 shadow-sm transition-transform hover:scale-110 duration-500">
                        <span className="material-symbols-outlined text-4xl text-primary-vibrant font-black">share_reviews</span>
                    </div>

                    <h3 className="text-2xl font-black text-dark-800 uppercase tracking-tight">Broadcast Asset</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-3 pl-1 leading-relaxed">
                        Transmit protocol intelligence to your network and expand asset visibility.
                    </p>
                </div>

                <div className="space-y-4 mb-10">
                    {socialLinks.map(social => (
                        <a
                            key={social.name}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-5 p-5 ${social.color} text-white rounded-3xl hover:translate-x-1 active:scale-95 transition-all shadow-xl shadow-black/5 group`}
                        >
                            <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center">
                                {social.icon}
                            </div>
                            <span className="font-black text-[10px] uppercase tracking-[0.2em]">{social.text}</span>
                            <span className="material-symbols-outlined ml-auto opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward_ios</span>
                        </a>
                    ))}
                </div>

                <button
                    onClick={copyToClipboard}
                    className="w-full py-5 bg-dark-800 text-white font-black rounded-3xl hover:bg-dark-900 transition-all flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-dark-800/20 active:scale-95"
                >
                    <span className="material-symbols-outlined text-xl">content_copy</span>
                    Duplicate Protocol Link
                </button>
            </div>
        </div>
    );
};

export default ShareModal;
