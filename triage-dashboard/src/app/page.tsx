"use client";
import { useEffect, useState } from "react";
import ERLiveResponse from "./ERLiveResponse";

export default function Home() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Fetch updated patient list from API every second
      fetch("http://localhost:5100/get_patients")
        .then((response) => response.json())
        .then((data) => setPatients(data))
        .catch((error) => console.error("Error fetching patient data:", error));
    }, 1000);
    // Clear the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  console.log(patients);
  return (
    <main className="container">
      <ERLiveResponse patients={patients} />
    </main>
  );
}
