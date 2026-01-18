import React from 'react';
import styles from './ParentsGuardianInformationContent.module.css';

const ParentsGuardianInformationContent = ({ data }) => {
  const formatValue = (val) =>
    val === null || val === undefined || val === '' ? '-' : val;

  return (
    <div className={styles.content}>
      <div className={styles.father}>
        <div className={styles.txtFather}>
          <div className={styles.heading}>Father's Information</div>
        </div>
        <div className={styles.first}>
          <div className={styles.left}>
            <div className={styles.name}>
              <div className={styles.field}>{`Name `}</div>
              <b className={styles.field}>{formatValue(data.father_name)}</b>
            </div>
            <div className={styles.name}>
              <div className={styles.field}>Phone number</div>
              <b className={styles.field}>{formatValue(data.father_phone)}</b>
            </div>
            <div className={styles.name}>
              <div className={styles.field}>Email</div>
              <b className={styles.gmail}>{formatValue(data.father_email)}</b>
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.txtFather}>
              <div className={styles.compName}>
                <div className={styles.field}>Company name</div>
                <b className={styles.nameCompany}>
                  {formatValue(data.father_company)}
                </b>
              </div>
              <div className={styles.compName}>
                <div className={styles.field}>Occupation/Position</div>
                <b className={styles.position}>
                  {formatValue(data.father_occupation)}
                </b>
              </div>
            </div>
            <div className={styles.bottom}>
              <div className={styles.field}>Address</div>
              <b className={styles.field}>
                {formatValue(data.father_address_street)},
              </b>
              <div className={styles.parent}>
                <b className={styles.field}>
                  {formatValue(data.father_address_rt)}
                </b>
                <b className={styles.b3}>/</b>
                <b className={styles.field}>
                  {formatValue(data.father_address_rw)},
                </b>
              </div>
              <b className={styles.field}>
                {formatValue(data.father_address_village)},
              </b>
              <b className={styles.field}>
                {formatValue(data.father_address_district)},
              </b>
              <b className={styles.field}>
                {formatValue(data.father_address_city_regency)},
              </b>
              <b className={styles.field}>
                {formatValue(data.father_address_province)},
              </b>
              <div className={styles.parent}>
                <b className={styles.b3}>(</b>
                <b className={styles.field}>
                  {formatValue(data.father_address_other)}
                </b>
                <b className={styles.b3}>)</b>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.father}>
        <div className={styles.txtFather}>
          <div className={styles.heading}>Mother's Information</div>
        </div>
        <div className={styles.first}>
          <div className={styles.left}>
            <div className={styles.name}>
              <div className={styles.field}>{`Name `}</div>
              <b className={styles.field}>{formatValue(data.mother_name)}</b>
            </div>
            <div className={styles.name}>
              <div className={styles.field}>Phone number</div>
              <b className={styles.field}>{formatValue(data.mother_phone)}</b>
            </div>
            <div className={styles.name}>
              <div className={styles.field}>Email</div>
              <b className={styles.gmail}>{formatValue(data.mother_email)}</b>
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.txtFather}>
              <div className={styles.compName}>
                <div className={styles.field}>Company name</div>
                <b className={styles.nameCompany}>
                  {formatValue(data.mother_company)}
                </b>
              </div>
              <div className={styles.compName}>
                <div className={styles.field}>Occupation/Position</div>
                <b className={styles.position}>
                  {formatValue(data.mother_occupation)}
                </b>
              </div>
            </div>
            <div className={styles.bottom}>
              <div className={styles.field}>Address</div>
              <b className={styles.field}>
                {formatValue(data.mother_address_street)},
              </b>
              <div className={styles.parent}>
                <b className={styles.field}>
                  {formatValue(data.mother_address_rt)}
                </b>
                <b className={styles.b3}>/</b>
                <b className={styles.field}>
                  {formatValue(data.mother_address_rw)},
                </b>
              </div>
              <b className={styles.field}>
                {formatValue(data.mother_address_village)},
              </b>
              <b className={styles.field}>
                {formatValue(data.mother_address_district)},
              </b>
              <b className={styles.field}>
                {formatValue(data.mother_address_city_regency)},
              </b>
              <b className={styles.field}>
                {formatValue(data.mother_address_province)},
              </b>
              <div className={styles.parent}>
                <b className={styles.b3}>(</b>
                <b className={styles.field}>
                  {formatValue(data.mother_address_other)}
                </b>
                <b className={styles.b3}>)</b>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.father}>
        <div className={styles.txtFather}>
          <div className={styles.heading}>
            Authorized Guardian's Information
          </div>
        </div>
        <div className={styles.guardianInfo}>
          <div className={styles.left1}>
            <div className={styles.top1}>
              <div className={styles.relation}>
                <div className={styles.field}>{`Name `}</div>
                <b className={styles.guardianField}>
                  {formatValue(data.guardian_name)}
                </b>
              </div>
              <div className={styles.relation}>
                <div className={styles.field}>Relationship to student</div>
                <b className={styles.guardianField}>
                  {formatValue(data.relation_to_student)}
                </b>
              </div>
            </div>
            <div className={styles.top1}>
              <div className={styles.relation}>
                <div className={styles.field}>Phone number</div>
                <b className={styles.guardianField}>
                  {formatValue(data.guardian_phone)}
                </b>
              </div>
              <div className={styles.relation}>
                <div className={styles.field}>Email</div>
                <b className={styles.guardianField}>
                  {formatValue(data.guardian_email)}
                </b>
              </div>
            </div>
          </div>
          <div className={styles.right1}>
            <div className={styles.address3}>
              <div className={styles.field}>Address</div>
              <b className={styles.field}>
                {formatValue(data.guardian_address_street)},
              </b>
              <div className={styles.parent}>
                <b className={styles.field}>
                  {formatValue(data.guardian_address_rt)}
                </b>
                <b className={styles.b3}>/</b>
                <b className={styles.field}>
                  {formatValue(data.guardian_address_rw)},
                </b>
              </div>
              <b className={styles.field}>
                {formatValue(data.guardian_address_village)},
              </b>
              <b className={styles.field}>
                {formatValue(data.guardian_address_district)},
              </b>
              <b className={styles.field}>
                {formatValue(data.guardian_address_city_regency)},
              </b>
              <b className={styles.field}>
                {formatValue(data.guardian_address_province)},
              </b>
              <div className={styles.parent}>
                <b className={styles.b3}>(</b>
                <b className={styles.field}>
                  {formatValue(data.guardian_address_other)}
                </b>
                <b className={styles.b3}>)</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentsGuardianInformationContent;

