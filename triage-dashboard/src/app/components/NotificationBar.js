// src/components/NotificationBar.js
import React from 'react';
import styles from './NotificationBar.module.css';

const NotificationBar = () => {
  return (
    <div className={styles.notificationBar}>
      <h2 className={styles.title}>Patients</h2>
      <ul className={styles.notificationList}>
        <li>Emergency Alert: Room 101 is now available.</li>
        <li>New Patient Arrived: Room 102 is occupied.</li>
        <li>Staff Meeting: 2 PM in the Conference Room.</li>
      </ul>
    </div>
  );
};

export default NotificationBar;
