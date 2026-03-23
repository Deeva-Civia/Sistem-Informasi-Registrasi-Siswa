import React, { useEffect, useRef, useState } from "react";
import { ReactComponent as CopyIcon } from "../../../assets/MISmart_copy.svg";
import { ReactComponent as DownloadIcon } from "../../../assets/MISmart_unduh.svg";
import newChatIcon from "../../../assets/MISmart_newchat.svg";
import profileIcon from "../../../assets/MISmart_profile.svg";
import { ReactComponent as SendIcon } from "../../../assets/MISmart_send.svg";
import searchIcon from "../../../assets/MISmart_search.svg";
import rekapanIcon from "../../../assets/MISmart_rekapan.svg";
import titikTigaIcon from "../../../assets/MISmart_titik3.svg";
import useAuth from "../../../hooks/useAuth";
import styles from "./MISmart.module.css";

const historyItems = [
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
  "Jumlah Pendaftaran Tahun Ini",
  "Jumlah Pendaftaran Tahun Lalu",
  "Perbandingan Confirmed vs Cancelled",
  "Siswa dengan Status Pending",
  "Siswa dengan Keringanan Biaya",
  "Daftar Siswa dengan Program Khusus",
  "Daftar Siswa per Transportasi",
  "Daftar Siswa per Residence Hall",
  "Nama Siswa yang Belum Lengkapi Data",
  "Nama Siswa yang Sudah Lengkapi Data",
  "Riwayat Registrasi Terbaru",
  "Rekapitulasi Registrasi Final",
];

const MISmart = () => {
  const { user } = useAuth();
  const [isNewChatActive, setIsNewChatActive] = useState(false);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(null);
  const [askValue, setAskValue] = useState("");
  const [isCopyActive, setIsCopyActive] = useState(false);
  const [isDownloadActive, setIsDownloadActive] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const copyResetTimeoutRef = useRef(null);
  const downloadResetTimeoutRef = useRef(null);
  const activeUserName = user?.full_name || user?.username || "User aktif";
  const canSend = askValue.trim().length > 0;
  const userPromptText =
    "Berikan data rekapan pendaftaran untuk hari ini dalam bentuk tabel";

  const handleCopyUserPrompt = async () => {
    try {
      await navigator.clipboard.writeText(userPromptText);
      setIsCopyActive(true);
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
      copyResetTimeoutRef.current = setTimeout(() => {
        setIsCopyActive(false);
      }, 800);
    } catch (_error) {
      // Silent fail for UI slicing stage.
    }
  };

  const handleDownloadClick = () => {
    setIsDownloadActive(true);
    if (downloadResetTimeoutRef.current) {
      clearTimeout(downloadResetTimeoutRef.current);
    }
    downloadResetTimeoutRef.current = setTimeout(() => {
      setIsDownloadActive(false);
    }, 800);
  };

  const handleEnterChatMode = () => {
    setIsChatMode(true);
  };

  const handleNewChatClick = () => {
    setIsNewChatActive((prev) => !prev);
    setIsChatMode(false);
    setAskValue("");
    setIsCopyActive(false);
    setIsDownloadActive(false);
  };

  const handleSendClick = () => {
    if (!canSend) return;
    handleEnterChatMode();
  };

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
      if (downloadResetTimeoutRef.current) {
        clearTimeout(downloadResetTimeoutRef.current);
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
            {historyItems.map((item, index) => (
              <button
                key={`${item}-${index}`}
                type="button"
                className={`${styles.historyItem} ${
                  activeHistoryIndex === index ? styles.historyItemActive : ""
                }`}
                onClick={() => setActiveHistoryIndex(index)}
              >
                <span className={styles.historyItemText}>{item}</span>
                <img
                  src={titikTigaIcon}
                  alt="Options"
                  className={styles.historyItemIcon}
                />
              </button>
            ))}
          </div>

          <div className={styles.footerFrame}>
            <div className={styles.leftFooter}>
              <img src={profileIcon} alt="Profile" className={styles.profileIconImg} />
              <span>{activeUserName}</span>
            </div>
          </div>
        </aside>

        <main
          className={`${styles.rightPanel} ${
            isChatMode ? styles.rightPanelChat : ""
          }`}
        >
          {isChatMode ? (
            <>
              <div className={styles.userMessageBlock}>
                <div className={styles.userChatBubble}>{userPromptText}</div>
                <button
                  type="button"
                  className={`${styles.copyButton} ${
                    isCopyActive ? styles.copyButtonActive : ""
                  }`}
                  aria-label="Copy user message"
                  onClick={handleCopyUserPrompt}
                >
                  <CopyIcon className={styles.copyButtonIconSvg} />
                </button>
              </div>

              <div className={styles.aiResponseBlock}>
                <div className={styles.aiChatBubble}>
                  Berikut ini adalah data rekapan harian pendaftaran siswa
                  dalam bentuk tabel lengkap per section, termasuk total
                  pendaftar, confirmed, cancelled, serta perbandingan dengan
                  data hari sebelumnya, dan data tersebut sudah siap untuk
                  diunduh dalam format file exel agar bisa langsung dipakai
                  untuk laporan.
                </div>

                <button
                  type="button"
                  className={`${styles.downloadButton} ${
                    isDownloadActive ? styles.downloadButtonActive : ""
                  }`}
                  aria-label="Download File Exel"
                  onClick={handleDownloadClick}
                >
                  <span>Download File Exel</span>
                  <DownloadIcon className={styles.downloadIconSvg} />
                </button>
              </div>
            </>
          ) : (
            <div className={styles.heroText}>
              <p className={styles.heroLinePrimary}>Hallo {activeUserName}</p>
              <h1 className={styles.heroLineSecondary}>Good to see you back</h1>
            </div>
          )}

          <div
            className={`${styles.rightActions} ${
              isChatMode ? styles.rightActionsBottom : ""
            }`}
          >
            <button
              type="button"
              className={styles.rekapanButton}
              onClick={handleEnterChatMode}
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
        </main>
      </section>
    </div>
  );
};

export default MISmart;
