const safeJsonParse = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return value;
  }
};

const readMessageText = (messageContent) => {
  if (typeof messageContent === "string") return messageContent;
  if (Array.isArray(messageContent)) return JSON.stringify(messageContent);
  if (!messageContent || typeof messageContent !== "object") return "";

  if (typeof messageContent.text === "string") return messageContent.text;
  if (typeof messageContent.message === "string") return messageContent.message;
  if (typeof messageContent.content === "string") return messageContent.content;

  return JSON.stringify(messageContent);
};

const normalizeSender = (senderType) => {
  const normalized = String(senderType || "").toLowerCase();
  if (normalized === "user") return "user";
  if (normalized === "ai") return "ai";
  if (normalized === "backend") return "ai";
  return "ai";
};

const mapApiMessageToUi = (apiMessage, index = 0) => {
  const parsedContent = safeJsonParse(apiMessage?.message_content);
  const canDownloadValue =
    apiMessage?.can_download ??
    apiMessage?.canDownload ??
    parsedContent?.can_download ??
    false;

  return {
    id: String(apiMessage?.id ?? `msg-fallback-${index}`),
    sender: normalizeSender(apiMessage?.sender_type),
    text: readMessageText(parsedContent),
    canDownload: Boolean(canDownloadValue),
    createdAt: apiMessage?.created_at || null,
  };
};

const mapApiSessionToUi = (apiSession, index = 0) => ({
  id: String(apiSession?.id ?? `session-fallback-${index}`),
  title: String(apiSession?.title || "New Chat"),
  updatedAt: apiSession?.updated_at ? new Date(apiSession.updated_at).getTime() : Date.now(),
  isLocked: Boolean(apiSession?.is_locked ?? true),
  messages: Array.isArray(apiSession?.messages)
    ? apiSession.messages.map((message, messageIndex) =>
        mapApiMessageToUi(message, messageIndex)
      )
    : [],
});

const pickArray = (payload, keys) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  return [];
};

export const mapChatDetailsResponse = (response) => {
  const sourceMessages = pickArray(response, [
    "data",
    "messages",
    "chat_messages",
    "history",
  ]);

  return sourceMessages.map((item, index) => mapApiMessageToUi(item, index));
};

export const mapSessionSearchResponse = (response) => {
  const sourceSessions = pickArray(response, [
    "data",
    "sessions",
    "results",
    "formatted_session_list",
  ]);

  return sourceSessions.map((item, index) => mapApiSessionToUi(item, index));
};
