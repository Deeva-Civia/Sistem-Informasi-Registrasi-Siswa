import React from 'react';
import styles from './FacilitiesContent.module.css';
import RadioButton from '../../../Atoms/Radiobutton/RadioButton';
import Checkbox from '../../../Atoms/Checkbox/Checkbox';

function FacilitiesContent({ data, pickupPointOptions }) {
  if (!data) return null;
  const localTransportations = [
    { id: 1, name: 'Own car' },
    { id: 2, name: 'School bus' },
  ];
  const localResidences = [
    { id: 1, name: 'Boys dormitory' },
    { id: 2, name: 'Girls dormitory' },
    { id: 3, name: 'Non-Residence hall' },
  ];

  const getPickupPointName = () => {
    if (data?.pickup_point_id) {
      const option = pickupPointOptions.find(
        (p) => p.pickup_point_id === parseInt(data.pickup_point_id, 10)
      );
      return option ? option.name : '-';
    }
    return data?.pickup_point_custom ?? '-';
  };
  // eslint-disable-next-line
  const getTransportationName = () => {
    if (data?.transportation_id) {
      const idToMatch = parseInt(data.transportation_id, 10);
      const found = localTransportations.find((t) => t.id === idToMatch);
      return found ? found.name : '-';
    }
    return '-';
  };
  // eslint-disable-next-line
  const getResidenceName = () => {
    if (data?.residence_id) {
      const idToMatch = parseInt(data.residence_id, 10);
      const found = localResidences.find((r) => r.id === idToMatch);
      return found ? found.name : '-';
    }
    return '-';
  };

  return (
    <div className={styles.content}>
      <div className={styles.top}>
        <div className={styles.txtTransportation}>
          <div className={styles.transportation}>Transportation</div>
        </div>

        {localTransportations.map((transport) => (
          <div key={transport.id} className={styles.ownCar}>
            <RadioButton
              name='transportation'
              value={transport.id}
              checked={String(data?.transportation_id) === String(transport.id)}
              onChange={() => {}}
              readOnly={true}
            />
            <div className={styles.field}>{transport.name}</div>
          </div>
        ))}

        <div className={styles.schoolBusDetails}>
          <div className={styles.pickupPoint}>
            <div className={styles.field}>Pickup point</div>
            <b className={styles.pickupPointAnswer}>{getPickupPointName()}</b>
          </div>
        </div>

        <div className={styles.ownCar}>
          <Checkbox
            checked={data?.transportation_policy === 'Signed'}
            onChange={() => {}}
            name='transportation_policy'
            readOnly={true}
          />
          <div className={styles.checkBoxPolicy}>Transportation policy</div>
        </div>
      </div>

      <div className={styles.top}>
        <div className={styles.txtRh}>
          <div className={styles.residenceHall}>Residence Hall</div>
        </div>

        {localResidences.map((residence) => (
          <div key={residence.id} className={styles.ownCar}>
            <RadioButton
              name='residence'
              value={residence.id}
              checked={String(data?.residence_id) === String(residence.id)}
              onChange={() => {}}
              readOnly={true}
            />
            <div className={styles.field}>{residence.name}</div>
          </div>
        ))}

        <div className={styles.ownCar}>
          <Checkbox
            checked={data?.residence_hall_policy === 'Signed'}
            onChange={() => {}}
            name='residence_hall_policy'
            readOnly={true}
          />
          <div className={styles.checkBoxPolicy}>Residence Hall policy</div>
        </div>
      </div>
    </div>
  );
}

export default FacilitiesContent;
