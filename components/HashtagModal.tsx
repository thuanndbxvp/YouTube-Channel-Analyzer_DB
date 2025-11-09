import React, { useMemo, useState } from 'react';
import { Video, Theme } from '../types';
import { ClipboardCopyIcon } from './Icons';

interface HashtagModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: Video[];
  theme: Theme;
}

export const HashtagModal: React.FC<HashtagModalProps> = ({ isOpen, onClose, videos, theme }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const hashtagCounts = useMemo(() => {
    if (!isOpen) return [];
    const counts = new Map<string, number>();
    const hashtagRegex = /#([\w\u00C0-\u1EF9]+)/g; // Regex for hashtags including Vietnamese characters

    videos.forEach(video => {
      const description = video.snippet.description || '';
      const matches = description.match(hashtagRegex);
      if (matches) {
        matches.forEach(hashtag => {
          const cleanedHashtag = hashtag.toLowerCase();
          counts.set(cleanedHashtag, (counts.get(cleanedHashtag) || 0) + 1);
        });
      }
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1]);
  }, [videos, isOpen]);
  
  const handleCopy = () => {
    const allHashtags = hashtagCounts.map(([tag]) => tag).join('\n');
    navigator.clipboard.writeText(allHashtags).then(() => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-[#24283b] rounded-lg shadow-2xl p-6 w-full max-w-md flex flex-col" style={{ height: '70vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white"># Hashtag được sử dụng</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-2">
          {hashtagCounts.length > 0 ? (
            hashtagCounts.map(([hashtag, count]) => (
              <div key={hashtag} className="flex justify-between items-center bg-[#2d303e] p-2 rounded-md">
                <span className={`text-${theme}-300 text-sm font-medium`}>{hashtag}</span>
                <span className="bg-gray-700 text-gray-200 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
              </div>
            ))
          ) : (
             <div className="text-center text-gray-400 pt-10">Không tìm thấy hashtag nào.</div>
          )}
        </div>

        <div className="mt-6 flex justify-end items-center space-x-2">
          <button onClick={handleCopy} className={`py-2 px-4 rounded-lg bg-${theme}-600 hover:bg-${theme}-700 text-white font-semibold transition-colors flex items-center justify-center`}>
            <ClipboardCopyIcon className="w-5 h-5 mr-2"/>
            {copyStatus === 'copied' ? 'Đã sao chép!' : 'Sao chép tất cả'}
          </button>
           <button onClick={onClose} className="py-2 px-6 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors">Đóng</button>
        </div>
      </div>
    </div>
  );
};