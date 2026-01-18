import React, { useState, useEffect } from 'react';
import styles from './StatusConfirmationPopup.module.css';
import ReactDOM from "react-dom";
import WarningSign from '../../../../assets/Warning_Sign.png';
import {
  cancelRegistration,
  getRegistrationPreview,
} from '../../../../services/api';

import Button from '../../../Atoms/Button/Button';

const reasonOptions = [
  { label: 'Withdraw', value: 'cancellationOfEnrollment' },
  { label: 'Invalid Data', value: 'invalidData' },
];

const StatusConfirmationPopup = ({ registration, onClose, onUpdateStatus }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [targetStatus, setTargetStatus] = useState(null);
  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fullData, setFullData] = useState(null);

  useEffect(() => {
    if (!registration || !registration.application_id) {
      console.error('Missing registration/application ID.');
      setIsLoading(false);
      return;
    }

    const fetch = async () => {
      setIsLoading(true);
      try {
        const version = registration.version_id ?? null;
        const response = await getRegistrationPreview(
          registration.application_id,
          version
        );

        setFullData(response.data);

        const currentStatus =
          response.data?.application_form?.status ||
          response.data?.application_status ||
          'N/A';

        const initialTarget =
          currentStatus.toLowerCase() === 'confirmed'
            ? 'Cancelled'
            : 'Confirmed';

        setTargetStatus(initialTarget);
      } catch (error) {
        console.error('Failed loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [registration]);

  const handleToggleStatus = () => {
    setApiError('');

    setTargetStatus((prev) => {
      const next = prev === 'Confirmed' ? 'Cancelled' : 'Confirmed';

      if (next !== 'Cancelled') {
        setSelectedReason('');
        setReasonError('');
        setNotes('');
        setNotesError('');
      }

      return next;
    });
  };

  const showReasonField = targetStatus === 'Cancelled';
  const showNotesField = selectedReason === 'cancellationOfEnrollment';

  const handleUpdate = async () => {
    const applicationId = registration.application_id;

    if (!applicationId) {
      console.error('Missing application ID.');
      return;
    }

    setIsUpdating(true);
    setApiError('');
    setReasonError('');
    setNotesError('');

    try {
      if (targetStatus === 'Cancelled') {
        if (!selectedReason) {
          setReasonError('Cancellation reason must be selected.');
          setIsUpdating(false);
          return;
        }

        if (selectedReason === 'cancellationOfEnrollment' && !notes.trim()) {
          setNotesError('Notes are required for Withdrawal.');
          setIsUpdating(false);
          return;
        }

        let payload = {};
        if (selectedReason === 'cancellationOfEnrollment') {
          payload = { notes };
        }

        await cancelRegistration(applicationId, selectedReason, payload);
      }

      onUpdateStatus(registration.registration_id, targetStatus);
      onClose();
    } catch (err) {
      console.error('Failed updating:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'An unexpected error occurred. Please try again.';

      setApiError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReasonChange = (e) => {
    const newReason = e.target.value;
    setSelectedReason(e.target.value);
    if (reasonError) setReasonError('');
    if (apiError) setApiError('');
    if (newReason !== 'cancellationOfEnrollment') {
      setNotes('');
      setNotesError('');
    }
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    if (notesError) setNotesError('');
    if (apiError) setApiError('');
  };

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popUp} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <img src={WarningSign} alt='Warning' className={styles.icon} />
          <h2 className={styles.title}>Confirm Update Registration Status</h2>
          <p className={styles.message}>
            Please double-check your changes. Once submitted, some changes may
            not be reversible.
          </p>
        </div>

        {isLoading ? (
          <div style={{ padding: 20 }}>Loading student details…</div>
        ) : !fullData ? (
          <div style={{ padding: 20, color: 'red' }}>
            Error loading data. Please close and try again.
          </div>
        ) : (
          <div className={styles.after}>
            <div
              className={styles.registrationInfo}
              style={{
                border:
                  targetStatus === 'Confirmed'
                    ? '4px solid #00F413'
                    : '4px solid #EE0808',
              }}
            >
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Name</span>
                <span className={styles.separator}>:</span>
                <span className={styles.infoValue}>
                  {registration.full_name || 'N/A'}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Student ID</span>
                <span className={styles.separator}>:</span>
                <span className={styles.infoValue}>
                  {fullData.student_id || 'N/A'}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Registration ID</span>
                <span className={styles.separator}>:</span>
                <span className={styles.infoValue}>
                  {registration.registration_id || 'N/A'}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Status</span>
                <span className={styles.separator}>:</span>

                <div
                  className={styles.editableStatus}
                  style={{
                    color: targetStatus === 'Confirmed' ? '#00F413' : '#EE0808',
                  }}
                  onClick={handleToggleStatus}
                >
                  <span style={{ textDecoration: 'underline' }}>
                    {targetStatus}
                  </span>
                </div>
              </div>

              {showReasonField && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Reason</span>
                  <span className={styles.separator}>:</span>

                  <select
                    className={styles.reasonSelect}
                    value={selectedReason}
                    onChange={handleReasonChange}
                  >
                    <option value='' disabled>
                      Select reason
                    </option>
                    {reasonOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {reasonError && (
                    <div className={styles.reasonError}>{reasonError}</div>
                  )}
                </div>
              )}

              {showNotesField && (
                <>
                  <div
                    className={styles.infoRow}
                    style={{ alignItems: 'flex-start' }}
                  >
                    <span className={styles.infoLabel}>Notes</span>
                    <span className={styles.separator}>:</span>
                    <textarea
                      className={styles.notesTextarea}
                      value={notes}
                      onChange={handleNotesChange}
                      placeholder='Please explain the reason for withdrawal...'
                      rows={2}
                    />
                  </div>
                  {notesError && (
                    <div
                      className={styles.notesError}
                      style={{
                        padding: '0 0 5px 0',
                        textAlign: 'left',
                        marginLeft: '165px',
                      }}
                    >
                      {notesError}
                    </div>
                  )}
                </>
              )}

              {!showReasonField && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Reason</span>
                  <span className={styles.separator}>:</span>
                  <span className={styles.infoValue}>-</span>
                </div>
              )}
            </div>
          </div>
        )}

        {apiError && <div className={styles.reasonError}>{apiError}</div>}

        <div className={styles.button}>
          <div className={styles.rowBtn}>
            <Button
              className={styles.bAddSubject1}
              onClick={onClose}
              disabled={isUpdating || isLoading}
              variant='solid'
            >
              Cancel
            </Button>

            <Button
              className={styles.bAddSubject}
              onClick={handleUpdate}
              disabled={isUpdating || isLoading}
              variant='outline'
            >
              {isUpdating
                ? targetStatus === 'Confirmed'
                  ? 'Confirming...'
                  : 'Cancelling...'
                : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StatusConfirmationPopup;
