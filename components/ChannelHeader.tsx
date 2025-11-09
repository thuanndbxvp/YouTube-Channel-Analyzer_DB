
import React from 'react';
import { ChannelInfo } from '../types';
import { YouTubeIcon, UsersIcon, VideoCameraIcon, LinkIcon } from './Icons';
import { formatNumber } from '../utils/formatters';

interface ChannelHeaderProps {
  channelInfo: ChannelInfo;
}

export const ChannelHeader: React.FC<ChannelHeaderProps> = ({ channelInfo }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b border-gray-700">
      <img 
        src={channelInfo.thumbnail}
        alt={`${channelInfo.title} thumbnail`}
        className="w-32 h-32 rounded-full shadow-lg" 
      />
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">{channelInfo.title}</h1>
          <YouTubeIcon className="w-8 h-8" />
        </div>
        <a 
            href={channelInfo.customUrl ? `https://www.youtube.com/${channelInfo.customUrl}` : `https://www.youtube.com/channel/${channelInfo.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-300 transition-colors mt-1"
        >
            <LinkIcon className="w-4 h-4" />
            <span>{channelInfo.customUrl || `channel/${channelInfo.id}`}</span>
        </a>

        <div className="flex items-center gap-6 mt-4 text-gray-300">
            <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-gray-400" />
                <div>
                    <span className="font-bold text-white">{formatNumber(channelInfo.subscriberCount)}</span>
                    <span className="text-sm"> người đăng ký</span>
                </div>
            </div>
             <div className="flex items-center gap-2">
                <VideoCameraIcon className="w-5 h-5 text-gray-400" />
                 <div>
                    <span className="font-bold text-white">{formatNumber(channelInfo.videoCount)}</span>
                    <span className="text-sm"> video</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
