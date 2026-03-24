const API_BASE_URL = process.env.REACT_APP_API_URL || "";
const MISMART_API_PREFIX = process.env.REACT_APP_MISMART_API_PREFIX || "/mis-smart";

const buildUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

const normalizeApiError = async (response) => {
  const fallback = {
    success: false,
    message: `HTTP error ${response.status}`,
    errors: null,
  };

  try {
    const payload = await response.json();
    return {
      success: false,
      message: payload?.message || fallback.message,
      errors: payload?.errors || null,
      status: response.status,
      payload,
    };
  } catch (_error) {
    return {
      ...fallback,
      status: response.status,
    };
  }
};

const request = async (endpoint, options = {}) => {
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

  const response = await fetch(buildUrl(endpoint), {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw await normalizeApiError(response);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// Session bootstrap when first instruction is submitted from New Chat.
export const createChatSession = async (payload, options = {}) => {
  return request(`${MISMART_API_PREFIX}/sessions`, {
    method: "POST",
    body: JSON.stringify({
      text: payload?.text || "",
      input_type: payload?.input_type || "dynamic",
    }),
    signal: options.signal,
  });
};

// Sequence: fetchChatDetails(session_id)
export const fetchChatDetails = async (sessionId, options = {}) => {
  if (!sessionId) {
    throw new Error("sessionId is required for fetchChatDetails");
  }

  return request(`${MISMART_API_PREFIX}/sessions/${sessionId}/messages`, {
    method: "GET",
    signal: options.signal,
  });
};

// Sequence: searchSessions(keyword)
export const searchSessions = async (keyword, options = {}) => {
  const params = new URLSearchParams();
  params.set("keyword", keyword || "");

  return request(`${MISMART_API_PREFIX}/sessions/search?${params.toString()}`, {
    method: "GET",
    signal: options.signal,
  });
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
  });
};

// Sequence: deleteChatSession(session_id)
export const deleteChatSession = async (sessionId, options = {}) => {
  if (!sessionId) {
    throw new Error("sessionId is required for deleteChatSession");
  }

  return request(`${MISMART_API_PREFIX}/sessions/${sessionId}`, {
    method: "DELETE",
    signal: options.signal,
  });
};
