import React from 'react';
import { ChannelInfo } from '../types';
import { formatNumber } from '../utils/formatters';
import { LinkIcon, GlobeAltIcon, InformationCircleIcon, UsersIcon, VideoCameraIcon } from './Icons';

interface ChannelStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelInfo: ChannelInfo | null;
}

const InfoItem: React.FC<{ icon: React.ReactNode, label: string, value?: string | number | null }> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-center text-sm">
            <div className="text-gray-400 mr-2">{icon}</div>
            <span className="text-gray-300">{value}</span>
        </div>
    );
};

const formatJoinDate = (dateString: string): string => {
    return `Đã tham gia ${new Date(dateString).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })}`;
}


export const ChannelStatsModal: React.FC<ChannelStatsModalProps> = ({ isOpen, onClose, channelInfo }) => {
  if (!isOpen || !channelInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-[#24283b] rounded-lg shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl font-bold text-white">{channelInfo.title}</h2>
           <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>

        <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed max-h-40 overflow-y-auto pr-2">
            {channelInfo.description || 'Kênh này không có mô tả.'}
        </div>

        <hr className="border-gray-600 my-6" />

        <div>
            <h3 className="text-lg font-semibold text-white mb-4">Thông tin khác</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                 <InfoItem 
                    icon={<LinkIcon className="w-5 h-5"/>} 
                    label="URL" 
                    value={channelInfo.customUrl ? `www.youtube.com/${channelInfo.customUrl}` : `www.youtube.com/channel/${channelInfo.id}`}
                />
                 <InfoItem 
                    icon={<GlobeAltIcon className="w-5 h-5"/>} 
                    label="Quốc gia" 
                    value={channelInfo.country}
                />
                 <InfoItem 
                    icon={<InformationCircleIcon className="w-5 h-5"/>} 
                    label="Ngày tham gia" 
                    value={formatJoinDate(channelInfo.publishedAt)}
                />
                 <InfoItem 
                    icon={<UsersIcon className="w-5 h-5"/>} 
                    label="Người đăng ký" 
                    value={`${formatNumber(channelInfo.subscriberCount)} người đăng ký`}
                />
                 <InfoItem 
                    icon={<VideoCameraIcon className="w-5 h-5"/>} 
                    label="Video" 
                    value={`${formatNumber(channelInfo.videoCount)} video`}
                />
            </div>
        </div>
      </div>
    </div>
  );
};