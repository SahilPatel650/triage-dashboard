// src/components/MapComponent.js
import React from 'react';
import styles from './MapComponent.module.css';

const MapComponent = () => {
  const handleBedClick = (bedNumber) => {
    alert(`You clicked on Bed ${bedNumber}`);
  };

  return (
    <div className={styles.mapContainer}>
      <div className={styles.erLayout}>
        <div className={styles.nursesStation}>Nurses Station</div>
        <div className={styles.waitingArea}>Waiting Area</div>
        <div className={styles.bed} onClick={() => handleBedClick(1)}>Bed 1</div>
        <div className={styles.bed} onClick={() => handleBedClick(2)}>Bed 2</div>
        <div className={styles.bed} onClick={() => handleBedClick(3)}>Bed 3</div>
        <div className={styles.bed} onClick={() => handleBedClick(4)}>Bed 4</div>
        <div className={styles.bed} onClick={() => handleBedClick(5)}>Bed 5</div>
        <div className={styles.bed} onClick={() => handleBedClick(6)}>Bed 6</div> {/* Added Bed 6 */}
      </div>
    </div>
  );
};

export default MapComponent;
