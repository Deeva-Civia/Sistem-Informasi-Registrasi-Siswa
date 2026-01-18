import React, { useState, useEffect } from 'react';
import styles from './IdCardPopup.module.css';
import Button from '../../../Atoms/Button/Button';
import IdCardFront from '../../IdCard/IdCardFront';
import IdCardBack from '../../IdCard/IdCardBack';
import ReactDOM from 'react-dom';
import UpdatedNotification from '../UpdateNotification/UpdateNotification';
import {
  getStudentLatestApplication,
  saveStudentCardNumber,
  fetchAuthenticatedImage,
} from '../../../../services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ArrowLeft = () => (
  <svg
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M15 18L9 12L15 6'
      stroke='#333'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const ArrowRight = () => (
  <svg
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M9 18L15 12L9 6'
      stroke='#333'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const IdCardPopup = ({ isOpen, onClose, studentData, onSaveSuccess }) => {
  const [currentView, setCurrentView] = useState('front');

  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [idCardNumber, setIdCardNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessNotify, setShowSuccessNotify] = useState(false);
  const [exportError, setExportError] = useState('');
  const [photoPosition, setPhotoPosition] = useState({ x: 0, y: 0 });

  const [exportDisplayData, setExportDisplayData] = useState(null);

  useEffect(() => {
    if (isOpen && studentData?.id) {
      setLoading(true);
      setExportError('');
      setShowSuccessNotify(false);
      setPhotoPosition({ x: 0, y: 0 });
      setExportDisplayData(null);

      getStudentLatestApplication(studentData.id, 'registration')
        .then((res) => {
          if (res?.success && res?.data?.idCardInfo) {
            const info = res.data.idCardInfo;
            setCardData(info);
            setIdCardNumber(info.card_number || '');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch ID Card info', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Reset saat tutup
      setCardData(null);
      setIdCardNumber('');
      setExportError('');
      setShowSuccessNotify(false);
      setPhotoPosition({ x: 0, y: 0 });
      setExportDisplayData(null);
    }
  }, [isOpen, studentData]);

  if (!isOpen) return null;

  const initialData = {
    first_name: studentData?.firstName,
    middle_name: studentData?.middleName,
    last_name: studentData?.lastName,
    student_id: studentData?.studentId,
    photo_url: studentData?.photoUrl,
    section_name: studentData?.sectionName,
    nisn: studentData?.nisn,
    place_of_birth: studentData?.placeOfBirth,
    date_of_birth: studentData?.dateOfBirth,
    school_year: studentData?.schoolYear,
  };

  const displayData = cardData || initialData;
  const finalExportData = exportDisplayData || displayData;

  let variant = 'ecp';
  const sectionName = displayData?.section_name || '';
  const type = sectionName.toLowerCase();

  if (type.includes('middle')) {
    variant = 'ms';
  } else if (type.includes('high')) {
    variant = 'hs';
  }

  const toggleView = () => {
    setCurrentView((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  const convertUrlToPngBase64 = (url) => {
    return new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        try {
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (e) {
          console.error('Canvas export failed (CORS/Taint):', e);

          resolve(url);
        }
      };

      img.onerror = (err) => {
        console.error('Image load failed inside export logic:', err);
        resolve(url);
      };

      img.src = url;
    });
  };

  const handleExport = async () => {
    if (!displayData?.photo_url) {
      setExportError('Student photo is required to export ID Card.');
      return;
    }
    setExportError('');

    if (!studentData?.id) {
      alert('Student ID is missing.');
      return;
    }

    setIsSaving(true);
    try {
      // Logic convertUrlToPngBase64 yang lama mungkin error karena new Image() tidak bawa token.
      // Kita ganti strateginya:

      let finalPhotoUrl = displayData.photo_url;

      // Jika URL masih mentah dari API (bukan blob/data), fetch dulu jadi Base64
      if (
        finalPhotoUrl &&
        !finalPhotoUrl.startsWith('blob:') &&
        !finalPhotoUrl.startsWith('data:')
      ) {
        const blobUrl = await fetchAuthenticatedImage(finalPhotoUrl);
        // Convert blob url to base64 agar html2canvas lebih stabil (opsional, tapi disarankan untuk PDF)
        const blob = await fetch(blobUrl).then((r) => r.blob());
        finalPhotoUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } else if (finalPhotoUrl && finalPhotoUrl.startsWith('blob:')) {
        // Jika sudah blob (dari profile header), convert ke base64 untuk html2canvas
        const blob = await fetch(finalPhotoUrl).then((r) => r.blob());
        finalPhotoUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      setExportDisplayData({
        ...displayData,
        photo_url: finalPhotoUrl,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const frontElement = document.getElementById('hidden-id-front');
      const backElement = document.getElementById('hidden-id-back');
      const wrapperElement = document.querySelector(
        `.${styles.hiddenExportWrapper}`
      );

      if (frontElement && backElement && wrapperElement) {
        wrapperElement.style.visibility = 'visible';

        const canvasOptions = {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          width: 398,
          height: 631,
          windowWidth: 398,
          windowHeight: 631,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
        };

        const frontCanvas = await html2canvas(frontElement, canvasOptions);
        const frontImgData = frontCanvas.toDataURL('image/png');

        const backCanvas = await html2canvas(backElement, canvasOptions);
        const backImgData = backCanvas.toDataURL('image/png');

        wrapperElement.style.visibility = 'hidden';

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [398, 631],
        });

        pdf.addImage(frontImgData, 'PNG', 0, 0, 398, 631);
        pdf.addPage();
        pdf.addImage(backImgData, 'PNG', 0, 0, 398, 631);

        pdf.save(`${displayData.student_id}_ID_Card.pdf`);

        try {
          await saveStudentCardNumber(studentData.id, idCardNumber);
        } catch (apiError) {
          console.warn('API Error (Non-fatal for export):', apiError);
        }

        if (onSaveSuccess) {
          onSaveSuccess();
        }
        setShowSuccessNotify(true);
        setTimeout(() => {
          setShowSuccessNotify(false);
          setTimeout(() => {
            onClose();
          }, 500);
        }, 3000);
      }
    } catch (error) {
      console.error('Export Failed', error);
      setExportError('Failed to export. Possible CORS issue or network error.');
    } finally {
      setIsSaving(false);
      setExportDisplayData(null);
    }
  };

  return ReactDOM.createPortal(
    <>
      <div className={styles.overlay}>
        <div className={styles.idCardPopup}>
          <div className={styles.headerTextGroup}>
            <div className={styles.adjustStudentPhoto}>
              {currentView === 'front'
                ? 'Adjust student photo'
                : 'ID Card Back View'}
            </div>
            {currentView === 'front' && (
              <div className={styles.makeSureTo}>
                *Make sure to keep the student image inside and in the middle of
                the box
              </div>
            )}
          </div>

          <div className={styles.previewContainer}>
            <button className={styles.navButton} onClick={toggleView}>
              <ArrowLeft />
            </button>
            <div className={styles.cardPreviewWrapper}>
              <div className={styles.cardScaleContainer}>
                {currentView === 'front' ? (
                  <IdCardFront
                    data={displayData}
                    variant={variant}
                    editable={true}
                    scale={0.6}
                    position={photoPosition}
                    onPositionChange={setPhotoPosition}
                    isExport={false}
                  />
                ) : (
                  <IdCardBack data={displayData} variant={variant} />
                )}
              </div>
            </div>
            <button className={styles.navButton} onClick={toggleView}>
              <ArrowRight />
            </button>
          </div>

          <div className={styles.pageIndicator}>
            <span
              className={
                currentView === 'front' ? styles.dotActive : styles.dot
              }
            ></span>
            <span
              className={currentView === 'back' ? styles.dotActive : styles.dot}
            ></span>
          </div>

          <input
            type='text'
            className={styles.idCardNumberInput}
            placeholder='ID Card number'
            value={idCardNumber}
            onChange={(e) => setIdCardNumber(e.target.value)}
          />

          <div className={styles.footer}>
            <div className={styles.footerColumn}>
              <div className={styles.buttonGroup}>
                <Button
                  variant='outline'
                  onClick={onClose}
                  className={styles.cancelButton}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant='solid'
                  className={styles.exportButton}
                  onClick={handleExport}
                  disabled={isSaving}
                >
                  {isSaving ? 'Exporting...' : 'Export ID Card'}
                </Button>
              </div>
              {exportError && (
                <div className={styles.errorMessage}>{exportError}</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.hiddenExportWrapper}>
        <div
          id='hidden-id-front'
          style={{ width: '398px', height: '631px', margin: 0, padding: 0 }}
        >
          <IdCardFront
            data={finalExportData}
            variant={variant}
            editable={false}
            scale={1}
            position={photoPosition}
            isExport={true}
          />
        </div>
        <div
          id='hidden-id-back'
          style={{ width: '398px', height: '631px', margin: 0, padding: 0 }}
        >
          <IdCardBack data={finalExportData} variant={variant} />
        </div>
      </div>

      <UpdatedNotification
        isOpen={showSuccessNotify}
        onClose={() => setShowSuccessNotify(false)}
        message='Export Successfully'
      />
    </>,
    document.body
  );
};

export default IdCardPopup;
