


import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from '../types';

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
        ${analysisInstructions}

        ---
        ### DỮ LIỆU ĐỂ PHÂN TÍCH

        Dưới đây là dữ liệu video từ các kênh được cung cấp dưới dạng CSV.

        \`\`\`csv
        ${csvData}
        \`\`\`

        ---
        ### YÊU CẦU THỰC HIỆN

        Bây giờ, hãy bắt đầu phân tích và tạo báo cáo theo đúng cấu trúc đã yêu cầu.
        Hãy thay thế "[Ngày hiện tại]" bằng ngày hôm nay và "[Liệt kê các kênh được phân tích]" bằng: ${channelList}.
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

export const generateTranscriptWithGemini = async (
    apiKeys: string,
    model: string,
    videoId: string
): Promise<string> => {
    return executeWithKeyRotation(apiKeys, async (apiKey) => {
        if (!apiKey) {
            throw new Error("Gemini API key is not provided.");
        }
        try {
            const ai = new GoogleGenAI({ apiKey });
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

            const prompt = `Vui lòng trích xuất transcript (bản ghi lời) chính xác cho video tại URL sau: ${videoUrl}. Chỉ trả về nội dung transcript. Nếu video không có transcript hoặc không thể truy cập, hãy trả về duy nhất chuỗi: "ERROR: Không thể lấy được transcript cho video này."`;
            
            const response = await ai.models.generateContent({
                model,
                contents: [{ parts: [{ text: prompt }] }],
            });

            return response.text;
        } catch (error) {
            console.error("Error generating transcript with Gemini:", error);
            if (error instanceof Error) {
                throw new Error(`Lỗi từ Gemini API: ${error.message}`);
            }
            throw new Error("Đã xảy ra lỗi không xác định khi tạo transcript.");
        }
    });
};