import { SavedSession, UserProfile } from '../types';

declare const gapi: any;
declare const google: any;

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const APP_DATA_FILE_NAME = 'youtube-analyzer-sessions-v1.json';

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;

export const initGapiClient = (callback: () => void) => {
    gapi.load('client', async () => {
        await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        callback();
    });
};

export const initGisClient = (clientId: string, callback: () => void) => {
    if (!clientId) {
        console.error("Google Client ID is missing. GIS client cannot be initialized.");
        return;
    }
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: '',
    });
    gisInited = true;
    callback();
};

const checkReady = (): boolean => gapiInited && gisInited;

export const signIn = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!checkReady()) {
            return reject(new Error("Xác thực của Google chưa sẵn sàng."));
        }

        tokenClient.callback = (resp: any) => {
            if (resp.error !== undefined) {
                reject(resp);
            }
            resolve();
        };

        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    });
};

export const signOut = () => {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
        });
    }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
    try {
        const response = await gapi.client.request({
            'path': 'https://www.googleapis.com/oauth2/v3/userinfo'
        });
        const profile = response.result;
        return {
            name: profile.name,
            email: profile.email,
            picture: profile.picture
        };
    } catch (e) {
        console.error("Lỗi khi tìm nạp hồ sơ người dùng:", e);
        return null;
    }
};

const getAppDataFileId = async (): Promise<string | null> => {
    try {
        const response = await gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            fields: 'files(id, name)',
            pageSize: 10,
        });
        const files = response.result.files;
        const existingFile = files.find((f: any) => f.name === APP_DATA_FILE_NAME);
        return existingFile ? existingFile.id : null;
    } catch (e) {
        console.error("Lỗi khi tìm tệp dữ liệu ứng dụng:", e);
        throw new Error("Không thể truy cập Google Drive. Vui lòng thử đăng nhập lại.");
    }
};

export const loadSessions = async (): Promise<SavedSession[]> => {
    const fileId = await getAppDataFileId();
    if (!fileId) {
        return [];
    }
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });
        return response.body ? JSON.parse(response.body) as SavedSession[] : [];
    } catch (e: any) {
        console.error("Lỗi khi tải phiên từ Drive:", e);
        if (e.status === 404) return [];
        return [];
    }
};

export const saveSessions = async (sessions: SavedSession[]): Promise<void> => {
    const fileId = await getAppDataFileId();
    const content = JSON.stringify(sessions, null, 2);
    
    const metadata = {
        name: APP_DATA_FILE_NAME,
        mimeType: 'application/json',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        close_delim;

    const uploadUrl = fileId
        ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
        : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id`;

    try {
        const accessToken = gapi.client.getToken().access_token;
        const response = await fetch(uploadUrl, {
            method: fileId ? 'PATCH' : 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': `multipart/related; boundary="${boundary}"`
            },
            body: multipartRequestBody
        });
        
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Google Drive API error: ${errorBody.error.message}`);
        }
    } catch (e) {
        console.error("Lỗi khi lưu phiên vào Drive:", e);
        throw new Error("Không thể lưu phiên vào Google Drive.");
    }
};
