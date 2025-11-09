import React, { useState } from 'react';
import { YouTubeIcon } from './Icons';
import { Theme } from '../types';

interface ChannelInputFormProps {
  onSubmit: (urls: string) => void;
  isLoading: boolean;
  theme: Theme;
}

export const ChannelInputForm: React.FC<ChannelInputFormProps> = ({ onSubmit, isLoading, theme }) => {
  const [urls, setUrls] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urls.trim()) {
      onSubmit(urls);
      setUrls(''); // Clear textarea after submitting
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className={`flex items-start bg-[#2d303e] border border-[#414868] rounded-lg p-2 shadow-lg focus-within:ring-2 focus-within:ring-${theme}-500`}>
            <YouTubeIcon className="w-6 h-6 mx-3 text-red-500 mt-2" />
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="Dán một hoặc nhiều link kênh YouTube vào đây, mỗi link một dòng..."
              className="flex-grow bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none h-24"
              rows={3}
              disabled={isLoading}
            />
        </div>
        <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={isLoading || !urls.trim()}
              className={`bg-${theme}-500 hover:bg-${theme}-600 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Thêm vào danh sách
            </button>
        </div>
      </form>
    </div>
  );
};
