"use client";
import { useEffect, useState } from "react";
import ERLiveResponse from "./ERLiveResponse";

export default function Home() {
  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Fetch updated patient list from API every second
      fetch("http://localhost:5100/get_patients")
        .then((response) => response.json())
        .then((data) => setPatients(data))
        .catch((error) => console.error("Error fetching patient data:", error));
      fetch("http://localhost:5100/get_beds")
        .then((response) => response.json())
        .then((data) => setBeds(data))
        .catch((error) => console.error("Error fetching bed data:", error));
      fetch("http://localhost:5100/get_rooms")
        .then((response) => response.json())
        .then((data) => setRooms(data))
        .catch((error) => console.error("Error fetching bed data:", error));
    }, 1000);
    // Clear the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  console.log(beds);
  return (
    <main className="container">
      <ERLiveResponse patients={patients} beds={beds} rooms={rooms} />
    </main>
  );
}
