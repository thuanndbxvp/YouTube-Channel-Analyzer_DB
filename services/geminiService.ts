import { GoogleGenAI } from "@google/genai";
import { ChatMessage, VideoAnalysis } from '../types';

async function executeWithKeyRotation<T>(
    keysString: string,
    apiRequest: (key: string) => Promise<T>
): Promise<T> {
    const keys = keysString.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
        throw new Error("Không có Gemini API key nào được cung cấp.");
    }
    let lastError: any = null;

    for (const key of keys) {
        try {
            const result = await apiRequest(key);
            return result;
        } catch (error: any) {
            lastError = error;
            console.warn(`Gemini API key ...${key.slice(-4)} thất bại. Thử key tiếp theo. Lỗi: ${error.message}`);
            continue;
        }
    }
    throw new Error(`Tất cả API key của Gemini đều không hợp lệ. Lỗi cuối cùng: ${lastError.message}`);
}

export const validateSingleApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      // A simple, low-cost call to check API key validity
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ parts: [{text: 'test'}]}],
      });
      // If it doesn't throw, the key is valid.
      return !!response;
    } catch (error) {
      console.error(`Gemini key validation failed for ...${apiKey.slice(-4)}:`, error);
      return false;
    }
};


export const analyzeVideoContent = async (
  apiKeys: string,
  videoTitle: string,
  videoDescription: string
): Promise<string> => {
  return executeWithKeyRotation(apiKeys, async (apiKey) => {
    if (!apiKey) {
      throw new Error("Gemini API key is not provided.");
    }
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        Please provide a concise summary in Vietnamese for the following YouTube video.
        The summary should be about 2-3 sentences long.
        
        Video Title: "${videoTitle}"
        
        Video Description:
        ---
        ${videoDescription || 'No description provided.'}
        ---
        
        Summary:
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
      });

      return response.text;
    } catch (error) {
      console.error("Error analyzing video with Gemini:", error);
      if (error instanceof Error) {
          throw new Error(`Lỗi từ Gemini API: ${error.message}`);
      }
      throw new Error("Đã xảy ra lỗi không xác định khi phân tích video.");
    }
  });
};

export const generateGeminiChatResponse = async (
  apiKeys: string,
  model: string,
  history: ChatMessage[]
): Promise<string> => {
  return executeWithKeyRotation(apiKeys, async (apiKey) => {
    if (!apiKey) throw new Error("Vui lòng cung cấp Gemini API key.");
    
    const ai = new GoogleGenAI({ apiKey });
    
    const contents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    try {
      const response = await ai.models.generateContent({
        model,
        contents,
      });
      return response.text;
    } catch (error) {
      console.error("Error generating chat response with Gemini:", error);
      if (error instanceof Error) {
          throw new Error(`Lỗi từ Gemini API: ${error.message}`);
      }
      throw new Error("Đã xảy ra lỗi không xác định khi chat với Gemini.");
    }
  });
};

export const performCompetitiveAnalysis = async (
  apiKeys: string,
  model: string,
  csvData: string,
  analysisInstructions: string,
  channelNames: string[]
): Promise<string> => {
  return executeWithKeyRotation(apiKeys, async (apiKey) => {
    if (!apiKey) {
      throw new Error("Gemini API key is not provided.");
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const channelList = channelNames.join(', ');

      const fullPrompt = `
        Với vai trò là một chuyên gia phân tích dữ liệu YouTube, hãy thực hiện nhiệm vụ phân tích cạnh tranh dựa trên các hướng dẫn và dữ liệu được cung cấp.

        **Định nghĩa nhiệm vụ (JSON):**
        \`\`\`json
        ${analysisInstructions}
        \`\`\`

        ---

        **Dữ liệu Video (CSV):**
        Dưới đây là dữ liệu video từ nhiều kênh khác nhau. Các cột bao gồm: Channel Name, Video Title, Publish Date, View Count, Likes, Duration (ISO 8601).

        \`\`\`csv
        ${csvData}
        \`\`\`

        ---

        **Yêu cầu:**
        Hãy thực hiện phân tích theo định nghĩa nhiệm vụ trong file JSON và trả về kết quả.
        Tập trung vào việc tạo ra phần **"text_summary"** trước tiên, định dạng bằng Markdown rõ ràng, dễ đọc, tuân thủ văn phong và cấu trúc đã chỉ định. Sử dụng tiếng Việt cho toàn bộ báo cáo phân tích. Thêm một dòng "Các kênh phân tích: ${channelList}" vào bên dưới dòng "Người thực hiện:" ở đầu báo cáo.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: fullPrompt }] }],
      });

      return response.text;
    } catch (error) {
      console.error("Error performing competitive analysis with Gemini:", error);
      if (error instanceof Error) {
        throw new Error(`Lỗi từ Gemini API: ${error.message}`);
      }
      throw new Error("Đã xảy ra lỗi không xác định khi thực hiện phân tích cạnh tranh.");
    }
  });
};

export const analyzeVideoWithGemini = async (
    apiKeys: string,
    model: string,
    videoId: string,
    videoTitle: string,
    channelTitle: string
): Promise<VideoAnalysis> => {
    return executeWithKeyRotation(apiKeys, async (apiKey) => {
        if (!apiKey) {
            throw new Error("Gemini API key is not provided.");
        }
        try {
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `Bạn là một chuyên gia phân tích video YouTube. Nhiệm vụ của bạn là phân tích video tại URL sau: https://www.youtube.com/watch?v=${videoId}.

Để đảm bảo bạn đang phân tích ĐÚNG video, hãy lưu ý các thông tin sau:
- **Tiêu đề video phải là:** "${videoTitle}"
- **Kênh đăng tải video phải là:** "${channelTitle}"

Hãy sử dụng các thông tin này để xác định chính xác video trước khi phân tích.

Sau khi đã xác định đúng video, vui lòng cung cấp phân tích chi tiết dưới dạng một đối tượng JSON. Đối tượng phải có cấu trúc sau: { "summary": "Một bản tóm tắt ngắn gọn, súc tích về nội dung chính của video (3-4 câu).", "visualStyle": "Phân tích phong cách hình ảnh: tốc độ dựng phim (nhanh/chậm), loại cảnh quay (cận cảnh, toàn cảnh), màu sắc (sặc sỡ, trầm), và các hiệu ứng đặc biệt được sử dụng.", "contentTone": "Phân tích về giọng điệu và phong cách nội dung: trang trọng, hài hước, giáo dục, kể chuyện, bí ẩn, v.v.", "transcript": "Toàn bộ transcript (bản ghi lời nói) của video. Nếu không có, trả về một chuỗi trống." } Chỉ trả về đối tượng JSON, không có bất kỳ văn bản giải thích nào khác.`;
            
            const response = await ai.models.generateContent({
                model,
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                }
            });

            const jsonText = response.text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
            const analysisResult = JSON.parse(jsonText);
            
            if (typeof analysisResult.summary !== 'string' || typeof analysisResult.visualStyle !== 'string' || typeof analysisResult.contentTone !== 'string' || typeof analysisResult.transcript !== 'string') {
                 throw new Error("Định dạng phản hồi từ AI không hợp lệ.");
            }

            return analysisResult;
        } catch (error) {
            console.error("Error analyzing video with Gemini:", error);
            if (error instanceof Error) {
                const message = error.message.includes('JSON') ? 'AI đã trả về định dạng không hợp lệ, vui lòng thử lại.' : error.message;
                throw new Error(`Lỗi từ Gemini API: ${message}`);
            }
            throw new Error("Đã xảy ra lỗi không xác định khi phân tích video.");
        }
    });
};