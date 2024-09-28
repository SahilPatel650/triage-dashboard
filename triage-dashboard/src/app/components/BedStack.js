// src/components/BedStack.js
import React from 'react';
import styles from './BedStack.module.css';

const BedStack = ({ onBedClick }) => {
  return (
    <div className={styles.bedStack}>
      {[...Array(5)].map((_, index) => (
        <div 
          key={index} 
          className={styles.bed} 
          onClick={() => onBedClick(index + 1)}
        >
          Bed {index + 1}
        </div>
      ))}
    </div>
  );
};

export default BedStack;
