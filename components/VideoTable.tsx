import React, { useState, useMemo } from 'react';
import { Video, Theme } from '../types';
import { EyeIcon, LikeIcon, PlayIcon, SortAscIcon, SortDescIcon, ClockIcon, DocumentTextIcon } from './Icons';
import { parseISO8601Duration, formatNumber, formatDate } from '../utils/formatters';

interface VideoTableProps {
  videos: Video[];
  theme: Theme;
  onGetTranscript: (video: Video) => void;
}

type SortKey = 'publishedAt' | 'viewCount' | 'likeCount' | 'duration';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey | null;
  direction: SortDirection;
}

const SortableHeader: React.FC<{
  title: string;
  sortKey: SortKey;
  sortConfig: SortConfig;
  requestSort: (key: SortKey) => void;
  className?: string;
}> = ({ title, sortKey, sortConfig, requestSort, className }) => {
  const isSorted = sortConfig.key === sortKey;
  const Icon = isSorted ? (sortConfig.direction === 'desc' ? SortDescIcon : null) : null;
  const SortIndicator = isSorted ? (sortConfig.direction === 'desc' ? <SortDescIcon className="w-3 h-3 ml-1" /> : <SortAscIcon className="w-3 h-3 ml-1" />) : <SortDescIcon className="w-3 h-3 ml-1 text-transparent group-hover:text-gray-500" />;


  return (
    <th className={`group p-4 text-sm font-semibold tracking-wide text-left cursor-pointer ${className}`} onClick={() => requestSort(sortKey)}>
      <div className="flex items-center">
        {title}
        {isSorted ? (sortConfig.direction === 'desc' ? <SortDescIcon className="w-3 h-3 ml-1" /> : <SortAscIcon className="w-3 h-3 ml-1" />) : null}
      </div>
    </th>
  );
};

export const VideoTable: React.FC<VideoTableProps> = ({ videos, theme, onGetTranscript }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'publishedAt', direction: 'desc' });

  const sortedVideos = useMemo(() => {
    let sortableItems = [...videos];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortConfig.key) {
          case 'viewCount':
          case 'likeCount':
            aValue = parseInt(a.statistics[sortConfig.key] || '0', 10);
            bValue = parseInt(b.statistics[sortConfig.key] || '0', 10);
            break;
          case 'publishedAt':
            aValue = new Date(a.snippet[sortConfig.key]).getTime();
            bValue = new Date(b.snippet[sortConfig.key]).getTime();
            break;
          case 'duration':
             const parseDuration = (iso: string) => {
                const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
                const [, hours = 0, minutes = 0, seconds = 0] = (iso.match(regex) || []).map(v => parseInt(v || '0', 10));
                return hours * 3600 + minutes * 60 + seconds;
            };
            aValue = parseDuration(a.contentDetails.duration);
            bValue = parseDuration(b.contentDetails.duration);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [videos, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="overflow-x-auto mt-8">
      <table className="w-full table-auto border-collapse">
        <thead className="bg-[#1a1b26] text-gray-400">
          <tr>
            <th className="p-4 text-sm font-semibold tracking-wide text-left w-12">#</th>
            <th className="p-4 text-sm font-semibold tracking-wide text-left" style={{width: '35%'}}>TIÊU ĐỀ VIDEO</th>
            <th className="p-4 text-sm font-semibold tracking-wide text-left" style={{width: '20%'}}>MÔ TẢ VIDEO</th>
            <SortableHeader title="NGÀY ĐĂNG" sortKey="publishedAt" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader title="LƯỢT XEM" sortKey="viewCount" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader title="LƯỢT THÍCH" sortKey="likeCount" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader title="THỜI LƯỢNG" sortKey="duration" sortConfig={sortConfig} requestSort={requestSort} />
            <th className="p-4 text-sm font-semibold tracking-wide text-center">HÀNH ĐỘNG</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sortedVideos.map((video, index) => (
            <tr key={video.id} className="bg-[#24283b] hover:bg-[#2d303e]">
              <td className="p-4 text-sm text-gray-300 align-top">{index + 1}</td>
              <td className={`p-4 text-sm text-${theme}-200 font-bold align-top`}>
                {video.snippet.title}
              </td>
              <td className="p-4 text-xs text-gray-400 align-top">
                <div className="max-h-28 overflow-y-auto pr-2 whitespace-pre-wrap">
                    {video.snippet.description || 'Không có mô tả.'}
                </div>
              </td>
              <td className="p-4 text-sm text-gray-300 whitespace-nowrap align-top">{formatDate(video.snippet.publishedAt)}</td>
              <td className="p-4 text-sm text-gray-300 whitespace-nowrap align-top">
                <div className="flex items-center">
                    <EyeIcon className="w-5 h-5 mr-1.5 text-blue-400"/>
                    {formatNumber(video.statistics.viewCount)}
                </div>
              </td>
              <td className="p-4 text-sm text-gray-300 whitespace-nowrap align-top">
                <div className="flex items-center">
                    <LikeIcon className="w-5 h-5 mr-1.5 text-pink-400"/>
                    {formatNumber(video.statistics.likeCount)}
                </div>
              </td>
              <td className="p-4 text-sm text-gray-300 whitespace-nowrap align-top">
                 <div className="flex items-center">
                    <ClockIcon className="w-5 h-5 mr-1.5 text-gray-400"/>
                    {parseISO8601Duration(video.contentDetails.duration)}
                </div>
              </td>
              <td className="p-4 text-sm text-center align-top">
                 <div className="flex items-center justify-center space-x-2">
                    <a 
                        href={`https://www.youtube.com/watch?v=${video.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title="Đi tới video"
                        className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-lg transition-colors duration-200"
                    >
                        <PlayIcon className="w-4 h-4" />
                    </a>
                     <button
                        onClick={() => onGetTranscript(video)}
                        title="Lấy transcript video"
                        className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-colors duration-200"
                    >
                        <DocumentTextIcon className="w-4 h-4" />
                    </button>
                 </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};