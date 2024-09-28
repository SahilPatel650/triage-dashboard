"use client";
// src/app/page.js
import MapComponent from "./components/MapComponent";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import PatientsSidebar from "./components/PatientsSidebar";

export default function Home() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Fetch updated string list from API every second
      fetch("http://localhost:5100/get_patients")
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
        <PatientsSidebar patients={patients} />
      </div>
    </div>
  );
}
