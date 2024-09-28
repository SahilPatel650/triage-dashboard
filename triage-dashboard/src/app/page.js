"use client";
// src/app/page.js
import MapComponent from './components/MapComponent';
import PatientsSidebar from './components/PatientsSidebar';
import styles from './page.module.css';

const fakePatients = [
  { id: 1, name: "John Doe", room: "101", status: "Stable"},
  { id: 2, name: "Jane Smith", room: "102", status: "Under Observation", image: "https://via.placeholder.com/56" },
  { id: 3, name: "Alice Johnson", room: "103", status: "Critical", image: "https://via.placeholder.com/56" },
  { id: 4, name: "Bob Brown", room: "104", status: "In Recovery", image: "https://via.placeholder.com/56" },
  { id: 5, name: "Charlie Davis", room: "105", status: "Discharged", image: "https://via.placeholder.com/56" },
  { id: 6, name: "Mrinal Jain", room: "105", status: "Discharged", image: "https://via.placeholder.com/56" }
];

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.mapSection}>
        <MapComponent />
      </div>
      <div className={styles.notificationSection}>
        <PatientsSidebar patients={fakePatients} />
      </div>
    </div>
  );
}
