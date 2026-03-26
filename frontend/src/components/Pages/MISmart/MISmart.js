import React, { useEffect, useRef, useState } from "react";
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
import styles from "./MISmart.module.css";

const MISMART_STORAGE_KEY = "mis_smart_chat_state_v1";

const downloadKeywords = [
  "rekap",
  "rekapan",
  "tabel",
  "table",
  "excel",
  "exel",
  "unduh",
  "download",
  "file",
  "laporan",
  "export",
  "data",
];

const hasDownloadIntent = (text) => {
  const normalizedPrompt = text.toLowerCase();
  return downloadKeywords.some((keyword) => normalizedPrompt.includes(keyword));
};

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

const aiRecapResponseText =
  "Berikut ini adalah data rekapan harian pendaftaran siswa dalam bentuk tabel lengkap per section, termasuk total pendaftar, confirmed, cancelled, serta perbandingan dengan data hari sebelumnya, dan data tersebut sudah siap untuk diunduh dalam format file exel agar bisa langsung dipakai untuk laporan.";
const aiGeneralResponseText =
  "Berikut ringkasan data pendaftaran yang kamu minta. Kamu bisa lanjutkan dengan instruksi lebih spesifik agar hasilnya lebih detail.";

const mockSessionTitles = [
  "Rekapan Pendaftaran",
  "Jumlah Pendaftaran",
  "Jumlah Pendaftaran Kelas 1",
  "Jumlah Pendaftaran Kelas 2",
  "Jumlah Pendaftaran Kelas 3",
  "Jumlah Pendaftaran New Student",
  "Jumlah Pendaftaran Existing Student",
  "Jumlah Pendaftaran per Section",
  "Jumlah Pendaftaran per Major",
  "Jumlah Pendaftaran Harian",
  "Jumlah Pendaftaran Mingguan",
  "Jumlah Pendaftaran Bulanan",
];

const createInitialMockSessions = () => {
  const now = Date.now();
  return mockSessionTitles.map((title, index) => {
    const canDownload = hasDownloadIntent(title);
    return {
      id: `mock-session-${index + 1}`,
      title,
      updatedAt: now - index * 60_000,
      isLocked: true,
      messages: [
        {
          id: `mock-user-${index + 1}`,
          sender: "user",
          text: canDownload
            ? `Berikan ${title.toLowerCase()} untuk hari ini dalam bentuk tabel`
            : title,
          canDownload: false,
        },
        {
          id: `mock-ai-${index + 1}`,
          sender: "ai",
          text: canDownload ? aiRecapResponseText : aiGeneralResponseText,
          canDownload,
        },
      ],
    };
  });
};

