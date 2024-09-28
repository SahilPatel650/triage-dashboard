// src/components/BedStack.js
import React from "react";
import BedComponent from "./BedComponent";
import styles from "./BedStack.module.css";

const BedStack = ({ bedData}) => {
  return (
    <div className={styles.bedStack}>
      {bedData.map((bed, index) => (
        <BedComponent 
          key={index} 
          roomName={bed.roomName} 
          isActive={bed.isActive} 
          patientID={bed.patientID}
        />
      ))}
    </div>
  );
};

export default BedStack;
