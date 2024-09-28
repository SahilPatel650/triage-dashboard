// src/components/SideArea.js
import React from 'react';
import styles from './SideArea.module.css';

const SideArea = () => {
  return (
    <div className={styles.sideArea}>
      <div className={styles.nursesStation}>Nurses Station</div>
      <div className={styles.waitingArea}>Waiting Area</div>
      <div className={styles.imagingRooms}>
        <div className={styles.mri}>MRI Room</div>
        <div className={styles.xray}>X-Ray Room</div>
        <div className={styles.ct}>CT Room</div>
        <div className={styles.cat}>CAT Room</div>
      </div>
    </div>
  );
};

export default SideArea;
