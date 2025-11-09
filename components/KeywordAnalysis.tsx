import React, { useMemo, useState } from 'react';
import { Video, ChannelInfo, Theme } from '../types';
import { DownloadIcon, InformationCircleIcon } from './Icons';
import { formatDate, parseISO8601Duration } from '../utils/formatters';
import { ChannelStatsModal } from './ChannelStatsModal';
import { HashtagModal } from './HashtagModal';
import { calculateKeywordCounts } from '../utils/keywords';

// Make XLSX globally available from the script tag in index.html
declare const XLSX: any;

interface KeywordAnalysisProps {
  videos: Video[];
  channelInfo: ChannelInfo | null;
  theme: Theme;
}

export const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({ videos, channelInfo, theme }) => {
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false);

  const keywordCounts = useMemo(() => {
    return calculateKeywordCounts(videos);
  }, [videos]);

  const hashtagCounts = useMemo(() => {
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
  }, [videos]);


  const topKeywords = Array.from(keywordCounts.entries()).slice(0, 20);

  const handleDownloadChannelData = () => {
    if (!channelInfo) return;
    const safeChannelName = channelInfo.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');

    // 1. Keywords Sheet
    const keywordData = Array.from(keywordCounts.entries()).map(([key, count], index) => ({
      'STT': index + 1,
      'Từ khóa / Cụm từ': key,
      'Số lần xuất hiện': count,
    }));
    const keywordsWorksheet = XLSX.utils.json_to_sheet(keywordData);
    keywordsWorksheet['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 20 }];

    // 2. Videos Sheet
    const videoData = videos.map(video => ({
        'Tiêu đề': video.snippet.title,
        'Mô tả': video.snippet.description,
        'Ngày đăng': formatDate(video.snippet.publishedAt),
        'Lượt xem': parseInt(video.statistics.viewCount, 10),
        'Lượt thích': parseInt(video.statistics.likeCount, 10),
        'Thời lượng': parseISO8601Duration(video.contentDetails.duration),
        'URL': `https://www.youtube.com/watch?v=${video.id}`
    }));
    const videosWorksheet = XLSX.utils.json_to_sheet(videoData);
    videosWorksheet['!cols'] = [
        { wch: 70 }, { wch: 100 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 45 }
    ];
    
    // 3. Hashtags Sheet
    const hashtagData = hashtagCounts.map(([tag, count], index) => ({
        'STT': index + 1,
        'Hashtag': tag,
        'Số lần sử dụng': count
    }));
    const hashtagsWorksheet = XLSX.utils.json_to_sheet(hashtagData);
    hashtagsWorksheet['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 20 }];

    // Create workbook and append sheets
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, videosWorksheet, 'Dữ liệu Video');
    XLSX.utils.book_append_sheet(workbook, hashtagsWorksheet, 'Hashtags');
    XLSX.utils.book_append_sheet(workbook, keywordsWorksheet, 'Từ khóa');
    
    XLSX.writeFile(workbook, `Phantich_Kenh_${safeChannelName}.xlsx`);
  };

  return (
    <div>
        <ChannelStatsModal 
            isOpen={isStatsModalOpen}
            onClose={() => setIsStatsModalOpen(false)}
            channelInfo={channelInfo}
        />
        <HashtagModal
            isOpen={isHashtagModalOpen}
            onClose={() => setIsHashtagModalOpen(false)}
            videos={videos}
            theme={theme}
        />
        <h2 className={`text-xl font-bold text-${theme}-300 mb-4 flex items-center`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            </svg>
            Từ khóa & Cụm từ nổi bật
        </h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {topKeywords.map(([keyword, count]) => (
          <span key={keyword} className="bg-gray-700 text-gray-200 text-sm font-medium px-3 py-1 rounded-full">
            {keyword} <span className="text-xs opacity-75 ml-1">({count})</span>
          </span>
        ))}
      </div>
      <div className="flex items-center space-x-3">
        <button onClick={handleDownloadChannelData} disabled={!channelInfo} className="flex items-center justify-center bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm disabled:opacity-50">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Tải về Dữ liệu Kênh (.xlsx)
        </button>
         <button 
            onClick={() => setIsStatsModalOpen(true)}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm">
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            Thông tin kênh
        </button>
        <button 
             onClick={() => setIsHashtagModalOpen(true)}
            className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm">
            <span className="font-bold text-lg leading-none mr-2 -ml-1">#</span> Thẻ tag
        </button>
      </div>
    </div>
  );
};