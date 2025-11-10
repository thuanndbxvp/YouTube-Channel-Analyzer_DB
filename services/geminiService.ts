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

            const prompt = `**BỐI CẢNH:** Bạn là một hệ thống AI phân tích video, được giao nhiệm vụ phân tích một video YouTube cụ thể từ một URL. Độ chính xác là yếu tố quan trọng nhất. Phân tích sai video sẽ dẫn đến quyết định sai lầm cho người dùng.

**CAM KẾT CỦA BẠN:** "Tôi, với tư cách là một AI, cam kết sẽ truy cập và phân tích video TẠI URL được cung cấp. Tôi sẽ KHÔNG sử dụng kiến thức có sẵn về các video có tiêu đề tương tự. Tôi hiểu rằng việc không tuân thủ sẽ làm cho kết quả của tôi vô giá trị."

**NHIỆM VỤ:**

**BƯỚC 1: XÁC MINH (BẮT BUỘC)**
1. Truy cập URL: https://www.youtube.com/watch?v=${videoId}
2. Trích xuất chính xác tiêu đề video và tên kênh từ URL đó.
3. So sánh thông tin bạn trích xuất được với thông tin dưới đây:
   - **Tiêu đề video yêu cầu:** "${videoTitle}"
   - **Kênh yêu cầu:** "${channelTitle}"

**BƯỚC 2: PHÂN TÍCH (CHỈ KHI XÁC MINH THÀNH CÔNG)**
Nếu và chỉ nếu thông tin bạn trích xuất khớp CHÍNH XÁC với thông tin yêu cầu, hãy tiến hành phân tích video đó.

**YÊU CẦU ĐỊNH DẠNG ĐẦU RA (JSON BẮT BUỘC):**
Bạn PHẢI trả lời bằng một đối tượng JSON duy nhất. KHÔNG thêm bất kỳ văn bản nào khác.

\`\`\`json
{
  "verification": {
    "is_match": boolean,
    "found_title": "string // Tiêu đề bạn thực sự tìm thấy tại URL.",
    "found_channel": "string // Tên kênh bạn thực sự tìm thấy tại URL."
  },
  "analysis": {
    "summary": "string // (Chỉ điền nếu is_match = true) Tóm tắt nội dung chính của video (3-4 câu).",
    "visualStyle": "string // (Chỉ điền nếu is_match = true) Phân tích phong cách hình ảnh.",
    "contentTone": "string // (Chỉ điền nếu is_match = true) Phân tích giọng điệu và phong cách.",
    "transcript": "string // (Chỉ điền nếu is_match = true) Transcript đầy đủ. Trả về chuỗi rỗng nếu không có."
  }
}
\`\`\`

**QUY TẮC TUYỆT ĐỐI:**
- Nếu \`is_match\` là \`false\`, tất cả các trường trong \`analysis\` PHẢI là chuỗi rỗng.
- Toàn bộ phản hồi của bạn PHẢI là một khối mã JSON hợp lệ.`;
            
            const response = await ai.models.generateContent({
                model,
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                }
            });

            const jsonText = response.text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
            const analysisResult = JSON.parse(jsonText) as VideoAnalysis;
            
             // Basic validation of the returned structure
            if (!analysisResult.verification || !analysisResult.analysis) {
                 throw new Error("Định dạng phản hồi từ AI không hợp lệ. Thiếu mục 'verification' hoặc 'analysis'.");
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