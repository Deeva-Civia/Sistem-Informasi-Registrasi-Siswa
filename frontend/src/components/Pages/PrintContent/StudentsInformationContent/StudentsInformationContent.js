import React from 'react';
import styles from './StudentsInformationContent.module.css';

const StudentsInformationContent = ({ data }) => {
  if (!data) return null;

  const formatValue = (val) =>
    val === null || val === undefined || val === '' ? ' ' : val;

  return (
    <div className={styles.content}>
      <div className={styles.left}>
        <div className={styles.fullName}>
          <div className={styles.field}>{`Full name `}</div>
          <b className={styles.answer}>
            {formatValue(data.request_data.last_name)},
          </b>
          <b className={styles.answer}>
            {formatValue(data.request_data.first_name)}
          </b>
          <b className={styles.answer}>
            {formatValue(data.request_data.middle_name)}
          </b>
        </div>
        <div className={styles.fullName}>
          <div className={styles.contentFullName}>Student ID</div>
          <b className={styles.answer}>{formatValue(data.student_id)}</b>
        </div>
        <div className={styles.fullName}>
          <div className={styles.contentFullName}>NIK</div>
          <b className={styles.answer}>{formatValue(data.request_data.nik)}</b>
        </div>
        <div className={styles.fullName}>
          <div className={styles.contentFullName}>NISN</div>
          <b className={styles.answer}>{formatValue(data.request_data.nisn)}</b>
        </div>
        <div className={styles.fullName}>
          <div className={styles.contentFullName}>KITAS</div>
          <b className={styles.answer}>
            {formatValue(data.request_data.kitas)}
          </b>
        </div>
        <div className={styles.fullName}>
          <div className={styles.contentFullName}>Academic status</div>
          <b className={styles.answer}>
            {data.request_data.academic_status === 'OTHER'
              ? formatValue(data.request_data.academic_status_other)
              : formatValue(data.request_data.academic_status)}
          </b>
        </div>
        <div className={styles.fullName}>
          <div className={styles.field}>Student status</div>
          <b className={styles.answer}>
            {formatValue(data.request_data.student_status)}
          </b>
        </div>
        <div className={styles.fullName}>
          <div className={styles.field}>Previous School</div>
          <b className={styles.answer}>
            {formatValue(data.request_data.previous_school)}
          </b>
        </div>
        <div className={styles.fullName}>
          <div className={styles.field}>Email address</div>
          <b className={styles.answer}>
            {formatValue(data.request_data.email)}
          </b>
        </div>
        <div className={styles.fullName}>
          <div className={styles.field}>Phone number</div>
          <b className={styles.answer}>
            {formatValue(data.request_data.phone_number)}
          </b>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.top}>
          <div className={styles.left}>
            <div className={styles.fullName}>
              <div className={styles.field}>Citizenship</div>
              <b className={styles.answer}>
                {formatValue(data.request_data.citizenship)}
              </b>
            </div>
            <div className={styles.fullName}>
              <div className={styles.field}>Religion</div>
              <b className={styles.answer}>
                {formatValue(data.request_data.religion)}
              </b>
            </div>
            <div className={styles.fullName}>
              <div className={styles.field}>Place of birth</div>
              <b className={styles.answer}>
                {formatValue(data.request_data.place_of_birth)}
              </b>
            </div>
            <div className={styles.fullName}>
              <div className={styles.field}>Date of birth</div>
              <b className={styles.answer}>
                {formatValue(data.request_data.date_of_birth)}
              </b>
            </div>
          </div>
          <div className={styles.contentRight}>
            <div className={styles.fullName}>
              <div className={styles.field}>Nickname</div>
              <b className={styles.answer}>
                {formatValue(data.request_data.nickname)}
              </b>
            </div>
            <div className={styles.fullName}>
              <div className={styles.field}>Gender</div>
              <b className={styles.answer}>
                {formatValue(data.request_data.gender)}
              </b>
            </div>
            <div className={styles.fullName}>
              <div className={styles.field}>Age</div>
              <b className={styles.answer}>
                {formatValue(data.request_data.age)}
              </b>
            </div>
            <div className={styles.rankInFamily}>
              <div className={styles.field}>Rank in the family</div>
              <b className={styles.answer}>
                {formatValue(data.request_data.family_rank)}
              </b>
            </div>
          </div>
        </div>
        <div className={styles.top}>
          <div className={styles.address}>
            <div className={styles.field}>Address</div>
            <b className={styles.answer}>
              {formatValue(data.request_data.street)},
            </b>
            <b className={styles.answer}></b>
            <div className={styles.parent}>
              <b className={styles.answer}>
                {formatValue(data.request_data.rt)}
              </b>
              <b className={styles.answer}>/</b>
              <b className={styles.answer}>
                {formatValue(data.request_data.rw)},
              </b>
            </div>
            <b className={styles.answer}></b>
            <b className={styles.answer}>
              {formatValue(data.request_data.village)},
            </b>
            <b className={styles.answer}></b>
            <b className={styles.answer}>
              {formatValue(data.request_data.district)},
            </b>
            <b className={styles.answer}></b>
            <b className={styles.answer}>
              {formatValue(data.request_data.city_regency)},
            </b>
            <b className={styles.answer}></b>
            <b className={styles.answer}>
              {formatValue(data.request_data.province)},
            </b>
            <b className={styles.answer}></b>
            <div className={styles.parent}>
              <b className={styles.answer}>(</b>
              <b className={styles.answer}>
                {formatValue(data.request_data.other)}
              </b>
              <b className={styles.answer}>)</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsInformationContent;

