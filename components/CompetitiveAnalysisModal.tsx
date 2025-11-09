import React, { useState, useEffect, useMemo } from 'react';
import { SavedSession, StoredConfig, Theme } from '../types';
import { SpinnerIcon, ChartBarIcon, DownloadIcon, ClipboardCopyIcon, UsersIcon, VideoCameraIcon, SparklesIcon, SortAscIcon, SortDescIcon, ClockIcon } from './Icons';
import { formatNumber, formatNumberShort } from '../utils/formatters';

interface CompetitiveAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  appConfig: StoredConfig;
  theme: Theme;
  onStartAnalysis: (selectedChannelIds: string[]) => void;
  analysisState: {
    isLoading: boolean;
    error: string | null;
    result: string;
    isComplete: boolean;
  };
  onResetAnalysis: () => void;
}

type SortKey = 'savedAt' | 'subscriberCount' | 'videoCount' | 'title';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const formatShortDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN');


const parseAndRenderAnalysis = (markdown: string, theme: Theme): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    if (!markdown) return elements;
    
    const lines = markdown.split('\n');

    const renderText = (text: string) => {
        const html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    };

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        if (line.startsWith('# ')) {
            elements.push(<h1 key={i} className={`text-2xl font-bold mt-8 mb-4 text-${theme}-200 border-b-2 border-${theme}-500 pb-2`}>{renderText(line.substring(2))}</h1>);
            i++;
            continue;
        }
        if (line.startsWith('## ')) {
            elements.push(<h2 key={i} className={`text-xl font-bold mt-6 mb-3 text-${theme}-300`}>{renderText(line.substring(3))}</h2>);
            i++;
            continue;
        }
        if (line.startsWith('### ')) {
            elements.push(<h3 key={i} className={`text-xl font-bold mt-5 mb-2 text-${theme}-300`}>{renderText(line.substring(4))}</h3>);
            i++;
            continue;
        }

        if (line.startsWith('|') && line.includes('|')) {
            const tableLines = [];
            while (i < lines.length && lines[i].startsWith('|') && lines[i].includes('|')) {
                tableLines.push(lines[i]);
                i++;
            }

            if (tableLines.length > 1) {
                const headerLine = tableLines[0];
                const separatorLine = tableLines[1];
                
                if (separatorLine.includes('---')) {
                    const headers = headerLine.split('|').map(h => h.trim()).slice(1, -1);
                    const rows = tableLines.slice(2);

                    elements.push(
                        <div key={`table-wrapper-${i}`} className="overflow-x-auto my-4">
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-[#1a1b26]">
                                    <tr>
                                        {headers.map((header, index) => (
                                            <th key={index} className="border border-gray-600 p-3 font-semibold text-left text-gray-200">{renderText(header)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, rowIndex) => {
                                        const cells = row.split('|').map(c => c.trim()).slice(1, -1);
                                        return (
                                            <tr key={rowIndex} className="bg-[#2d303e] odd:bg-[#24283b] border-t border-gray-600">
                                                {cells.map((cell, cellIndex) => (
                                                    <td key={cellIndex} className="border border-gray-600 p-3 text-gray-300 align-top">{renderText(cell)}</td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                } else {
                    tableLines.forEach((tl, idx) => elements.push(<p key={`${i}-${idx}`} className="my-1 leading-relaxed">{renderText(tl)}</p>));
                }
            } else {
                tableLines.forEach((tl, idx) => elements.push(<p key={`${i}-${idx}`} className="my-1 leading-relaxed">{renderText(tl)}</p>));
            }
            continue;
        }

        if (line.trim()) {
            elements.push(<p key={i} className="my-2 leading-relaxed">{renderText(line)}</p>);
        }

        i++;
    }

    return elements;
};

export const CompetitiveAnalysisModal: React.FC<CompetitiveAnalysisModalProps> = ({ isOpen, onClose, sessions, appConfig, theme, onStartAnalysis, analysisState, onResetAnalysis }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'savedAt', direction: 'desc' });

    // FIX: Robustly filter corrupted sessions from localStorage to prevent crashes.
    const validSessions = useMemo(() => {
        // Safety check: Ensure `sessions` is an array before proceeding.
        if (!Array.isArray(sessions)) {
            console.error("CompetitiveAnalysisModal received a non-array value for sessions:", sessions);
            return [];
        }

        // Robustly filter out any sessions that are null, undefined, or missing essential data to prevent crashes.
        return sessions.filter(s =>
            s &&
            typeof s.id === 'string' &&
            typeof s.savedAt === 'string' &&
            s.channelInfo &&
            typeof s.channelInfo === 'object' && s.channelInfo !== null &&
            typeof s.channelInfo.id === 'string' &&
            typeof s.channelInfo.title === 'string' &&
            typeof s.channelInfo.subscriberCount === 'string' &&
            typeof s.channelInfo.videoCount === 'string' &&
            Array.isArray(s.videos)
        );
    }, [sessions]);


    useEffect(() => {
        if (isOpen && !analysisState.isLoading && !analysisState.isComplete) {
            setSelectedChannelIds([]);
            setValidationError(null);
            setSortConfig({ key: 'savedAt', direction: 'desc' });
        }
    }, [isOpen, analysisState.isLoading, analysisState.isComplete]);

    const totalSelectedVideos = useMemo(() => {
        if (selectedChannelIds.length === 0) return 0;
        return validSessions // Use filtered list
            .filter(s => selectedChannelIds.includes(s.id))
            .reduce((total, session) => total + parseInt(session.channelInfo.videoCount || '0', 10), 0);
    }, [selectedChannelIds, validSessions]); // Dependency on filtered list

    const sortedSessions = useMemo(() => {
        return [...validSessions].sort((a, b) => { // Use filtered list
            let aValue: string | number;
            let bValue: string | number;

            switch(sortConfig.key) {
                case 'videoCount':
                    aValue = parseInt(a.channelInfo.videoCount, 10) || 0;
                    bValue = parseInt(b.channelInfo.videoCount, 10) || 0;
                    break;
                case 'subscriberCount':
                    aValue = parseInt(a.channelInfo.subscriberCount, 10) || 0;
                    bValue = parseInt(b.channelInfo.subscriberCount, 10) || 0;
                    break;
                case 'title':
                    aValue = a.channelInfo.title.toLowerCase();
                    bValue = b.channelInfo.title.toLowerCase();
                    break;
                case 'savedAt':
                default:
                    aValue = new Date(a.savedAt).getTime();
                    bValue = new Date(b.savedAt).getTime();
                    // Handle cases where parsing might result in NaN
                    if (isNaN(aValue)) aValue = 0;
                    if (isNaN(bValue)) bValue = 0;
                    break;
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [validSessions, sortConfig]); // Dependency on filtered list


    const handleChannelSelection = (channelId: string) => {
        setSelectedChannelIds(prev =>
            prev.includes(channelId)
                ? prev.filter(id => id !== channelId)
                : [...prev, channelId]
        );
         if (validationError) {
            setValidationError(null);
        }
    };

    const handleStartAndClose = () => {
        if (selectedChannelIds.length < 2) {
            setValidationError("Vui lòng chọn ít nhất 2 kênh để phân tích.");
            return;
        }
        setValidationError(null);
        onStartAnalysis(selectedChannelIds);
        onClose();
    };

    const handleCopy = () => {
        if (!analysisState.result) return;
        navigator.clipboard.writeText(analysisState.result).then(() => {
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        });
    };

    const handleDownload = () => {
        if (!analysisState.result) return;
        const htmlHeader = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Báo cáo Phân tích</title></head><body>";
        const htmlFooter = "</body></html>";
        const htmlContent = htmlHeader + '<pre style="white-space: pre-wrap; font-family: sans-serif;">' + analysisState.result + '</pre>' + htmlFooter;
        
        const blob = new Blob(['\ufeff', htmlContent], {
            type: 'application/msword'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.download = `Phan_tich_doi_thu_${date}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    const renderContent = () => {
        if (analysisState.isLoading) {
            return (
                <div className="text-center py-16 flex-grow flex flex-col justify-center">
                    <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
                    <p className="mt-4 text-lg">AI đang phân tích dữ liệu...</p>
                    <p className="text-sm text-gray-400">Bạn có thể đóng cửa sổ này, quá trình vẫn sẽ tiếp tục chạy ngầm.</p>
                </div>
            );
        }

        if (analysisState.isComplete) {
            return (
                <>
                    <div className="flex-grow flex flex-col min-h-0">
                        {analysisState.error ? (
                            <div className="text-center py-16 flex-grow flex flex-col justify-center">
                                <p className="text-red-400 font-semibold">Đã xảy ra lỗi:</p>
                                <p className="mt-2 text-sm bg-red-900/50 p-3 rounded-md">{analysisState.error}</p>
                            </div>
                        ) : (
                            <div className="flex-grow overflow-y-auto pr-2 relative">
                                <div className="absolute top-0 right-2 flex space-x-2 z-10">
                                    <button onClick={handleCopy} className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded-md text-white relative" title="Sao chép">
                                        <ClipboardCopyIcon className="w-5 h-5"/>
                                        {copyStatus === 'copied' && <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-md">Đã chép!</span>}
                                    </button>
                                    <button onClick={handleDownload} className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded-md text-white" title="Tải về (.doc)">
                                        <DownloadIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="text-sm text-gray-200 bg-[#1a1b26] p-4 rounded-lg leading-relaxed">
                                    {parseAndRenderAnalysis(analysisState.result, theme)}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="pt-4 mt-4 border-t border-gray-700 flex-shrink-0 flex justify-between items-center">
                        <button 
                            onClick={onResetAnalysis}
                            className={`flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm`}
                        >
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            Tạo phiên mới
                        </button>
                        <button 
                            onClick={onClose}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold text-sm py-2 px-4 rounded-md transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </>
            );
        }
        
        // Initial View for channel selection
        return (
            <>
                <div className="flex-grow flex flex-col min-h-0">
                     <div className="text-center flex-shrink-0">
                        <ChartBarIcon className="w-16 h-16 mx-auto text-indigo-400" />
                        <h3 className="mt-4 text-lg font-semibold">Phân tích Đối thủ Cạnh tranh</h3>
                        <p className="mt-2 text-sm text-gray-400">
                            Chọn ít nhất 2 kênh từ thư viện để AI tạo ra một báo cáo so sánh chi tiết.
                        </p>
                    </div>
                    <div className="mt-6 bg-[#1a1b26] p-4 rounded-lg flex-grow flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-3 flex-shrink-0">
                            <h4 className="font-semibold text-left">Chọn các kênh để phân tích:</h4>
                            <div className="flex items-center text-xs">
                                <label htmlFor="sort-key-analysis" className="text-gray-400 mr-2">Sắp xếp:</label>
                                <select
                                    id="sort-key-analysis"
                                    value={sortConfig.key}
                                    onChange={e => setSortConfig(c => ({ ...c, key: e.target.value as SortKey }))}
                                    className="bg-[#2d303e] border border-gray-600 rounded-md px-2 py-1 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="savedAt">Ngày lưu</option>
                                    <option value="subscriberCount">Lượt Sub</option>
                                    <option value="videoCount">Số Video</option>
                                    <option value="title">Tên kênh (A-Z)</option>
                                </select>
                                <button
                                    onClick={() => setSortConfig(c => ({ ...c, direction: c.direction === 'desc' ? 'asc' : 'desc' }))}
                                    className="p-1.5 ml-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
                                    title={sortConfig.direction === 'desc' ? 'Sắp xếp tăng dần' : 'Sắp xếp giảm dần'}
                                >
                                    {sortConfig.direction === 'desc' ? <SortDescIcon className="w-3 h-3" /> : <SortAscIcon className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 overflow-y-auto pr-2 flex-grow">
                            {sortedSessions.map(s => (
                                <label key={s.id} className="flex items-center justify-between p-2 rounded-md hover:bg-[#2d303e] transition-colors duration-200 cursor-pointer">
                                    <div className="flex items-center space-x-3 overflow-hidden mr-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedChannelIds.includes(s.id)}
                                            onChange={() => handleChannelSelection(s.id)}
                                            className={`h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500 focus:ring-2 ring-offset-2 ring-offset-[#1a1b26] flex-shrink-0`}
                                        />
                                        <span className="text-sm text-gray-300 truncate" title={s.channelInfo.title}>{s.channelInfo.title}</span>
                                    </div>
                                    <div className="flex items-center space-x-4 text-xs text-gray-400 flex-shrink-0">
                                        <div className="flex items-center" title="Ngày lưu">
                                            <ClockIcon className="w-4 h-4 mr-1.5" />
                                            <span>{formatShortDate(s.savedAt)}</span>
                                        </div>
                                        <div className="flex items-center" title="Người đăng ký">
                                            <UsersIcon className="w-4 h-4 mr-1.5" />
                                            <span>{formatNumberShort(s.channelInfo.subscriberCount)}</span>
                                        </div>
                                        <div className="flex items-center" title="Video">
                                            <VideoCameraIcon className="w-4 h-4 mr-1.5" />
                                            <span>{formatNumber(s.channelInfo.videoCount)}</span>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex-shrink-0">
                    {validationError && (
                         <p className="text-xs text-red-400 mb-3 text-left px-1">{validationError}</p>
                    )}
                    {selectedChannelIds.length > 0 && selectedChannelIds.length < 2 && (
                        <p className="text-xs text-yellow-400 mb-3 text-left px-1">Vui lòng chọn thêm ít nhất {2 - selectedChannelIds.length} kênh nữa.</p>
                    )}
                    <button 
                        onClick={handleStartAndClose}
                        disabled={selectedChannelIds.length < 2}
                        className={`w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Bắt đầu Phân tích & Chạy ngầm ({selectedChannelIds.length > 0 
                            ? `${selectedChannelIds.length} kênh / ${formatNumber(totalSelectedVideos)} video`
                            : selectedChannelIds.length
                        })
                    </button>
                </div>
            </>
        );
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
            <div
                className={`bg-[#24283b] rounded-lg shadow-2xl p-6 w-full flex flex-col transition-all duration-300 ease-in-out ${
                    analysisState.isLoading || analysisState.isComplete ? 'max-w-5xl' : 'max-w-2xl'
                }`}
                style={{ height: '85vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Báo cáo Phân tích Đối thủ</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};