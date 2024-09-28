// src/components/MapComponent.js
import React from 'react';
import BedStack from './BedStack';
import SideArea from './SideArea';
import styles from './MapComponent.module.css';

const MapComponent = () => {
  const handleBedClick = (bedNumber) => {
    alert(`You clicked on Bed ${bedNumber}`);
  };

  return (
    <div className={styles.mapContainer}>
      <div className={styles.erLayout}>
        {/* Left column for the bed stack */}
        <div className={styles.leftColumn}>
          <BedStack onBedClick={handleBedClick} />
        </div>

        {/* Right column for nurses station, waiting area, and imaging rooms */}
        <div className={styles.rightColumn}>
          <SideArea />
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
