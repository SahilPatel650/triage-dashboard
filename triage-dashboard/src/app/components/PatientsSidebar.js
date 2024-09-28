// src/components/PatientsSidebar.js
import React from "react";
import styles from "./PatientsSidebar.module.css";

const PatientsSidebar = ({ patients, onPatientSelect }) => {
  return (
    <div className={styles.sidebar}>
      <h2 className={styles.sidebarTitle}>Patients</h2> {/* Use the new class here */}
      <ul className={styles.patientList}>
        {patients.map((patient) => (
          <li key={patient.id} className={styles.patientItem}>
            <div className={styles.patientInfo} onClick={() => onPatientSelect(patient)}>
              <strong>{patient.name}</strong> - Room {patient.room}
            </div>
            <div className={styles.patientStatus}>{patient.status}</div>
            <button
              className={styles.arrivalButton}
              onClick={() => alert(`Patient ${patient.name} confirmed as arrived!`)}
            >
              Confirm Arrival
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PatientsSidebar;
