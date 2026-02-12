
import React from 'react';
import { Message } from '../types';
import { MapPin, Clock, Info, MessageSquareOff } from 'lucide-react';

interface MessageViewProps {
  messages: Message[];
  currentUserId: string;
}

const MessageView: React.FC<MessageViewProps> = ({ messages, currentUserId }) => {
  const sortedMessages = [...messages].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Vos Instructions</h2>
        <p className="text-slate-500 text-sm">Lieux et heures de retrait de vos colis</p>
      </div>

      <div className="space-y-4">
        {sortedMessages.length === 0 ? (
          <div className="py-16 text-center text-slate-300 flex flex-col items-center">
            <MessageSquareOff size={48} className="mb-4 opacity-20" />
            <p className="font-medium italic opacity-60">Aucun message pour le moment</p>
          </div>
        ) : sortedMessages.map(msg => (
          <div key={msg.id} className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm ${msg.toUserId === currentUserId ? 'border-l-4 border-l-emerald-500' : 'opacity-60'}`}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {new Date(msg.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
              {msg.fromUserId === currentUserId && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Envoyé</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {msg.location && (
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
                  <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm"><MapPin size={18} /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Lieu</p>
                    <p className="text-sm font-semibold text-slate-700">{msg.location}</p>
                  </div>
                </div>
              )}
              {msg.pickupTime && (
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
                  <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm"><Clock size={18} /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Horaire</p>
                    <p className="text-sm font-semibold text-slate-700">{msg.pickupTime}</p>
                  </div>
                </div>
              )}
            </div>

            {msg.content && (
              <div className="flex items-start gap-3 mt-4 pt-4 border-t border-slate-50">
                <Info size={16} className="text-slate-300 mt-1 shrink-0" />
                <p className="text-slate-600 text-sm leading-relaxed">{msg.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageView;
