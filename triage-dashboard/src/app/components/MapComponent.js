// components/MapComponent.js
import styles from './MapComponent.module.css'; 

const MapComponent = () => {
  const handleRoomClick = () => {
    alert("Room Details");
  };

  return (
    <div className={styles.mapContainer}>
      <img 
        src="/floor_plan.png" 
        alt="Emergency Room Floor Plan" 
        className={styles.floorPlanImage} 
      />
      <div 
        className={styles.roomOverlay} 
        style={{ left: '30%', top: '40%', width: '20%', height: '20%' }} 
        onClick={handleRoomClick}
      />
    </div>
  );
};

export default MapComponent;
