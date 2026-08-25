/**
 * Client gọi API backend.
 *
 * Hai điểm quan trọng:
 *
 * 1. **Hai base URL khác nhau.** Server Component fetch từ TRONG container nên phải
 *    dùng tên service Docker (`http://backend:8080`); browser thì dùng
 *    `http://localhost:8080`. Dùng sai một trong hai là lỗi "connection refused" rất
 *    khó đoán. Hàm {@link resolveBaseUrl} chọn đúng theo môi trường đang chạy.
 *
 * 2. **Lỗi được parse thành {@link ApiError} có kiểu.** Backend trả `ProblemDetail`
 *    (RFC 7807) kèm trường `code`, nên UI phân nhánh theo `code` chứ không so sánh
 *    chuỗi thông báo.
 */

import type { ProblemDetail } from '@/types/domain';

/** Lỗi API đã được chuẩn hoá — component bắt lỗi này thay vì đọc Response thô. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string>;

  constructor(problem: ProblemDetail) {
    super(problem.detail || problem.title);
    this.name = 'ApiError';
    this.status = problem.status;
    this.code = problem.code ?? 'UNKNOWN';
    this.fieldErrors = problem.fieldErrors ?? {};
  }

  /** Vượt hạn ngạch (BR-DUB-06, BR-MAT-08, BR-TUTOR-04, BR-DISCOVERY-01). */
  get isQuotaExceeded(): boolean {
    return this.status === 429;
  }

  /** Chưa sở hữu khoá học hoặc không phải chủ tài nguyên (BR-ENROLL-02, BR-ROLE-01). */
  get isForbidden(): boolean {
    return this.status === 403;
  }
}

/**
 * Chọn base URL đúng theo nơi code đang chạy.
 *
 * `typeof window === 'undefined'` nghĩa là đang ở Server Component / route handler.
 *
 * Export để {@link uploadFile} (XHR, không đi qua {@link request}) tái dùng logic này.
 */
export function resolveBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://backend:8080';
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Access token JWT. Giai đoạn 1 sẽ lấy tự động từ store thay vì truyền tay. */
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options;

  const response = await fetch(`${resolveBaseUrl()}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new ApiError(await parseProblem(response));
  }

  // 204 No Content không có body để parse
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** Cố gắng đọc ProblemDetail; nếu backend trả HTML/text thì tự dựng một cái tương đương. */
async function parseProblem(response: Response): Promise<ProblemDetail> {
  try {
    return (await response.json()) as ProblemDetail;
  } catch {
    return {
      type: 'about:blank',
      title: response.statusText,
      status: response.status,
      detail: `Yêu cầu thất bại với mã ${response.status}`,
      instance: response.url,
      code: 'NON_JSON_RESPONSE',
      timestamp: new Date().toISOString(),
    };
  }
}

/** Người dùng chủ động bấm "Hủy" giữa lúc upload — phân biệt với lỗi mạng/máy chủ thật. */
export class UploadCancelledError extends Error {
  constructor() {
    super('Đã hủy tải lên');
    this.name = 'UploadCancelledError';
  }
}

/**
 * Upload file có báo tiến độ VÀ có thể hủy giữa chừng (Giai đoạn 4 — UC34: nạp video, lỡ chọn
 * nhầm file cần hủy ngay). `fetch` không có cách nào báo tiến độ UPLOAD của request body ở mọi
 * trình duyệt, nên dùng `XMLHttpRequest` (có `xhr.upload.onprogress` và `xhr.abort()`) thay vì
 * {@link api}. Luôn gửi field `"file"` — khớp `@RequestPart("file")` phía backend.
 */
export function uploadFileCancelable<T>(
  path: string,
  file: File,
  options: { token?: string; onProgress?: (percent: number) => void } = {},
): { promise: Promise<T>; abort: () => void } {
  const xhr = new XMLHttpRequest();

  const promise = new Promise<T>((resolve, reject) => {
    xhr.open('POST', `${resolveBaseUrl()}${path}`);
    if (options.token) {
      xhr.setRequestHeader('Authorization', `Bearer ${options.token}`);
    }

    xhr.upload.onprogress = (e) => {
      if (options.onProgress && e.lengthComputable) {
        options.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.status === 204 || !xhr.responseText ? (undefined as T) : (JSON.parse(xhr.responseText) as T));
        return;
      }
      reject(new ApiError(parseProblemFromXhr(xhr)));
    };
    xhr.onerror = () => {
      reject(
        new ApiError({
          type: 'about:blank',
          title: 'Network Error',
          status: 0,
          detail: 'Không kết nối được máy chủ',
          instance: path,
          code: 'NETWORK_ERROR',
          timestamp: new Date().toISOString(),
        }),
      );
    };
    xhr.onabort = () => reject(new UploadCancelledError());

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });

  return { promise, abort: () => xhr.abort() };
}

/** Bản không cần hủy giữa chừng (tài liệu, ảnh bìa) — dựng trên {@link uploadFileCancelable}. */
export function uploadFile<T>(
  path: string,
  file: File,
  options: { token?: string; onProgress?: (percent: number) => void } = {},
): Promise<T> {
  return uploadFileCancelable<T>(path, file, options).promise;
}

function parseProblemFromXhr(xhr: XMLHttpRequest): ProblemDetail {
  try {
    return JSON.parse(xhr.responseText) as ProblemDetail;
  } catch {
    return {
      type: 'about:blank',
      title: xhr.statusText,
      status: xhr.status,
      detail: `Yêu cầu thất bại với mã ${xhr.status}`,
      instance: xhr.responseURL,
      code: 'NON_JSON_RESPONSE',
      timestamp: new Date().toISOString(),
    };
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
