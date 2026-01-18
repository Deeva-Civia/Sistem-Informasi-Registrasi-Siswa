import React from 'react';
import styles from './TermOfPaymentContent.module.css';
import RadioButton from '../../../Atoms/Radiobutton/RadioButton';
import Checkbox from '../../../Atoms/Checkbox/Checkbox';

function TermOfPaymentContent({ data, isDormitory }) {
  const option = ['Full Payment', 'Installment'];

  return (
    // DIV INI DIUBAH DARI styles.content MENJADI styles.contentParent
    <div className={styles.contentParent}>
      {/* BARIS PERTAMA */}
      <div className={styles.contentRow}>
        {/* Tuition Fee */}
        <div className={styles.tuitionFee}>
          <div className={styles.txtTuitionFee}>
            <div className={styles.contentTuitionFee}>Tuition Fee</div>
          </div>
          <div className={styles.bottom}>
            {option.map((opt, index) => (
              <div key={index} className={styles.full}>
                <RadioButton
                  name='tuition_fees'
                  value={opt}
                  checked={data?.tuition_fees === opt}
                  onChange={() => {}}
                  readOnly={true}
                />
                <div className={styles.fullPayment}>{opt}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Residence Hall */}
        {isDormitory && data?.residence_payment && (
          <div className={styles.tuitionFee}>
            <div className={styles.txtTuitionFee}>
              <div className={styles.contentTuitionFee}>Residence Hall</div>
            </div>
            <div className={styles.bottom}>
              {option.map((opt, index) => (
                <div key={index} className={styles.full}>
                  <RadioButton
                    name='residence_payment'
                    value={opt}
                    checked={data?.residence_payment === opt}
                    onChange={() => {}}
                    readOnly={true}
                  />
                  <div className={styles.fullPayment}>{opt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discount */}
        <div className={styles.discountSection}>
          <div className={styles.txtTuitionFee}>
            <div className={styles.contentTuitionFee}>Discount</div>
          </div>
          <div className={styles.discountText}>
            <span className={styles.discountName}>
              {data?.discount_name || 'No discount'}
            </span>
            {data?.discount_notes && (
              <span className={styles.discountNotes}>
                ({data.discount_notes})
              </span>
            )}
          </div>
        </div>

        {/* Financial Policy & Contract */}
        <div className={styles.financialPolicySection}>
          <div className={styles.financialPolicyLabel}>
            Financial Policy &amp; Contract
          </div>
          <div className={styles.financialPolicyContent}>
            <div className={styles.financialPolicyCheckbox}>
              <Checkbox
                checked={data?.financial_policy_contract === 'Signed'}
                onChange={() => {}}
                name='financial_policy_contract'
                readOnly={true}
              />
            </div>
            <div className={styles.financialPolicyText}>Signed</div>
          </div>
        </div>
      </div>

      {/* --- BARIS KEDUA (VIRTUAL ACCOUNT) --- */}
      <div className={styles.contentRow}>
        {/* VA Mandiri */}
        <div className={styles.vaItem}>
          <div className={styles.vaLabel}>Virtual Account Mandiri</div>
          <div className={styles.vaNumber}>{data?.va_mandiri || '-'}</div>
        </div>

        {/* VA BNI */}
        <div className={styles.vaItem}>
          <div className={styles.vaLabel}>Virtual Account BNI</div>
          <div className={styles.vaNumber}>{data?.va_bni || '-'}</div>
        </div>

        {/* VA BCA */}
        <div className={styles.vaItem}>
          <div className={styles.vaLabel}>Virtual Account BCA</div>
          <div className={styles.vaNumber}>{data?.va_bca || '-'}</div>
        </div>

        {/* VA BRI */}
        <div className={styles.vaItem}>
          <div className={styles.vaLabel}>Virtual Account BRI</div>
          <div className={styles.vaNumber}>{data?.va_bri || '-'}</div>
        </div>
      </div>
    </div>
  );
}

export default TermOfPaymentContent;
