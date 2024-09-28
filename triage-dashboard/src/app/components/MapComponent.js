// src/components/MapComponent.js
import React from 'react';
import BedStack from './BedStack';
import SideArea from './SideArea';
import styles from './MapComponent.module.css';

const MapComponent = () => {
  const handleBedClick = (bedNumber) => {
    alert(`You clicked on Bed ${bedNumber}`);
  };

  const bedData = [
    { roomName: "Bed 1", isActive: true, patientID: "P12345" },
    { roomName: "Bed 2", isActive: false, patientID: null },
    { roomName: "Bed 3", isActive: true, patientID: "P67890" },
    { roomName: "Bed 4", isActive: false, patientID: null },
    { roomName: "Bed 5", isActive: true, patientID: "P54321" },
  ];


  return (
    <div className={styles.mapContainer}>
      <div className={styles.erLayout}>
        {/* Left column for the bed stack */}
        <div className={styles.leftColumn}>
            <BedStack bedData={bedData} onBedClick={handleBedClick} />
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
