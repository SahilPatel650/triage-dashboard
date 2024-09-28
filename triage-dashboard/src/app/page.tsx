// src/app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import ERLiveResponse from './ERLiveResponse';

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

  return (
    <main>
      <ERLiveResponse />
    </main>
  );
}
