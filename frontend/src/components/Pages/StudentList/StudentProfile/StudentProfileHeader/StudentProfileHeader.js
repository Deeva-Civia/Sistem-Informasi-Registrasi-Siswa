// File: src/components/pages/studentProfileHeader/studentProfileHeader.js

import React, { useState, useMemo } from 'react';
import styles from './StudentProfileHeader.module.css';
import Button from '../../../../Atoms/Button/Button';
import placeholder from '../../../../../assets/user.svg';
import IdCardPopup from '../../../../Molecules/PopUp/IdCardPopup/IdCardPopup';

const getStatusVariant = (status) => {
  if (!status) return 'not-graduated';
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('not graduate')) return 'not-graduated';
  if (lowerStatus.includes('graduate')) return 'graduated';
  if (lowerStatus.includes('expelled')) return 'expelled';
  if (lowerStatus.includes('withdraw')) return 'withdraw';
  return 'not-graduated'; 
};

const StudentProfileHeader = ({
  studentInfo,
  formData,
  photoPreview,
  isEditing,
  isUpdating,
  selectedVersionId,
  isHistoryVisible,
  isLoadingHistory,
  historyDates,
  historyRef,
  onViewHistoryClick,
  onHistoryDateChange,
  onEditClick,
  onCancelClick,
  onSaveClick,
  statusOptions,
  onAddPhotoClick,
  onStatusChange,
  onDownloadPdfClick,
  studentPrimaryId,
  idCardInfo,
  onIdCardUpdate,
}) => {
  const [isIdCardPopupOpen, setIdCardPopupOpen] = useState(false);
  const [isStatusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const hasPreview = !!photoPreview;
  const hasFormDataUrl = !!(formData && formData.photo_url);

  const displayPhotoUrl = useMemo(() => {
      if (isEditing && photoPreview) {
          return photoPreview;
      }
      
      if (formData?.photo_url) {
          return formData.photo_url;
      }
      
      return placeholder;
  }, [isEditing, photoPreview, formData?.photo_url]);

  const imageUrl =
    photoPreview || (formData && formData.photo_url) || placeholder;
  const imageClass =
    displayPhotoUrl !== placeholder
      ? styles.profileImage
      : styles.profilePlaceholder;

  // [UPDATE] Persiapan data untuk popup ID Card
  const idCardData = {
    // Gunakan Primary ID (dari URL/params) agar endpoint API valid
    id: studentPrimaryId,
    firstName: studentInfo.first_name,
    middleName: studentInfo.middle_name,
    lastName: studentInfo.last_name,
    studentId: formData.student_id || studentInfo.student_id,
    photoUrl: displayPhotoUrl,
    nisn: studentInfo.nisn,
    placeOfBirth: studentInfo.place_of_birth,
    dateOfBirth: studentInfo.date_of_birth,
    schoolYear: formData.school_year,
    sectionName: (() => {
      const secId = parseInt(formData.section_id, 10);
      if (secId === 3) return 'Middle School';
      if (secId === 4) return 'High School';
      return 'Elementary School';
    })(),
    // [BARU] Kirim data card number jika ada, agar popup terisi otomatis
    card_number: idCardInfo?.card_number || '',
  };

  const getSectionType = () => {
    const secId = parseInt(formData.section_id, 10);
    if (secId === 3) return 'ms';
    if (secId === 4) return 'hs';
    return 'ecp';
  };

  // [BARU] Logika tampilan Card Number
  const displayedCardNumber = idCardInfo?.card_number || '-';

  return (
    <div className={styles.profileHeader}>
      {/* Kolom Kiri: Foto */}
      <div className={styles.headerPhotoSection}>
        <img
          className={imageClass}
          src={displayPhotoUrl}
          alt='Student Profile'
        />
      </div>

      {/* Kolom Tengah: Info & Status */}
      <div className={styles.headerInfoSection}>
        <div className={styles.studentIdContainer}>
          <span className={styles.idLabel}>Student ID</span>
          <b className={styles.idValue}>
            {formData.student_id || studentInfo.student_id}
          </b>
        </div>

        <div className={styles.schoolYearContainer}>
          <span className={styles.yearLabel}>School year</span>
          <b className={styles.yearValue}>{formData.school_year || '-'}</b>
        </div>

        <div
          className={`${styles.idCardContainer} ${
            isEditing ? styles.idCardContainerEdit : ''
          }`}
        >
          <span className={styles.idLabel}>ID Card number :</span>
          {/* [UPDATE] Tampilkan card number dari API */}
          <b className={styles.idValue}>{displayedCardNumber}</b>
        </div>

        {isEditing ? (
          <div className={styles.statusAndEditPhotoContainer}>
            <div className={styles.statusGroup}>
              <Button
                variant={
                  studentInfo.student_active === 'YES' ? 'active' : 'not-active'
                }
              >
                {studentInfo.student_active === 'YES' ? 'Active' : 'Not Active'}
              </Button>

              <div className={styles.historyContainer}>
                <Button
                  variant={getStatusVariant(studentInfo.status)}
                  showDropdownIcon={true}
                  onClick={() => setStatusDropdownOpen(!isStatusDropdownOpen)}
                >
                  {studentInfo.status || 'Select Status'}
                </Button>
                {isStatusDropdownOpen && (
                  <ul className={styles.historyDropdown}>
                    {statusOptions.length > 0 ? (
                      statusOptions.map((option) => (
                        <li
                          key={option}
                          className={styles.historyItem}
                          onClick={() => {
                            onStatusChange(option);
                            setStatusDropdownOpen(false);
                          }}
                        >
                          {option}
                        </li>
                      ))
                    ) : (
                      <li className={styles.historyInfoItem}>No options.</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
            <Button
              className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
              onClick={onAddPhotoClick}
              variant='solid'
            >
              Edit photo
            </Button>
          </div>
        ) : (
          // --- VIEW MODE ---
          !selectedVersionId && (
            <div className={styles.statusAndActionGroup}>
              <div className={styles.statusTagContainer}>
                <Button
                  variant={
                    studentInfo.student_active === 'YES'
                      ? 'active'
                      : 'not-active'
                  }
                >
                  {studentInfo.student_active === 'YES'
                    ? 'Active'
                    : 'Not Active'}
                </Button>
                <Button variant={getStatusVariant(studentInfo.status)}>
                  {studentInfo.status || 'Not Graduated'}
                </Button>
              </div>
              <Button
                className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                onClick={onDownloadPdfClick}
                variant='solid'
              >
                Download PDF
              </Button>
            </div>
          )
        )}
      </div>

      {/* Kolom Kanan: Tombol Aksi */}
      <div className={styles.headerActionSection}>
        {!isEditing && (
          <div className={styles.historyContainer} ref={historyRef}>
            <Button variant='outline' onClick={onViewHistoryClick}>
              {selectedVersionId
                ? 'Back to Latest Version'
                : 'View data version history'}
            </Button>
            {isHistoryVisible && (
              <ul className={styles.historyDropdown}>
                {isLoadingHistory ? (
                  <li className={styles.historyInfoItem}>Loading...</li>
                ) : historyDates.length > 0 ? (
                  historyDates.map((group, index) => (
                    <React.Fragment key={group.school_year || index}>
                      <li className={styles.historySchoolYear}>
                        {group.school_year}
                      </li>
                      {group.dates.map((version) => (
                        <li
                          key={version.version_id}
                          className={styles.historyItem}
                          onClick={() =>
                            onHistoryDateChange(version.version_id)
                          }
                        >
                          {version.updated_at}
                        </li>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  <li className={styles.historyInfoItem}>No history found.</li>
                )}
              </ul>
            )}
          </div>
        )}

        {isEditing ? (
          <>
            <Button
              className={styles.actionButton}
              onClick={onCancelClick}
              disabled={isUpdating}
              variant='outline'
            >
              Cancel
            </Button>
            <Button
              className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
              onClick={onSaveClick}
              disabled={isUpdating}
              variant='solid'
            >
              {isUpdating ? 'Saving...' : 'Save changes'}
            </Button>
          </>
        ) : (
          !selectedVersionId && (
            <>
              <Button
                className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                onClick={onEditClick}
                variant='solid'
              >
                Edit
              </Button>
              <Button
                className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                onClick={() => setIdCardPopupOpen(true)}
                variant='solid'
              >
                New ID Card
              </Button>
            </>
          )
        )}
      </div>

      <IdCardPopup
        isOpen={isIdCardPopupOpen}
        onClose={() => setIdCardPopupOpen(false)}
        studentData={idCardData}
        sectionType={getSectionType()}
        // [UPDATE] Pass handler sukses
        onSaveSuccess={onIdCardUpdate}
      />
    </div>
  );
};

export default StudentProfileHeader;
