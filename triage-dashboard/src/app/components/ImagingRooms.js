// src/components/ImagingRooms.js
import React from 'react';
import styles from './ImagingRooms.module.css';

const ImagingRooms = () => {
  return (
    <div className={styles.imagingRooms}>
      <div className={styles.room}>MRI Room</div>
      <div className={styles.room}>X-Ray Room</div>
      <div className={styles.room}>CT Room</div>
      <div className={styles.room}>CAT Scan Room</div>
    </div>
  );
};

export default ImagingRooms;
