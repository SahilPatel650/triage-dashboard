// src/components/BedStack.js
import React from "react";
import BedComponent from "./BedComponent";
import styles from "./BedStack.module.css";

const BedStack = ({ onBedClick }) => {
  return (
    <div className={styles.bedStack}>
      {[...Array(5)].map((_, index) => (
        <BedComponent key={index} index={index} onBedClick={onBedClick} />
      ))}
    </div>
  );
};

export default BedStack;
