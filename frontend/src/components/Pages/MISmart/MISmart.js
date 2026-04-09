import React, { useCallback, useEffect, useRef, useState } from "react";
import { ReactComponent as CopyIcon } from "../../../assets/MISmart_copy.svg";
import { ReactComponent as DownloadIcon } from "../../../assets/MISmart_unduh.svg";
import { ReactComponent as DeleteIcon } from "../../../assets/MISmart_delete.svg";
import newChatIcon from "../../../assets/MISmart_newchat.svg";
import profileIcon from "../../../assets/MISmart_profile.svg";
import { ReactComponent as RenameIcon } from "../../../assets/MISmart_rename.svg";
import { ReactComponent as SendIcon } from "../../../assets/MISmart_send.svg";
import searchIcon from "../../../assets/MISmart_search.svg";
import rekapanIcon from "../../../assets/MISmart_rekapan.svg";
import titikTigaIcon from "../../../assets/MISmart_titik3.svg";
import useAuth from "../../../hooks/useAuth";
import {
  deleteChatSession,
  fetchChatDetails,
  searchSessions,
  updateChatTitle,
  askAiChatbot, 
} from "../../../services/mismartApi";
import {
  mapChatDetailsResponse,
  mapSessionSearchResponse,
} from "../../../services/mismartAdapter";
import styles from "./MISmart.module.css";
import { generateExcelReport } from "../../../utils/excelHelper";

const MISMART_STORAGE_KEY = "mis_smart_chat_state_v1";
const MISMART_ENABLE_API = process.env.REACT_APP_MISMART_USE_API === "true";

const buildSessionTitle = (text) => {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  if (!normalizedText) return "New Chat";
  return normalizedText.length > 42
    ? `${normalizedText.slice(0, 42).trim()}...`
    : normalizedText;
};

const sessionMatchesQuery = (session, normalizedQuery) => {
  if (!normalizedQuery) return true;
  if (session.title.toLowerCase().includes(normalizedQuery)) return true;
  return session.messages.some((message) =>
    message.text.toLowerCase().includes(normalizedQuery)
  );
};

const mergeSessionsById = (existingSessions, incomingSessions) => {
  const mergedMap = new Map(existingSessions.map((session) => [session.id, session]));

  incomingSessions.forEach((incomingSession) => {
    const existingSession = mergedMap.get(incomingSession.id);
    const nextMessages =
      incomingSession.messages.length > 0
        ? incomingSession.messages
        : existingSession?.messages || [];

    mergedMap.set(incomingSession.id, {
      ...existingSession,
      ...incomingSession,
      messages: nextMessages,
    });
  });

  return [...mergedMap.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
};

const getInitialStateFromStorage = () => {
  if (MISMART_ENABLE_API) {
    return { chatSessions: [], activeSessionId: null };
  }

  if (typeof window === "undefined") {
    return { chatSessions: [], activeSessionId: null };
  }

  try {
    const rawValue = window.localStorage.getItem(MISMART_STORAGE_KEY);
    if (!rawValue) {
      return { chatSessions: [], activeSessionId: null };
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue?.chatSessions)) {
      return { chatSessions: [], activeSessionId: null };
    }

    return {
      chatSessions: parsedValue.chatSessions,
      activeSessionId:
        typeof parsedValue.activeSessionId === "string"
          ? parsedValue.activeSessionId
          : null,
    };
  } catch (_error) {
    return { chatSessions: [], activeSessionId: null };
  }
};

const persistStateToStorage = (chatSessions, activeSessionId) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      MISMART_STORAGE_KEY,
      JSON.stringify({ chatSessions, activeSessionId })
    );
  } catch (_error) {
    // Silent fail for UI slicing stage.
  }
};

