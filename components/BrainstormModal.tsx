import React, { useState, useEffect, useRef } from 'react';
import { ChannelInfo, StoredConfig, AiProvider, ChatMessage, Video, Theme } from '../types';
import { generateGeminiChatResponse } from '../services/geminiService';
import { generateOpenAIChatResponse } from '../services/openaiService';
import { PaperAirplaneIcon, UsersIcon, ExpandIcon, ShrinkIcon, ClipboardCopyIcon, DownloadIcon } from './Icons';
import { formatDate, formatNumber, parseISO8601Duration } from '../utils/formatters';

interface BrainstormModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelInfo: ChannelInfo;
  appConfig: StoredConfig;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  videos: Video[];
  theme: Theme;
}

const ANALYSIS_PROMPT_IDENTIFIER = "Với tư cách là một chuyên gia phân tích kênh YouTube";

export const BrainstormModal: React.FC<BrainstormModalProps> = ({ isOpen, onClose, channelInfo, appConfig, messages, setMessages, videos, theme }) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to the bottom of the chat
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const formatChatForExport = (): string => {
    return messages.map(msg => {
        const prefix = msg.role === 'user' ? 'Bạn' : 'AI';
        return `${prefix}:\n${msg.content}`;
    }).join('\n\n----------------------------------------\n\n');
  };

  const handleCopyChat = () => {
    const chatContent = formatChatForExport();
    navigator.clipboard.writeText(chatContent).then(() => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  const handleDownloadChat = () => {
    const chatContent = formatChatForExport();
    const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeChannelName = channelInfo.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
    link.download = `AI_Brainstorm_${safeChannelName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  const handleAudienceAnalysis = async () => {
    if (isAnalyzing || isLoading) {
        return;
    }

    setIsLoading(true);
    setIsAnalyzing(true);
    
    const videoDataSummary = videos.slice(0, 50).map((video, index) => {
        return `
---
Video ${index + 1}:
- Tiêu đề: ${video.snippet.title}
- Ngày đăng: ${formatDate(video.snippet.publishedAt)}
- Lượt xem: ${formatNumber(video.statistics.viewCount)}
- Lượt thích: ${formatNumber(video.statistics.likeCount)}
- Thời lượng: ${parseISO8601Duration(video.contentDetails.duration)}
- Mô tả: ${(video.snippet.description || 'Không có').substring(0, 250)}...
---
`.trim();
    }).join('\n\n');

    const audienceAnalysisPrompt = `${ANALYSIS_PROMPT_IDENTIFIER}, hãy thực hiện một bài phân tích sâu về đối tượng khán giả của kênh "${channelInfo.title}", dựa trên dữ liệu từ các video gần đây.

Dưới đây là dữ liệu thô từ ${videos.length} video gần đây nhất để bạn tham khảo:

${videoDataSummary}

Vui lòng sử dụng dữ liệu trên để thực hiện phân tích và tuân thủ cấu trúc sau:

1. **Xác định mục tiêu phân tích**
   - 📈 **Chiến lược nội dung:** Các chủ đề, tần suất, phong cách chính của kênh là gì?
   - 🎯 **Đối tượng khán giả mục tiêu:** Mô tả chân dung khán giả (độ tuổi, sở thích, hành vi xem).
   - 💰 **Hiệu quả hoạt động:** Đánh giá sơ bộ về lượt xem, tương tác, và tốc độ tăng trưởng.
   - 🧠 **Điểm khác biệt:** Yếu tố nào làm nên thương hiệu riêng cho kênh?

2. **Phân loại nội dung & Chủ đề**
   - Dựa trên danh sách các video đã cung cấp, hãy nhóm chúng vào các chủ đề chính.

3. **Phân tích định lượng (Quantitative Analysis)**
   - Lượt xem trung bình/video là bao nhiêu?
   - Tỷ lệ tương tác (like/view) ước tính.
   - Tần suất đăng tải video (ví dụ: hàng tuần, hàng tháng).
   - Thời lượng video trung bình.
   - Có xu hướng chủ đề nào đang tăng trưởng về lượt xem không?

4. **Phân tích định tính (Qualitative Analysis)**
   - **Cấu trúc nội dung:** Mô tả cấu trúc kể chuyện điển hình (Mở đầu – Phát triển – Kết luận).
   - **Phong cách kể chuyện:** Kênh theo phong cách nào (Tài liệu, bí ẩn, tâm lý, điện ảnh, v.v.)?
   - **Tone thương hiệu:** Tông giọng của kênh là gì (Nghiêm túc, bí ẩn, học thuật, hoài cổ)?
   - **Hình ảnh & Âm nhạc:** Nhận xét về tone màu, nhịp độ dựng phim, và cách sử dụng nhạc nền.
   - **Tổng kết:** Kênh mang lại trải nghiệm cảm xúc gì cho người xem?

Hãy trình bày phân tích của bạn một cách chi tiết và chuyên nghiệp, sử dụng dữ liệu đã cung cấp làm cơ sở.`;

    const userMessage: ChatMessage = { role: 'user', content: audienceAnalysisPrompt };
    
    const initialMessages = messages.length > 1 ? messages : [];
    const historyForApi = [...initialMessages, userMessage];

    setMessages(historyForApi);

    try {
        let response: string;
        if (appConfig.aiProvider === 'gemini') {
            response = await generateGeminiChatResponse(appConfig.gemini.key, appConfig.aiModel, historyForApi);
        } else {
            response = await generateOpenAIChatResponse(appConfig.openai.key, appConfig.aiModel, historyForApi);
        }
        const finalAiMessage: ChatMessage = { role: 'model', content: response };
        
        const suggestionMessage: ChatMessage = {
            role: 'model',
            content: `Tuyệt vời! Dựa trên phân tích vừa rồi, bạn muốn khám phá tiếp theo về điều gì?

**1. Bắt chước & Cải tiến:**
*   "Dựa vào phong cách của kênh này, hãy gợi ý 5 ý tưởng video tương tự."
*   "Viết một kịch bản ngắn cho video theo chủ đề [chủ đề nổi bật] giống như kênh này."
*   "Những yếu tố nào tôi nên tập trung để tái tạo lại sự thành công của họ?"

**2. Sáng tạo & Đột phá:**
*   "Từ dữ liệu đã phân tích, hãy đề xuất 3 hướng đi mới cho một kênh có chủ đề tương tự."
*   "Khán giả của kênh này có thể còn quan tâm đến những chủ đề nào khác chưa được khai thác?"
*   "Làm thế nào để tôi tạo ra sự khác biệt so với kênh này?"

Bạn chỉ cần sao chép và dán một trong các câu hỏi trên hoặc đặt câu hỏi của riêng bạn!`
        };

        setMessages(prev => [...prev, finalAiMessage, suggestionMessage]);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
        const errorAiMessage: ChatMessage = { role: 'model', content: `Lỗi: ${errorMessage}` };
        setMessages(prev => [...prev, errorAiMessage]);
    } finally {
        setIsLoading(false);
        setIsAnalyzing(false);
    }
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = currentMessage.trim();
    if (!trimmedMessage || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmedMessage };
    setMessages(prev => [...prev, userMessage]);
    const historyForApi = [...messages, userMessage];
    
    setCurrentMessage('');
    setIsLoading(true);

    try {
        let response: string;
        if (appConfig.aiProvider === 'gemini') {
            response = await generateGeminiChatResponse(appConfig.gemini.key, appConfig.aiModel, historyForApi);
        } else {
            response = await generateOpenAIChatResponse(appConfig.openai.key, appConfig.aiModel, historyForApi);
        }
        setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
        setMessages(prev => [...prev, { role: 'model', content: `Lỗi: ${errorMessage}` }]);
    } finally {
        setIsLoading(false);
    }
  };

  const hasExistingAnalysis = messages.some(
    msg => msg.role === 'user' && msg.content.startsWith(ANALYSIS_PROMPT_IDENTIFIER)
  );


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div 
        className={`bg-[#24283b] flex flex-col transition-all duration-300 ease-in-out ${
          isFullScreen 
          ? 'w-screen h-screen rounded-none' 
          : 'rounded-lg shadow-2xl w-full max-w-2xl'
        }`}
        style={!isFullScreen ? { height: '80vh' } : {}}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold text-white">Brainstorm & Phân tích với AI</h2>
             <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={handleCopyChat}
                        className="text-gray-400 hover:text-white relative"
                        title="Sao chép cuộc trò chuyện"
                    >
                        <ClipboardCopyIcon className="w-5 h-5" />
                         {copyStatus === 'copied' && (
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-md">
                                Đã chép!
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={handleDownloadChat}
                        className="text-gray-400 hover:text-white"
                        title="Tải về cuộc trò chuyện (.txt)"
                    >
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                      onClick={() => setIsFullScreen(!isFullScreen)} 
                      className="text-gray-400 hover:text-white" 
                      title={isFullScreen ? "Thu nhỏ" : "Phóng to"}
                  >
                      {isFullScreen ? <ShrinkIcon className="w-5 h-5" /> : <ExpandIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
             </div>
          </div>
          <p className="text-sm text-gray-400">Kênh đang phân tích: {channelInfo.title} | Model: <span className="font-semibold">{appConfig.aiModel}</span></p>
        </div>

        <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg ${isFullScreen ? 'w-full' : 'max-w-lg'} ${msg.role === 'user' ? `bg-${theme}-700 text-white` : 'bg-gray-700 text-gray-200'}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="max-w-lg p-3 rounded-lg bg-gray-700 text-gray-200">
                        <div className="flex items-center space-x-2">
                           <div className={`w-2 h-2 bg-${theme}-300 rounded-full animate-pulse`}></div>
                           <div className={`w-2 h-2 bg-${theme}-300 rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
                           <div className={`w-2 h-2 bg-${theme}-300 rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="mb-2">
                <button
                    onClick={handleAudienceAnalysis}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center text-sm bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <UsersIcon className="h-5 w-5 mr-2" />
                    {isAnalyzing ? 'Đang phân tích...' : (hasExistingAnalysis ? 'Phân tích lại kênh' : 'Phân tích kênh')}
                </button>
          </div>
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Nhập câu hỏi hoặc ý tưởng của bạn..."
              className={`w-full bg-[#1a1b26] border border-[#414868] rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-${theme}-500 outline-none`}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !currentMessage.trim()} className={`bg-${theme}-600 hover:bg-${theme}-700 text-white p-2.5 rounded-lg disabled:opacity-50 transition-colors`}>
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};