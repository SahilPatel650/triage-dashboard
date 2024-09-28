"use client";
// src/app/page.js
import MapComponent from "./components/MapComponent";
import NotificationBar from "./components/NotificationBar";
import styles from "./page.module.css";
import { useEffect, useState } from "react";

export default function Home() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Fetch updated string list from API every second
      fetch("/api/new-patient")
        .then((res) => res.json())
        .then((data) => setPatients(data))
        .catch((err) => console.error(err));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  console.log(patients);
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