const getInitialStateFromStorage = () => {
  if (typeof window === "undefined") {
    return { chatSessions: createInitialMockSessions(), activeSessionId: null };
  }

  try {
    const rawValue = window.localStorage.getItem(MISMART_STORAGE_KEY);
    if (!rawValue) {
      return { chatSessions: createInitialMockSessions(), activeSessionId: null };
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue?.chatSessions)) {
      return { chatSessions: createInitialMockSessions(), activeSessionId: null };
    }

    return {
      chatSessions: parsedValue.chatSessions,
      activeSessionId:
        typeof parsedValue.activeSessionId === "string"
          ? parsedValue.activeSessionId
          : null,
    };
  } catch (_error) {
    return { chatSessions: createInitialMockSessions(), activeSessionId: null };
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
  const [activeSessionId, setActiveSessionId] = useState(
    initialStateRef.current.activeSessionId
  );
  const [openContextMenuSessionId, setOpenContextMenuSessionId] = useState(null);
  const [renameModalSessionId, setRenameModalSessionId] = useState(null);
  const [deleteModalSessionId, setDeleteModalSessionId] = useState(null);
  const [renameDraftTitle, setRenameDraftTitle] = useState("");
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [askValue, setAskValue] = useState("");
  const [activeCopyMessageId, setActiveCopyMessageId] = useState(null);
  const [activeDownloadMessageId, setActiveDownloadMessageId] = useState(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [typingSessionId, setTypingSessionId] = useState(null);
  const messageIdRef = useRef(0);
  const sessionIdRef = useRef(0);
  const chatViewportRef = useRef(null);
  const copyResetTimeoutRef = useRef(null);
  const downloadResetTimeoutRef = useRef(null);
  const aiReplyTimeoutRef = useRef(null);
  const contextMenuRef = useRef(null);
  const sessionsRef = useRef(chatSessions);
  const activeSessionIdRef = useRef(activeSessionId);
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
  const filteredSessions = chatSessions.filter((session) =>
    sessionMatchesQuery(session, normalizedSearch)
  );
  const openContextMenuSession =
    chatSessions.find((session) => session.id === openContextMenuSessionId) || null;
  const renameTargetSession =
    chatSessions.find((session) => session.id === renameModalSessionId) || null;
  const normalizedRenameDraftTitle = renameDraftTitle.trim();
  const canSubmitRename = Boolean(
    renameTargetSession &&
      normalizedRenameDraftTitle &&
      normalizedRenameDraftTitle !== renameTargetSession.title
  );
  const shouldShowComposer = !isChatMode || !isActiveSessionReadOnly;

  useEffect(() => {
    sessionsRef.current = chatSessions;
  }, [chatSessions]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

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

  const createSessionWithFirstMessage = (promptText) => {
    const sessionId = `session-${Date.now()}-${sessionIdRef.current++}`;
    const firstUserMessage = createMessage("user", promptText);
    const newSession = {
      id: sessionId,
      title: buildSessionTitle(promptText),
      updatedAt: Date.now(),
      isLocked: false,
      messages: [firstUserMessage],
    };
    setChatSessions((prevSessions) => [newSession, ...prevSessions]);
    setActiveSessionId(sessionId);
    return sessionId;
  };

  const appendAiReply = (sessionId, canDownload) => {
    setIsAiTyping(true);
    setTypingSessionId(sessionId);
    if (aiReplyTimeoutRef.current) {
      clearTimeout(aiReplyTimeoutRef.current);
    }

    aiReplyTimeoutRef.current = setTimeout(() => {
      const aiMessage = createMessage(
        "ai",
        canDownload ? aiRecapResponseText : aiGeneralResponseText,
        canDownload
      );
      appendMessageToSession(sessionId, aiMessage);
      setIsAiTyping(false);
      setTypingSessionId(null);
      aiReplyTimeoutRef.current = null;
    }, 900);
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

  const handleDownloadClick = (messageId) => {
    setActiveDownloadMessageId(messageId);
    if (downloadResetTimeoutRef.current) {
      clearTimeout(downloadResetTimeoutRef.current);
    }
    downloadResetTimeoutRef.current = setTimeout(() => {
      setActiveDownloadMessageId(null);
    }, 800);
  };

  const handleSendPrompt = (promptText) => {
    if (isAiTyping) return;
    const trimmedPrompt = promptText.trim();
    if (!trimmedPrompt) return;

    const canDownload = hasDownloadIntent(trimmedPrompt);
    let targetSessionId = activeSessionId;

    if (targetSessionId) {
      const userMessage = createMessage("user", trimmedPrompt);
      appendMessageToSession(targetSessionId, userMessage);
    } else {
      targetSessionId = createSessionWithFirstMessage(trimmedPrompt);
    }

    appendAiReply(targetSessionId, canDownload);
    setAskValue("");
    setActiveCopyMessageId(null);
    setActiveDownloadMessageId(null);
  };

  const handleEnterChatMode = () => {
    handleSendPrompt(defaultRecapPrompt);
  };

  const handleNewChatClick = () => {
    lockSessionById(activeSessionId);
    setActiveSessionId(null);
    setOpenContextMenuSessionId(null);
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
  };

  const handleSelectSession = (sessionId) => {
    if (activeSessionId && activeSessionId !== sessionId) {
      lockSessionById(activeSessionId);
    }
    setActiveSessionId(sessionId);
    setOpenContextMenuSessionId(null);
    setContextMenuPosition(null);
    setAskValue("");
    setActiveCopyMessageId(null);
    setActiveDownloadMessageId(null);
  };

  const handleSearchChange = (event) => {
    setOpenContextMenuSessionId(null);
    setContextMenuPosition(null);
    setSearchQuery(event.target.value);
  };

  const handleToggleContextMenu = (event, sessionId) => {
    event.stopPropagation();
    const triggerRect = event.currentTarget.getBoundingClientRect();
    const sessionRowElement = event.currentTarget.closest(
      `.${styles.historyItemRow}`
    );
    const sessionRowRect = sessionRowElement?.getBoundingClientRect();
    const popupTop = (sessionRowRect?.bottom ?? triggerRect.bottom) + 3;
    setOpenContextMenuSessionId((prevSessionId) => {
      if (prevSessionId === sessionId) {
        setContextMenuPosition(null);
        return null;
      }

      setContextMenuPosition({
        top: popupTop,
        left: triggerRect.left,
      });
      return sessionId;
    });
  };

  const handleDeleteSession = (event) => {
    if (!openContextMenuSession) return;
    event.stopPropagation();
    setOpenContextMenuSessionId(null);
    setContextMenuPosition(null);
    setRenameModalSessionId(null);
    setDeleteModalSessionId(openContextMenuSession.id);
  };

  const handleOpenRenameModal = (event, session) => {
    event.stopPropagation();
    setOpenContextMenuSessionId(null);
    setContextMenuPosition(null);
    setDeleteModalSessionId(null);
    setRenameModalSessionId(session.id);
    setRenameDraftTitle(session.title);
  };

  const handleCloseRenameModal = () => {
    setRenameModalSessionId(null);
    setRenameDraftTitle("");
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalSessionId(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalSessionId) return;

    setChatSessions((prevSessions) =>
      prevSessions.filter((session) => session.id !== deleteModalSessionId)
    );

    if (activeSessionId === deleteModalSessionId) {
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
  };

  const handleRenameInputChange = (event) => {
    setRenameDraftTitle(event.target.value);
  };

  const handleCommitRename = () => {
    if (!renameModalSessionId || !canSubmitRename) return;

    const normalizedTitle = normalizedRenameDraftTitle;

    setChatSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === renameModalSessionId
          ? { ...session, title: normalizedTitle, updatedAt: Date.now() }
          : session
      )
    );

    setRenameModalSessionId(null);
    setRenameDraftTitle("");
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
  };

  const handleAskInputKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleSendClick();
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
      handleCloseDeleteModal();
    };

    document.addEventListener("keydown", handleDeleteModalEscape);
    return () => {
      document.removeEventListener("keydown", handleDeleteModalEscape);
    };
  }, [deleteModalSessionId]);

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
            {filteredSessions.length > 0 ? (
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
                    onClick={(event) => handleToggleContextMenu(event, session.id)}
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
              <div className={styles.historyEmptyState}>No chat found</div>
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
                  openContextMenuSession
                    ? handleOpenRenameModal(event, openContextMenuSession)
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
                    <div className={styles.aiChatBubble}>{message.text}</div>

                    {message.canDownload ? (
                      <button
                        type="button"
                        className={`${styles.downloadButton} ${
                          activeDownloadMessageId === message.id
                            ? styles.downloadButtonActive
                            : ""
                        }`}
                        aria-label="Download File Exel"
                        onClick={() => handleDownloadClick(message.id)}
                      >
                        <span>Download File Exel</span>
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
                <input
                  className={styles.askInput}
                  type="text"
                  placeholder="Ask MISmart"
                  value={askValue}
                  onChange={(event) => setAskValue(event.target.value)}
                  onKeyDown={handleAskInputKeyDown}
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
                  disabled={!canSubmitRename}
                >
                  Rename
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
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default MISmart;