const MISmart = () => {
  const { user } = useAuth();
  const initialStateRef = useRef(getInitialStateFromStorage());
  const [chatSessions, setChatSessions] = useState(initialStateRef.current.chatSessions);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [openContextMenuSessionId, setOpenContextMenuSessionId] = useState(null);
  const [openContextMenuSessionSnapshot, setOpenContextMenuSessionSnapshot] =
    useState(null);
  const [renameModalSessionId, setRenameModalSessionId] = useState(null);
  const [renameSessionSnapshot, setRenameSessionSnapshot] = useState(null);
  const [deleteModalSessionId, setDeleteModalSessionId] = useState(null);
  const [renameDraftTitle, setRenameDraftTitle] = useState("");
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isInitialSessionsLoading, setIsInitialSessionsLoading] = useState(false);
  const [isSearchingSessions, setIsSearchingSessions] = useState(false);
  const [searchErrorMessage, setSearchErrorMessage] = useState("");
  const [askValue, setAskValue] = useState("");
  const [showRenameSuccessPopup, setShowRenameSuccessPopup] = useState(false);
  const [showDeleteSuccessPopup, setShowDeleteSuccessPopup] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyErrorMessage, setHistoryErrorMessage] = useState("");
  const [isRenamingTitle, setIsRenamingTitle] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [sessionActionErrorMessage, setSessionActionErrorMessage] = useState("");
  const [activeCopyMessageId, setActiveCopyMessageId] = useState(null);
  const [activeDownloadMessageId, setActiveDownloadMessageId] = useState(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [typingSessionId, setTypingSessionId] = useState(null);
  const messageIdRef = useRef(0);
  const chatViewportRef = useRef(null);
  const copyResetTimeoutRef = useRef(null);
  const downloadResetTimeoutRef = useRef(null);
  const aiReplyTimeoutRef = useRef(null);
  const contextMenuRef = useRef(null);
  const renameSuccessTimeoutRef = useRef(null);
  const deleteSuccessTimeoutRef = useRef(null);
  const searchAbortControllerRef = useRef(null);
  const historyAbortControllerRef = useRef(null);
  const sessionsRef = useRef(chatSessions);
  const activeSessionIdRef = useRef(activeSessionId);
  const normalizedSearchRef = useRef("");
  const activeUserName = user?.full_name || user?.username || "User aktif";
  const defaultRecapPrompt =
    "Berikan data rekapan pendaftaran untuk hari ini dalam bentuk tabel";
  const activeSession =
    chatSessions.find((session) => session.id === activeSessionId) || null;
  const activeMessages = activeSession?.messages || [];
  const isChatMode = activeSessionId !== null;
  const isNewChatActive = !isChatMode;
  const isActiveSessionReadOnly = Boolean(activeSession?.isLocked);
  const isTypingInActiveSession = isAiTyping && typingSessionId === activeSessionId;
  const canSend =
    askValue.trim().length > 0 && !isAiTyping && !isActiveSessionReadOnly;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const locallyFilteredSessions = chatSessions.filter((session) =>
    sessionMatchesQuery(session, normalizedSearch)
  );
  const filteredSessions =
    MISMART_ENABLE_API && normalizedSearch ? searchResults : locallyFilteredSessions;
  const renameBaselineTitle = String(renameSessionSnapshot?.title || "").trim();
  const normalizedRenameDraftTitle = renameDraftTitle.trim();
  const canSubmitRename = Boolean(
    renameModalSessionId &&
      normalizedRenameDraftTitle &&
      normalizedRenameDraftTitle !== renameBaselineTitle
  );
  const shouldShowComposer = !isChatMode || !isActiveSessionReadOnly;
  const textareaRef = useRef(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const nextHeight = textarea.scrollHeight;
      
      if (nextHeight > 120) {
        textarea.style.height = "120px";
        textarea.style.overflowY = "auto"; 
      } else {
        textarea.style.height = `${nextHeight}px`;
        textarea.style.overflowY = "hidden"; 
      }
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [askValue]);

  useEffect(() => {
    sessionsRef.current = chatSessions;
  }, [chatSessions]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    normalizedSearchRef.current = normalizedSearch;
  }, [normalizedSearch]);

  const createMessage = (sender, text, canDownload = false) => ({
    id: `msg-${Date.now()}-${messageIdRef.current++}`,
    sender,
    text,
    canDownload,
  });

  const appendMessageToSession = (sessionId, message) => {
    setChatSessions((prevSessions) => {
      let found = false;
      const updatedSessions = prevSessions.map((session) => {
        if (session.id !== sessionId) return session;
        found = true;
        return {
          ...session,
          messages: [...session.messages, message],
          updatedAt: Date.now(),
        };
      });

      if (!found) return prevSessions;

      const targetSession = updatedSessions.find((session) => session.id === sessionId);
      if (!targetSession) return prevSessions;

      return [
        targetSession,
        ...updatedSessions.filter((session) => session.id !== sessionId),
      ];
    });
  };

  const lockSessionById = (sessionId) => {
    if (!sessionId) return;
    setChatSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId && !session.isLocked
          ? { ...session, isLocked: true }
          : session
      )
    );
  };

  const applyBackendSessionSnapshot = useCallback((mappedSessions) => {
    setChatSessions((prevSessions) => {
      const previousSessionMap = new Map(
        prevSessions.map((session) => [String(session.id), session])
      );

      return mappedSessions.map((session) => {
        const previousSession = previousSessionMap.get(String(session.id));
        return {
          ...session,
          messages: previousSession?.messages || session.messages || [],
          isLocked: previousSession?.isLocked ?? session.isLocked,
        };
      });
    });

    const normalizedSearchValue = normalizedSearchRef.current;
    if (normalizedSearchValue) {
      setSearchResults(
        mappedSessions.filter((session) =>
          sessionMatchesQuery(session, normalizedSearchValue)
        )
      );
      return;
    }

    setSearchResults([]);
  }, []);

  const refreshSessionsFromBackend = async () => {
    if (!MISMART_ENABLE_API) return [];

    const response = await searchSessions("", { unwrapData: true });
    const mappedSessions = mapSessionSearchResponse(response);
    applyBackendSessionSnapshot(mappedSessions);

    const activeId = activeSessionIdRef.current;
    if (
      activeId &&
      !mappedSessions.some((session) => String(session.id) === String(activeId))
    ) {
      setActiveSessionId(null);
    }

    return mappedSessions;
  };

  const handleCopyMessage = async (messageId, messageText) => {
    try {
      await navigator.clipboard.writeText(messageText);
      setActiveCopyMessageId(messageId);
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
      copyResetTimeoutRef.current = setTimeout(() => {
        setActiveCopyMessageId(null);
      }, 800);
    } catch (_error) {
      // Silent fail for UI slicing stage.
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    
    // Pecah string berdasarkan newline \n
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];

    const renderBold = (str) => {
      const parts = str.split(/\*\*(.*?)\*\*/g);
      return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
    };

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      // Deteksi bullet point manual (bintang atau strip)
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        listItems.push(
          <li key={lineIndex} style={{ marginLeft: '20px', marginBottom: '4px' }}>
            {renderBold(trimmedLine.substring(2))}
          </li>
        );
      } else {
        // Jika sebelumnya ada list, tutup dulu <ul>-nya
        if (listItems.length > 0) {
          elements.push(<ul key={`ul-${lineIndex}`} style={{ margin: '8px 0', paddingLeft: '20px' }}>{listItems}</ul>);
          listItems = [];
        }
        
        if (trimmedLine !== "") {
          elements.push(<div key={lineIndex} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{renderBold(trimmedLine)}</div>);
        } else {
          // Jangan tambahkan spasi kosong berlebihan jika ada enter ganda
          if (lineIndex < lines.length - 1 && lines[lineIndex + 1].trim() !== "") {
            elements.push(<br key={`br-${lineIndex}`} />);
          }
        }
      }
    });

    if (listItems.length > 0) {
      elements.push(<ul key="ul-end" style={{ margin: '8px 0', paddingLeft: '20px' }}>{listItems}</ul>);
    }

    return <>{elements}</>;
  };
  
  const handleDownloadClick = (messageId, tableData, contextTitle = "Data Ekspor", totalCount = 0, isDailyReport = false) => {
    setActiveDownloadMessageId(messageId);

    try {
      generateExcelReport(tableData, contextTitle, totalCount, isDailyReport);
    } catch (error) {
      console.error("Gagal mendownload Excel:", error);
    } finally {
      // Reset state tombol download
      if (downloadResetTimeoutRef.current) {
        clearTimeout(downloadResetTimeoutRef.current);
      }
      downloadResetTimeoutRef.current = setTimeout(() => {
        setActiveDownloadMessageId(null);
      }, 800);
    }
  };

  const handleSendPrompt = async (promptText) => {
    if (isAiTyping) return;
    const trimmedPrompt = promptText.trim();
    if (!trimmedPrompt) return;

    setSessionActionErrorMessage("");
    setHistoryErrorMessage("");

    const userMessage = createMessage("user", trimmedPrompt);
    let targetSessionId = activeSessionId;

    const isNewChat = !targetSessionId  || String(targetSessionId).startsWith("temp-");; 

    if (isNewChat) {
      targetSessionId = `temp-${Date.now()}`;
      const tempSession = {
        id: targetSessionId,
        title: buildSessionTitle(trimmedPrompt),
        updatedAt: Date.now(),
        isLocked: false,
        messages: [userMessage],
      };

      setChatSessions((prevSessions) => [tempSession, ...prevSessions]);
      setActiveSessionId(targetSessionId);
    } else {
      appendMessageToSession(targetSessionId, userMessage);
    }

    setIsAiTyping(true);
    setTypingSessionId(targetSessionId);
    setAskValue("");

    try {
      const response = await askAiChatbot({
        prompt: trimmedPrompt,
        sessionId: isNewChat || String(targetSessionId).startsWith("temp-") ? null : targetSessionId 
      });

      const hasTableData = response.display_type === "table" && response.data;
      const totalCount = response.meta?.total_count || 0;
    
      const currentSession = chatSessions.find((s) => s.id === targetSessionId);
      const finalTitle = isNewChat ? (response.title || trimmedPrompt) : (currentSession?.title || trimmedPrompt);
    
      const aiMessage = {
        id: `msg-${Date.now()}-${messageIdRef.current++}`,
        sender: "ai",
        text: response.message || "Berikut data yang diminta.",
        canDownload: hasTableData,
        tableData: hasTableData ? response.data : null,
        sessionTitle: finalTitle, 
        totalCount: totalCount,
        isDailyReport: response.meta?.is_daily_report_format || false
      };

      if (isNewChat) {
        const realSessionId = String(response.session_id);

        setChatSessions((prevSessions) =>
          prevSessions.map((session) =>
            session.id === targetSessionId
              ? {
                  ...session,
                  id: realSessionId, 
                  title: response.title || session.title,
                  messages: [...session.messages, aiMessage], 
                }
              : session
          )
        );
        setActiveSessionId(realSessionId); 
        
        if (MISMART_ENABLE_API) refreshSessionsFromBackend();
      } else {
        appendMessageToSession(targetSessionId, aiMessage);
      }
    } catch (error) {
      const realSessionId = error?.payload?.session_id;
      const finalSessionId = realSessionId ? String(realSessionId) : targetSessionId;
      const errorMessageText = error?.payload?.message || error?.message || "Terjadi kesalahan sistem.";
      
      const errorMessage = createMessage("ai", errorMessageText);

      if (isNewChat) {
        setChatSessions((prevSessions) =>
          prevSessions.map((session) =>
            session.id === targetSessionId
              ? {
                  ...session,
                  id: finalSessionId,
                  title: error?.payload?.title || session.title, 
                  messages: [...session.messages, errorMessage],
                }
              : session
          )
        );
        setActiveSessionId(finalSessionId); 
        
        if (MISMART_ENABLE_API) refreshSessionsFromBackend();
      } else {
        appendMessageToSession(targetSessionId, errorMessage);
      }
    } finally {
      setIsAiTyping(false);
      setTypingSessionId(null);
    }
  };

  const handleEnterChatMode = () => {
    handleSendPrompt(defaultRecapPrompt);
  };

  const handleNewChatClick = () => {
    lockSessionById(activeSessionId);
    setHistoryErrorMessage("");
    setSessionActionErrorMessage("");
    setActiveSessionId(null);
    setOpenContextMenuSessionId(null);
    setOpenContextMenuSessionSnapshot(null);
    setContextMenuPosition(null);
    setAskValue("");
    setActiveCopyMessageId(null);
    setActiveDownloadMessageId(null);
    setIsAiTyping(false);
    setTypingSessionId(null);

    if (copyResetTimeoutRef.current) {
      clearTimeout(copyResetTimeoutRef.current);
      copyResetTimeoutRef.current = null;
    }
    if (downloadResetTimeoutRef.current) {
      clearTimeout(downloadResetTimeoutRef.current);
      downloadResetTimeoutRef.current = null;
    }
    if (aiReplyTimeoutRef.current) {
      clearTimeout(aiReplyTimeoutRef.current);
      aiReplyTimeoutRef.current = null;
    }
    if (historyAbortControllerRef.current) {
      historyAbortControllerRef.current.abort();
      historyAbortControllerRef.current = null;
    }
    setIsHistoryLoading(false);
  };

  const handleSelectSession = (sessionId) => {
    if (activeSessionId && activeSessionId !== sessionId) {
      lockSessionById(activeSessionId);
    }

    setHistoryErrorMessage("");
    setSessionActionErrorMessage("");
    setActiveSessionId(sessionId);
    setOpenContextMenuSessionId(null);
    setOpenContextMenuSessionSnapshot(null);
    setContextMenuPosition(null);
    setAskValue("");
    setActiveCopyMessageId(null);
    setActiveDownloadMessageId(null);

    if (!MISMART_ENABLE_API) return;

    if (historyAbortControllerRef.current) {
      historyAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    historyAbortControllerRef.current = abortController;

    setIsHistoryLoading(true);

    fetchChatDetails(sessionId, {
      signal: abortController.signal,
      unwrapData: true,
    })
      .then((response) => {
        const mappedMessages = mapChatDetailsResponse(response);
        setChatSessions((prevSessions) =>
          prevSessions.map((session) =>
            session.id === sessionId
              ? { ...session, messages: mappedMessages, updatedAt: Date.now() }
              : session
          )
        );
      })
      .catch((error) => {
        if (abortController.signal.aborted) return;
        setHistoryErrorMessage(error?.message || "Failed to load chat history.");
      })
      .finally(() => {
        if (historyAbortControllerRef.current === abortController) {
          historyAbortControllerRef.current = null;
        }
        setIsHistoryLoading(false);
      });
  };

  const handleSearchChange = (event) => {
    setOpenContextMenuSessionId(null);
    setOpenContextMenuSessionSnapshot(null);
    setContextMenuPosition(null);
    setSearchErrorMessage("");
    setSearchQuery(event.target.value);
  };

  const handleToggleContextMenu = (event, session) => {
    event.stopPropagation();
    const sessionId = session.id;
    const triggerRect = event.currentTarget.getBoundingClientRect();
    const sessionRowElement = event.currentTarget.closest(
      `.${styles.historyItemRow}`
    );
    const sessionRowRect = sessionRowElement?.getBoundingClientRect();
    const popupTop = (sessionRowRect?.bottom ?? triggerRect.bottom) + 3;
    setOpenContextMenuSessionId((prevSessionId) => {
      if (prevSessionId === sessionId) {
        setOpenContextMenuSessionSnapshot(null);
        setContextMenuPosition(null);
        return null;
      }

      setOpenContextMenuSessionSnapshot(session);
      setContextMenuPosition({
        top: popupTop,
        left: triggerRect.left,
      });
      return sessionId;
    });
  };

  const handleDeleteSession = (event) => {
    if (!openContextMenuSessionSnapshot) return;
    event.stopPropagation();
    setSessionActionErrorMessage("");
    setOpenContextMenuSessionId(null);
    setOpenContextMenuSessionSnapshot(null);
    setContextMenuPosition(null);
    setRenameModalSessionId(null);
    setRenameSessionSnapshot(null);
    setDeleteModalSessionId(openContextMenuSessionSnapshot.id);
  };

  const handleOpenRenameModal = (event, session) => {
    event.stopPropagation();
    setSessionActionErrorMessage("");
    setOpenContextMenuSessionId(null);
    setOpenContextMenuSessionSnapshot(null);
    setContextMenuPosition(null);
    setDeleteModalSessionId(null);
    setRenameModalSessionId(String(session.id));
    setRenameSessionSnapshot({
      id: String(session.id),
      title: String(session.title || ""),
    });
    setRenameDraftTitle(String(session.title || ""));
  };

  const handleCloseRenameModal = () => {
    setRenameModalSessionId(null);
    setRenameSessionSnapshot(null);
    setRenameDraftTitle("");
    setSessionActionErrorMessage("");
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalSessionId(null);
    setSessionActionErrorMessage("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalSessionId) return;
    const targetSessionId = deleteModalSessionId;
    
    const isTempSession = String(targetSessionId).startsWith("temp-");

    setSessionActionErrorMessage("");

    if (MISMART_ENABLE_API && !isTempSession) {
      setIsDeletingSession(true);
      try {
        await deleteChatSession(targetSessionId, { unwrapData: true });
      } catch (error) {
        setSessionActionErrorMessage(
          error?.message || "Failed to delete session. Please try again."
        );
        setIsDeletingSession(false);
        return;
      }
      setIsDeletingSession(false);
    }

    setChatSessions((prevSessions) =>
      prevSessions.filter((session) => session.id !== targetSessionId)
    );
    setSearchResults((prevResults) =>
      prevResults.filter((session) => session.id !== targetSessionId)
    );

    if (activeSessionId === targetSessionId) {
      setActiveSessionId(null);
      setAskValue("");
      setActiveCopyMessageId(null);
      setActiveDownloadMessageId(null);
      setIsAiTyping(false);
      setTypingSessionId(null);

      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
        copyResetTimeoutRef.current = null;
      }
      if (downloadResetTimeoutRef.current) {
        clearTimeout(downloadResetTimeoutRef.current);
        downloadResetTimeoutRef.current = null;
      }
      if (aiReplyTimeoutRef.current) {
        clearTimeout(aiReplyTimeoutRef.current);
        aiReplyTimeoutRef.current = null;
      }
    }

    setDeleteModalSessionId(null);
    triggerDeleteSuccessPopup();
  };

  const handleRenameInputChange = (event) => {
    setRenameDraftTitle(event.target.value);
  };

  const triggerRenameSuccessPopup = () => {
    setShowDeleteSuccessPopup(false);
    if (deleteSuccessTimeoutRef.current) {
      clearTimeout(deleteSuccessTimeoutRef.current);
      deleteSuccessTimeoutRef.current = null;
    }
    setShowRenameSuccessPopup(true);
    if (renameSuccessTimeoutRef.current) {
      clearTimeout(renameSuccessTimeoutRef.current);
    }
    renameSuccessTimeoutRef.current = setTimeout(() => {
      setShowRenameSuccessPopup(false);
      renameSuccessTimeoutRef.current = null;
    }, 2000);
  };

  const triggerDeleteSuccessPopup = () => {
    setShowRenameSuccessPopup(false);
    if (renameSuccessTimeoutRef.current) {
      clearTimeout(renameSuccessTimeoutRef.current);
      renameSuccessTimeoutRef.current = null;
    }
    setShowDeleteSuccessPopup(true);
    if (deleteSuccessTimeoutRef.current) {
      clearTimeout(deleteSuccessTimeoutRef.current);
    }
    deleteSuccessTimeoutRef.current = setTimeout(() => {
      setShowDeleteSuccessPopup(false);
      deleteSuccessTimeoutRef.current = null;
    }, 2000);
  };

  const handleCommitRename = async () => {
    if (!renameModalSessionId || !canSubmitRename || isRenamingTitle) return;

    const normalizedTitle = normalizedRenameDraftTitle;

    const isTempSession = String(renameModalSessionId).startsWith("temp-");

    setSessionActionErrorMessage("");
    let updatedSession = null;

    if (MISMART_ENABLE_API && !isTempSession) {
      setIsRenamingTitle(true);
      try {
        updatedSession = await updateChatTitle(
          renameModalSessionId,
          normalizedTitle,
          { unwrapData: true }
        );
        const updatedTitle = String(updatedSession?.title || "").trim();
        if (!updatedTitle) {
          throw new Error("Invalid session response.");
        }
      } catch (error) {
        setSessionActionErrorMessage(
          error?.message || "Failed to rename session. Please try again."
        );
        setIsRenamingTitle(false);
        return;
      }
      setIsRenamingTitle(false);
    }

    setChatSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === renameModalSessionId
          ? {
              ...session,
              title: MISMART_ENABLE_API && !isTempSession ? updatedSession.title : normalizedTitle,
              updatedAt: updatedSession?.updated_at
                ? new Date(updatedSession.updated_at).getTime()
                : Date.now(),
            }
          : session
      )
    );

    if (MISMART_ENABLE_API && !isTempSession) {
      try {
        await refreshSessionsFromBackend();
      } catch (_error) {
        // Keep successful rename state even if refresh sync fails.
      }
    }

    setRenameModalSessionId(null);
    setRenameSessionSnapshot(null);
    setRenameDraftTitle("");
    triggerRenameSuccessPopup();
  };

  const handleRenameInputKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCloseRenameModal();
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleCommitRename();
  };

  const handleSendClick = () => {
    if (!canSend) return;
    handleSendPrompt(askValue);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  useEffect(() => {
    if (!renameModalSessionId) return undefined;

    const handleRenameModalEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      handleCloseRenameModal();
    };

    document.addEventListener("keydown", handleRenameModalEscape);
    return () => {
      document.removeEventListener("keydown", handleRenameModalEscape);
    };
  }, [renameModalSessionId]);

  useEffect(() => {
    if (!deleteModalSessionId) return undefined;

    const handleDeleteModalEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setDeleteModalSessionId(null);
    };

    document.addEventListener("keydown", handleDeleteModalEscape);
    return () => {
      document.removeEventListener("keydown", handleDeleteModalEscape);
    };
  }, [deleteModalSessionId]);

  useEffect(() => {
    if (!MISMART_ENABLE_API) return undefined;

    let isMounted = true;
    setIsInitialSessionsLoading(true);
    setSearchErrorMessage("");

    searchSessions("", { unwrapData: true })
      .then((response) => {
        if (!isMounted) return;
        const mappedSessions = mapSessionSearchResponse(response);
        applyBackendSessionSnapshot(mappedSessions);
      })
      .catch((error) => {
        if (!isMounted) return;
        setSearchErrorMessage(
          error?.message || "Failed to load chat sessions."
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setIsInitialSessionsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [applyBackendSessionSnapshot]);

  useEffect(() => {
    if (!MISMART_ENABLE_API) {
      setSearchResults([]);
      setIsSearchingSessions(false);
      return undefined;
    }

    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
      searchAbortControllerRef.current = null;
    }

    if (!normalizedSearch) {
      setSearchResults([]);
      setIsSearchingSessions(false);
      return undefined;
    }

    const abortController = new AbortController();
    searchAbortControllerRef.current = abortController;

    const timeoutId = window.setTimeout(async () => {
      setIsSearchingSessions(true);
      setSearchErrorMessage("");
      try {
        const response = await searchSessions(normalizedSearch, {
          signal: abortController.signal,
          unwrapData: true,
        });
        const mappedSessions = mapSessionSearchResponse(response);
        setSearchResults(mappedSessions);
        setChatSessions((prevSessions) =>
          mergeSessionsById(prevSessions, mappedSessions)
        );
      } catch (error) {
        if (abortController.signal.aborted) return;
        setSearchErrorMessage(
          error?.message || "Failed to search session list."
        );
        setSearchResults([]);
      } finally {
        if (searchAbortControllerRef.current === abortController) {
          searchAbortControllerRef.current = null;
        }
        setIsSearchingSessions(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
      if (searchAbortControllerRef.current === abortController) {
        searchAbortControllerRef.current = null;
      }
    };
  }, [normalizedSearch]);

  useEffect(() => {
    if (!isChatMode || !chatViewportRef.current) return;
    chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight;
  }, [activeSessionId, activeMessages.length, isTypingInActiveSession, isChatMode]);

  useEffect(() => {
    if (!openContextMenuSessionId) return undefined;

    const handleDocumentMouseDown = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (
        contextMenuRef.current &&
        contextMenuRef.current.contains(target)
      ) {
        return;
      }
      if (target.closest(`.${styles.historyItemOptionButton}`)) return;
      setOpenContextMenuSessionId(null);
      setOpenContextMenuSessionSnapshot(null);
      setContextMenuPosition(null);
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [openContextMenuSessionId]);

  useEffect(() => {
    if (!openContextMenuSessionId) return undefined;

    const handleViewportChange = () => {
      setOpenContextMenuSessionId(null);
      setOpenContextMenuSessionSnapshot(null);
      setContextMenuPosition(null);
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [openContextMenuSessionId]);

  useEffect(() => {
    persistStateToStorage(chatSessions, activeSessionId);
  }, [chatSessions, activeSessionId]);

  useEffect(() => {
    return () => {
      const latestSessions = sessionsRef.current;
      const latestActiveSessionId = activeSessionIdRef.current;
      const sessionsForPersist = latestActiveSessionId
        ? latestSessions.map((session) =>
            session.id === latestActiveSessionId
              ? { ...session, isLocked: true }
              : session
          )
        : latestSessions;
      const nextActiveSessionId =
        latestActiveSessionId &&
        sessionsForPersist.some((session) => session.id === latestActiveSessionId)
          ? latestActiveSessionId
          : null;
      persistStateToStorage(sessionsForPersist, nextActiveSessionId);

      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
      if (downloadResetTimeoutRef.current) {
        clearTimeout(downloadResetTimeoutRef.current);
      }
      if (aiReplyTimeoutRef.current) {
        clearTimeout(aiReplyTimeoutRef.current);
      }
      if (renameSuccessTimeoutRef.current) {
        clearTimeout(renameSuccessTimeoutRef.current);
      }
      if (deleteSuccessTimeoutRef.current) {
        clearTimeout(deleteSuccessTimeoutRef.current);
      }
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
      if (historyAbortControllerRef.current) {
        historyAbortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className={styles.pageCanvas}>
      <section className={styles.whiteFrame}>
        <aside className={styles.leftPanel}>
          <div className={styles.headerFrame}>
            <div className={styles.searchWrap}>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <img src={searchIcon} alt="Search" className={styles.searchIconImg} />
            </div>

            <button
              type="button"
              className={`${styles.newChatRow} ${
                isNewChatActive ? styles.newChatRowActive : ""
              }`}
              onClick={handleNewChatClick}
            >
              <span>New Chat</span>
              <img
                src={newChatIcon}
                alt="New Chat"
                className={styles.newChatIconImg}
              />
            </button>
          </div>

          <div className={styles.historyList}>
            {MISMART_ENABLE_API && isInitialSessionsLoading ? (
              <div className={styles.historyEmptyState}>Loading sessions...</div>
            ) : MISMART_ENABLE_API && normalizedSearch && isSearchingSessions ? (
              <div className={styles.historyEmptyState}>Searching...</div>
            ) : MISMART_ENABLE_API && normalizedSearch && searchErrorMessage ? (
              <div className={styles.historyEmptyState}>{searchErrorMessage}</div>
            ) : filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`${styles.historyItemRow} ${
                    activeSessionId === session.id ? styles.historyItemRowActive : ""
                  }`}
                >
                  <button
                    type="button"
                    className={`${styles.historyItem} ${
                      activeSessionId === session.id ? styles.historyItemActive : ""
                    }`}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <span className={styles.historyItemText}>{session.title}</span>
                  </button>

                  <button
                    type="button"
                    aria-label="Session options"
                    className={`${styles.historyItemOptionButton} ${
                      openContextMenuSessionId === session.id
                        ? styles.historyItemOptionButtonVisible
                        : ""
                    }`}
                    onClick={(event) => handleToggleContextMenu(event, session)}
                  >
                    <img
                      src={titikTigaIcon}
                      alt=""
                      aria-hidden="true"
                      className={styles.historyItemOptionIconImg}
                    />
                  </button>
                </div>
              ))
            ) : (
              <div className={styles.historyEmptyState}>Chat not found</div>
            )}
          </div>

          {openContextMenuSessionId && contextMenuPosition ? (
            <div
              ref={contextMenuRef}
              className={styles.historyContextMenu}
              style={{
                top: `${contextMenuPosition.top}px`,
                left: `${contextMenuPosition.left}px`,
              }}
            >
              <button
                type="button"
                className={styles.historyContextAction}
                onClick={(event) =>
                  openContextMenuSessionSnapshot
                    ? handleOpenRenameModal(event, openContextMenuSessionSnapshot)
                    : undefined
                }
              >
                <RenameIcon className={styles.historyContextActionIconSvg} />
                <span>Rename</span>
              </button>

              <button
                type="button"
                className={styles.historyContextAction}
                onClick={handleDeleteSession}
              >
                <DeleteIcon className={styles.historyContextActionIconSvg} />
                <span>Delete</span>
              </button>
            </div>
          ) : null}

          <div className={styles.footerFrame}>
            <div className={styles.leftFooter}>
              <img src={profileIcon} alt="Profile" className={styles.profileIconImg} />
              <span>{activeUserName}</span>
            </div>
          </div>
        </aside>

        <main
          className={`${styles.rightPanel} ${
            isChatMode ? styles.rightPanelChat : styles.rightPanelWelcome
          }`}
        >
          {isChatMode ? (
            <div className={styles.chatViewport} ref={chatViewportRef}>
              {isHistoryLoading ? (
                <div className={styles.historyEmptyState}>Loading chat history...</div>
              ) : null}
              {historyErrorMessage ? (
                <div className={styles.historyEmptyState}>{historyErrorMessage}</div>
              ) : null}
              {activeMessages.map((message) =>
                message.sender === "user" ? (
                  <div key={message.id} className={styles.userMessageBlock}>
                    <div className={styles.userChatBubble}>{message.text}</div>
                    <button
                      type="button"
                      className={`${styles.copyButton} ${
                        activeCopyMessageId === message.id
                          ? styles.copyButtonActive
                          : ""
                      }`}
                      aria-label="Copy user message"
                      onClick={() => handleCopyMessage(message.id, message.text)}
                    >
                      <CopyIcon className={styles.copyButtonIconSvg} />
                    </button>
                  </div>
                ) : (
                  <div key={message.id} className={styles.aiResponseBlock}>
                    <div className={styles.aiChatBubble}>
                      {renderFormattedText(message.text)}
                    </div>

                    {message.canDownload ? (
                      <button
                        type="button"
                        className={`${styles.downloadButton} ${
                          activeDownloadMessageId === message.id
                            ? styles.downloadButtonActive
                            : ""
                        }`}
                        aria-label="Download File Excel"
                        onClick={() => handleDownloadClick(
                          message.id, 
                          message.tableData,  
                          message.sessionTitle || activeSession?.title || "Rekapan Data", 
                          message.totalCount,
                          message.isDailyReport
                        )}
                      >
                        <span>Download Excel</span>
                        <DownloadIcon className={styles.downloadIconSvg} />
                      </button>
                    ) : null}
                  </div>
                )
              )}

              {isTypingInActiveSession ? (
                <div className={styles.aiResponseBlock}>
                  <div
                    className={`${styles.aiChatBubble} ${styles.aiTypingBubble}`}
                    aria-live="polite"
                  >
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className={styles.welcomeViewport}>
              <div className={styles.heroText}>
                <p className={styles.heroLinePrimary}>Hallo {activeUserName}</p>
                <h1 className={styles.heroLineSecondary}>Good to see you back</h1>
              </div>
            </div>
          )}

          {shouldShowComposer ? (
            <div
              className={`${styles.rightActions} ${
                isChatMode ? styles.rightActionsBottom : styles.rightActionsWelcome
              }`}
            >
              <button
                type="button"
                className={styles.rekapanButton}
                onClick={handleEnterChatMode}
                disabled={isAiTyping}
              >
                <span>Rekapan</span>
                <img src={rekapanIcon} alt="Rekapan" className={styles.rekapanIconImg} />
              </button>

              <div className={styles.askBar}>
                <textarea
                  ref={textareaRef}
                  className={styles.askInput}
                  placeholder="Ask MISmart"
                  rows={1}
                  type="text"
                  value={askValue}
                  onChange={(event) => setAskValue(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendClick();
                    }
                  }}
                  disabled={isAiTyping}
                />
                <button
                  type="button"
                  className={`${styles.askSendButton} ${
                    canSend ? styles.askSendButtonEnabled : ""
                  }`}
                  aria-label="Send"
                  disabled={!canSend}
                  onClick={handleSendClick}
                >
                  <SendIcon className={styles.askSendIconSvg} />
                </button>
              </div>
              {sessionActionErrorMessage &&
              !renameModalSessionId &&
              !deleteModalSessionId ? (
                <p className={styles.composerErrorText}>{sessionActionErrorMessage}</p>
              ) : null}
            </div>
          ) : null}
        </main>

        {renameModalSessionId ? (
          <div
            className={styles.renameModalBackdrop}
            onClick={handleCloseRenameModal}
            aria-hidden="true"
          >
            <div
              className={styles.renameModalFrame}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Rename chat"
            >
              <h2 className={styles.renameModalHeading}>Rename this chat</h2>
              <input
                type="text"
                className={styles.renameModalInput}
                value={renameDraftTitle}
                onChange={handleRenameInputChange}
                onKeyDown={handleRenameInputKeyDown}
              />
              {sessionActionErrorMessage ? (
                <p className={styles.modalActionErrorText}>{sessionActionErrorMessage}</p>
              ) : null}
              <div className={styles.renameModalActions}>
                <button
                  type="button"
                  className={styles.renameModalCancelButton}
                  onClick={handleCloseRenameModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.renameModalSubmitButton}
                  onClick={handleCommitRename}
                  disabled={!canSubmitRename || isRenamingTitle}
                >
                  {isRenamingTitle ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {deleteModalSessionId ? (
          <div
            className={styles.renameModalBackdrop}
            onClick={handleCloseDeleteModal}
            aria-hidden="true"
          >
            <div
              className={styles.renameModalFrame}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Delete chat"
            >
              <h2 className={styles.renameModalHeading}>Delete Chat ?</h2>
              <p className={styles.deleteModalDescription}>
                This action will delete any commands, responses, and content in this
                chat session.
              </p>
              {sessionActionErrorMessage ? (
                <p className={styles.modalActionErrorText}>{sessionActionErrorMessage}</p>
              ) : null}
              <div className={styles.renameModalActions}>
                <button
                  type="button"
                  className={styles.renameModalCancelButton}
                  onClick={handleCloseDeleteModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.deleteModalSubmitButton}
                  onClick={handleConfirmDelete}
                  disabled={isDeletingSession}
                >
                  {isDeletingSession ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showRenameSuccessPopup ? (
          <div className={styles.renameSuccessPopup} role="status" aria-live="polite">
            Chat renamed successfully
          </div>
        ) : null}

        {showDeleteSuccessPopup ? (
          <div className={styles.renameSuccessPopup} role="status" aria-live="polite">
            Chat has been deleted
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default MISmart;
