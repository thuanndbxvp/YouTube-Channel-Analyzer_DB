import React, { useState } from 'react';
import { ChannelInfo, StoredConfig, ChatMessage, Video, Theme } from '../types';
import { BrainstormModal } from './BrainstormModal';
import { SparklesIcon, ArrowPathIcon, SpinnerIcon } from './Icons';

interface AnalysisToolsProps {
    videos: Video[];
    channelInfo: ChannelInfo;
    appConfig: StoredConfig;
    brainstormMessages: ChatMessage[];
    setBrainstormMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    theme: Theme;
    onUpdateChannel: () => void;
    isUpdating: boolean;
    isLoadedFromSession: boolean;
}

export const AnalysisTools: React.FC<AnalysisToolsProps> = ({ 
    videos, 
    channelInfo, 
    appConfig, 
    brainstormMessages, 
    setBrainstormMessages, 
    theme,
    onUpdateChannel,
    isUpdating,
    isLoadedFromSession
}) => {
    const [isBrainstormModalOpen, setIsBrainstormModalOpen] = useState(false);

    const isBrainstormDisabled = (!appConfig.gemini.key || appConfig.gemini.key.trim() === '') && 
                                 (!appConfig.openai.key || appConfig.openai.key.trim() === '');

    return (
        <>
            <BrainstormModal
                isOpen={isBrainstormModalOpen}
                onClose={() => setIsBrainstormModalOpen(false)}
                channelInfo={channelInfo}
                appConfig={appConfig}
                messages={brainstormMessages}
                setMessages={setBrainstormMessages}
                videos={videos}
                theme={theme}
            />
            <div>
                <h2 className={`text-xl font-bold text-${theme}-300 mb-2`}>
                    Công cụ Phân tích & Sáng tạo
                </h2>
                <p className="text-gray-400 mb-4 text-sm">
                    Sử dụng AI để hiểu sâu hơn về kênh và tìm kiếm ý tưởng mới.
                </p>
                <div className="flex flex-col space-y-3">
                    <button 
                        onClick={() => setIsBrainstormModalOpen(true)}
                        disabled={isBrainstormDisabled}
                        title={isBrainstormDisabled ? "Vui lòng thêm API key của Gemini hoặc OpenAI để sử dụng tính năng này" : "Brainstorm ý tưởng & Phân tích kênh với AI"}
                        className={`w-full flex items-center justify-center bg-${theme}-600 hover:bg-${theme}-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed`}>
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        Brainstorm & Phân tích với AI
                    </button>
                    {isLoadedFromSession && (
                        <button
                            onClick={onUpdateChannel}
                            disabled={isUpdating}
                            title="Làm mới dữ liệu kênh từ YouTube"
                            className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isUpdating ? (
                                <SpinnerIcon className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                                <ArrowPathIcon className="h-5 w-5 mr-2" />
                            )}
                            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật kênh'}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};