import React, { useMemo, useRef } from 'react';
import { SavedSession, Theme } from '../types';
import { TrashIcon, UsersIcon, VideoCameraIcon, ClockIcon, ArrowPathIcon, SpinnerIcon, UploadIcon, DownloadIcon } from './Icons';
import { formatNumber } from '../utils/formatters';
import { User } from '@supabase/supabase-js';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  onLoad: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onUpdate: (sessionId: string) => void;
  updatingSessionId: string | null;
  theme: Theme;
  onExportExcel: () => void;
  onExportJson: () => void;
  onImport: (sessions: SavedSession[]) => void;
  user: User | null;
}


const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, sessions, onLoad, onDelete, onUpdate, updatingSessionId, theme, onExportExcel, onExportJson, onImport, user }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const validSessions = useMemo(() => {
    if (!Array.isArray(sessions)) {
        console.error("LibraryModal received a non-array value for sessions:", sessions);
        return [];
    }

    const filteredSessions = sessions.filter(s => 
      s && 
      typeof s.id === 'string' &&
      s.channelInfo &&
      typeof s.channelInfo === 'object' && s.channelInfo !== null &&
      typeof s.channelInfo.title === 'string' &&
      typeof s.channelInfo.thumbnail === 'string' &&
      Array.isArray(s.videos) &&
      typeof s.savedAt === 'string'
    );
    
    // Sort by saved date descending (most recent first) as a default.
    return [...filteredSessions].sort((a, b) => {
        const aTime = new Date(a.savedAt).getTime();
        const bTime = new Date(b.savedAt).getTime();
        return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
    });

  }, [sessions]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = e.target?.result;
            if (typeof result === 'string') {
                const parsedSessions = JSON.parse(result);
                onImport(parsedSessions);
            }
        } catch (error) {
            console.error("Error parsing imported sessions:", error);
            alert(`Lỗi khi đọc tệp: ${error instanceof Error ? error.message : 'Định dạng không hợp lệ.'}`);
        }
    };
    reader.onerror = () => {
        alert('Lỗi: Không thể đọc tệp.');
    };
    reader.readAsText(file);
    
    if (event.target) {
        event.target.value = '';
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-[#24283b] rounded-lg shadow-2xl p-6 w-full max-w-4xl flex flex-col" style={{ height: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Thư viện phiên làm việc</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none" title="Đóng cửa sổ">&times;</button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-3">
          {validSessions.length > 0 ? (
            validSessions.map(session => (
              <div key={session.id} className="flex items-center bg-[#2d303e] p-3 rounded-lg">
                <img src={session.channelInfo.thumbnail} alt={session.channelInfo.title} className="w-16 h-16 rounded-full mr-4" />
                <div className="flex-grow">
                    <h3 className={`font-bold text-${theme}-300`}>{session.channelInfo.title}</h3>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-2">
                        <div className="flex items-center" title="Người đăng ký">
                            <UsersIcon className="w-4 h-4 mr-1.5" />
                            <span>{formatNumber(session.channelInfo.subscriberCount)} subs</span>
                        </div>
                        <div className="flex items-center" title="Số lượng video">
                            <VideoCameraIcon className="w-4 h-4 mr-1.5" />
                            <span>{formatNumber(session.channelInfo.videoCount)} videos</span>
                        </div>
                        <div className="flex items-center" title="Ngày lưu">
                            <ClockIcon className="w-4 h-4 mr-1.5" />
                            <span>Lưu: {formatDate(session.savedAt)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onUpdate(session.id)}
                        disabled={!!updatingSessionId}
                        className={`bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm py-2 px-4 rounded-md transition-colors flex items-center justify-center w-28
                                  disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Cập nhật dữ liệu mới nhất cho kênh này"
                    >
                        {updatingSessionId === session.id ? (
                            <>
                                <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                                Đang...
                            </>
                        ) : (
                            'Cập nhật'
                        )}
                    </button>
                    <button 
                        onClick={() => onLoad(session.id)}
                        className={`bg-${theme}-600 hover:bg-${theme}-700 text-white font-semibold text-sm py-2 px-4 rounded-md transition-colors`}
                        title="Tải lại phiên làm việc này vào giao diện chính"
                    >
                        Tải lại
                    </button>
                    <button 
                        onClick={() => onDelete(session.id)}
                        className="bg-red-800 hover:bg-red-900 text-white p-2.5 rounded-md transition-colors"
                        title="Xóa vĩnh viễn phiên làm việc này"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 pt-16">
                <p className="text-lg">Thư viện của bạn trống.</p>
                <p className="text-sm mt-2">Phân tích một kênh và dữ liệu sẽ được tự động lưu vào đây.</p>
            </div>
          )}
        </div>

        <div className="p-2 text-center text-xs text-gray-400 mt-2 flex-shrink-0">
          {user
            ? `Thư viện của bạn được đồng bộ và lưu trữ an toàn trên đám mây.`
            : 'Bạn chưa đăng nhập. Thư viện chỉ được lưu trên thiết bị này.'
          }
        </div>

        <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                 <button 
                    onClick={handleImportClick}
                    className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-semibold text-sm py-2 px-4 rounded-md transition-colors"
                    title="Nhập thư viện từ tệp .json"
                >
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Nhập JSON
                </button>
                 <button 
                    onClick={onExportJson}
                    disabled={validSessions.length === 0}
                    className="flex items-center justify-center bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                    title="Xuất tất cả các kênh trong thư viện ra tệp .json"
                >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Xuất JSON
                </button>
                 <button 
                    onClick={onExportExcel}
                    disabled={validSessions.length === 0}
                    className="flex items-center justify-center bg-green-700 hover:bg-green-800 text-white font-semibold text-sm py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                    title="Xuất tất cả các kênh trong thư viện ra tệp .xlsx"
                >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Xuất Excel
                </button>
            </div>
           <button onClick={onClose} className="py-2 px-6 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors" title="Đóng cửa sổ thư viện">Đóng</button>
        </div>
      </div>
    </div>
  );
};