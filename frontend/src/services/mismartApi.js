const API_BASE_URL = process.env.REACT_APP_API_URL || "";
const MISMART_API_PREFIX = process.env.REACT_APP_MISMART_API_PREFIX || "/mis-smart";

// Pastikan tidak ada slash ganda antara API_BASE_URL dan endpoint
const buildUrl = (endpoint) => {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${safeEndpoint}`;
};

const createApiError = ({
  message = "Unknown API error",
  errors = null,
  status = 0,
  payload = null,
} = {}) => {
  const error = new Error(message);
  error.success = false;
  error.errors = errors;
  error.status = status;
  error.payload = payload;
  return error;
};

const safeParseJson = async (response) => {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
};

const normalizeApiError = async (response) => {
  const payload = await safeParseJson(response);
  return createApiError({
    message: payload?.message || `HTTP error ${response.status}`,
    errors: payload?.errors || null,
    status: response.status,
    payload,
  });
};

const request = async (endpoint, options = {}, config = {}) => {
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(buildUrl(endpoint), {
      ...options,
      headers,
    });
  } catch (error) {
    throw createApiError({
      message: error?.message || "Network request failed",
      errors: null,
      status: 0,
      payload: null,
    });
  }

  if (!response.ok) {
    throw await normalizeApiError(response);
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await safeParseJson(response);
  if (config?.unwrapData) {
    return payload?.data ?? payload ?? null;
  }
  return payload ?? null;
};

// Session bootstrap when first instruction is submitted from New Chat.
export const createChatSession = async (payload, options = {}) => {
  return request(`${MISMART_API_PREFIX}/sessions`, {
    method: "POST",
    body: JSON.stringify({
      text: payload?.text || "",
    }),
    signal: options.signal,
  }, { unwrapData: options.unwrapData === true });
};

// Sequence: fetchChatDetails(session_id)
export const fetchChatDetails = async (sessionId, options = {}) => {
  if (!sessionId) {
    throw new Error("sessionId is required for fetchChatDetails");
  }

  return request(`${MISMART_API_PREFIX}/sessions/${sessionId}/messages`, {
    method: "GET",
    signal: options.signal,
  }, { unwrapData: options.unwrapData === true });
};

// Sequence: searchSessions(keyword)
export const searchSessions = async (keyword, options = {}) => {
  const params = new URLSearchParams();
  params.set("keyword", keyword || "");

  return request(`${MISMART_API_PREFIX}/sessions/search?${params.toString()}`, {
    method: "GET",
    signal: options.signal,
  }, { unwrapData: options.unwrapData === true });
};

// Sequence: updateChatTitle(session_id, new_title)
export const updateChatTitle = async (sessionId, newTitle, options = {}) => {
  if (!sessionId) {
    throw new Error("sessionId is required for updateChatTitle");
  }

  return request(`${MISMART_API_PREFIX}/sessions/${sessionId}/title`, {
    method: "PATCH",
    body: JSON.stringify({ new_title: newTitle }),
    signal: options.signal,
  }, { unwrapData: options.unwrapData === true });
};

// Sequence: deleteChatSession(session_id)
export const deleteChatSession = async (sessionId, options = {}) => {
  if (!sessionId) {
    throw new Error("sessionId is required for deleteChatSession");
  }

  return request(`${MISMART_API_PREFIX}/sessions/${sessionId}`, {
    method: "DELETE",
    signal: options.signal,
  }, { unwrapData: options.unwrapData === true });
};

// Sequence: askAiChatbot(prompt, session_id)
export const askAiChatbot = async (payload, options = {}) => {
  return request(`${MISMART_API_PREFIX}/ai-chatbot/ask`, {
    method: "POST",
    body: JSON.stringify({
      prompt: payload.prompt,
      session_id: payload.sessionId || null,
    }),
    signal: options.signal,
  }, { unwrapData: false }); 
};
