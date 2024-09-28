"use client";
// src/app/page.js
import MapComponent from './components/MapComponent';
import NotificationBar from './components/NotificationBar';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.mapSection}>
        <MapComponent />
      </div>
      <div className={styles.notificationSection}>
        <NotificationBar />
      </div>
    </div>
  );
}
