"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Bed,
  Brain,
  Bone,
  Activity,
  User,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Hospital,
  UserX,
  ListPlus,
  Captions,
  PillBottle,
  Magnet,
} from "lucide-react";
import React from "react";

const roomIcons = {
  MRI: <Magnet className="h-16 w-16 mb-2" />,
  "X-Ray": <Bone className="h-16 w-16 mb-2" />,
  "CT Scan": <Brain className="h-16 w-16 mb-2" />,
  "Blood Test": <Activity className="h-16 w-16 mb-2" />,
  "Operating Room": <Hospital className="h-16 w-16 mb-2" />,
};

// Custom FlippingCard Component
function FlippingCard({
  bedNumber,
  patient,
}: {
  bedNumber: number;
  patient: Patient;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const removePatient = () => {
    fetch("http://localhost:5100/delete_patient/" + patient.id, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  };

  // Helper function to determine the bed color based on triage
  const getBedColor = (triage: number) => {
    return [
      "text-red-500",
      "text-orange-300",
      "text-yellow-300",
      "text-green-300",
      "text-green-500",
    ][triage - 1];
  };

  return (
    <div
      className="relative w-full h-full [perspective:1000px] group cursor-pointer"
      onClick={toggleFlip}
    >
      <div
        className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front of the card */}
        <Card
          className={`absolute w-full h-full [backface-visibility:hidden] transition-colors duration-300 bg-white backdrop-blur-sm border-2 border-gray-300 shadow-xl`}
        >
          <CardContent className="flex flex-col items-center justify-center h-full">
            <div className="relative w-24 h-24 mb-4">
              <Bed
                className={`w-full h-full ${patient ? getBedColor(patient.triage) : "text-gray-500"}`}
              />
            </div>
            <h2
              className={`text-2xl font-bold ${patient ? "text-black" : "text-gray-500"}`}
            >
              Bed {bedNumber}
            </h2>
            <p className="text-sm mt-2 text-center">
              {patient ? patient.name : "Available"}
            </p>
          </CardContent>
        </Card>

        {/* Back of the card */}
        <Card
          className={`absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white/80 backdrop-blur-sm border-2 border-gray-300 shadow-xl`}
        >
          <CardContent className="flex flex-col items-center justify-center h-full">
            {patient ? (
              <>
                <User
                  className={`w-24 h-24 mb-4 ${getBedColor(patient.triage)}`}
                />
                <h2 className="text-2xl font-bold mb-4 text-black-700">
                  {patient.name}
                </h2>
                <p className="text-center text-gray-600">
                  Symptoms: {patient.symptoms}
                </p>
                <p className="text-center text-gray-600">
                  Triage: {patient.triage}
                </p>
                <Button
                  variant="destructive"
                  className="mt-4"
                  onClick={removePatient}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Discharge Patient
                </Button>
              </>
            ) : (
              <p className="text-center text-green-600">No Patient Assigned</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RoomFlipCard({ room, patients }: { room: Room; patients: Patient[] }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const removeUser = () => {
    fetch(`http://localhost:5100/pop_from_room/${room.name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  };

  return (
    <div
      className="relative w-full h-full [perspective:1000px] group cursor-pointer"
      onClick={toggleFlip} // Flip on click
    >
      <div
        className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front of the card */}
        <Card
          className={`absolute w-full h-full [backface-visibility:hidden] transition-colors duration-300 ${room.patientQueue.length > 0 ? "bg-red-100" : "bg-green-100"}`}
        >
          <CardContent className="flex flex-col items-center justify-center h-full">
            {React.cloneElement(roomIcons[room.name] as React.ReactElement, {
              className: `h-16 w-16 mb-2 ${room.patientQueue.length > 0 ? "text-red-500" : "text-green-500"}`,
            })}
            <h2 className="text-2xl font-bold">{room.name}</h2>
            <p className="text-sm mt-2">
              {room.patientQueue.length > 0 ? "Occupied" : "Available"}
            </p>
          </CardContent>
        </Card>

        {/* Back of the card */}
        <Card
          className={`absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white/80 backdrop-blur-sm border-2 border-gray-300 shadow-xl`}
        >
          <CardContent className="flex flex-col items-center justify-center h-full">
            <p className="text-center text-gray-600">
              Patient Queue:{" "}
              {room.patientQueue && room.patientQueue.length > 0
                ? room.patientQueue
                    .map((id) => id2patient(id, patients).name)
                    .join(", ")
                : "N/A"}
            </p>
            <p className="text-center text-gray-600">
              Status: {room.patientQueue.length > 0 ? "Occupied" : "Available"}
            </p>
            <Button variant="destructive" className="mt-4" onClick={removeUser}>
              <UserX className="mr-2 h-4 w-4" />
              Remove User
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type Patient = {
  name: string;
  summary: string;
  time: string;
  bed: number;
  id: string;
  symptoms: string;
  triage: number;
  meds: string[];
  procedures: string[];
  rooms: string[];
  age: string;
  gender: string;
};

type Room = {
  name: string;
  patientQueue: string[];
};

function parseISOString(s) {
  const b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

type ERLiveResponseProps = {
  patients: Patient[];
  beds: string[];
  rooms: Room[];
};

function hasPatientArrived(patient: Patient, beds: string[]): boolean {
  // return !!patient.time && parseISOString(patient.time) <= new Date();
  for (const bed of beds) {
    if (bed === patient.id) {
      return true;
    }
  }
  return false;
}

function id2patient(id: string, patients: Patient[]): Patient {
  for (const patient of patients) {
    if (patient.id === id) {
      return patient;
    }
  }
}

export default function ERLiveResponse({
  patients,
  beds,
  rooms,
}: ERLiveResponseProps) {
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);

  const togglePatientDetails = (patientName: string) => {
    setExpandedPatient(expandedPatient === patientName ? null : patientName);
  };

  const confirmPatientArrival = (patientID: string) => {
    for (let i = 0; i < beds.length; i++) {
      if (beds[i].length === 0) {
        beds[i] = patientID;
        fetch("http://localhost:5100/set_beds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(beds),
        });
        break;
      }
    }
    for (const room of id2patient(patientID, patients).rooms) {
      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].name === room) {
          fetch(`http://localhost:5100/add_to_room/${room}/${patientID}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          break;
        }
      }
    }
    fetch("http://localhost:5100/edit_patient/" + patientID, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: new Date().toISOString() }),
    });
  };

  return (
    <div className="flex w-screen bg-gray-100 text-gray-900">
      {/* Left side - ER Layout */}
      <div className="w-1/2 p-6 border-r border-gray-300">
        <div className="flex h-[calc(100%-4rem)] space-x-6">
          {/* Beds */}
          <div className="w-3/5">
            <div className="grid grid-cols-2 gap-4 h-full">
              {beds.map((bed, bedIdx) => (
                <FlippingCard
                  key={bedIdx}
                  bedNumber={bedIdx + 1}
                  patient={id2patient(bed, patients)}
                />
              ))}
            </div>
          </div>

          {/* Rooms */}
          <div className="w-2/5 p-1 max-h-screen overflow=auto">
            <div className="grid grid-cols-1 gap-4 h-full">
              {" "}
              {/* Set grid-cols to 2 for two columns */}
              {rooms.map((room) => (
                <RoomFlipCard key={room.name} room={room} patients={patients} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Incoming Patients */}
      <div className="w-1/2 p-4">
        <h2 className="text-4xl font-bold mb-6">Incoming Patients</h2>
        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          {patients.map((patient) => (
            <Card key={patient.id} className="mb-4 bg-white">
              <CardHeader
                className="p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => togglePatientDetails(patient.name)}
              >
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold">
                    {patient.name}
                  </CardTitle>
                  <div className="flex items-center">
                    <Badge>
                      {parseISOString(patient.time) - new Date() > 0
                        ? `ETA: ${Math.round((parseISOString(patient.time) - new Date()) / 60000)} min`
                        : "Arrived"}
                    </Badge>
                    {expandedPatient === patient.name ? (
                      <ChevronUp className="ml-2 h-5 w-5" />
                    ) : (
                      <ChevronDown className="ml-2 h-5 w-5" />
                    )}
                  </div>
                </div>
              </CardHeader>
              {expandedPatient === patient.name && (
                <CardContent className="bg-gray-50 p-4">
                  <div className="space-y-2">
                    {"summary" in patient && patient.summary.length !== 0 ? (
                      <div className="flex items-center">
                        <Captions className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-sm">
                          Call Summary: {patient.summary}
                        </span>
                      </div>
                    ) : null}
                    {"age" in patient && patient.age.length !== 0 ? (
                      <div className="flex items-center">
                        <Captions className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-sm">Age: {patient.age}</span>
                      </div>
                    ) : null}
                    {"gender" in patient && patient.gender.length !== 0 ? (
                      <div className="flex items-center">
                        <Captions className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-sm">
                          Gender: {patient.gender}
                        </span>
                      </div>
                    ) : null}
                    {"symptoms" in patient && patient.symptoms.length !== 0 ? (
                      <div className="flex items-center">
                        <Captions className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-sm">
                          Gender: {patient.symptoms}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-center">
                      <ListPlus className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Triage: {patient.triage}</span>
                    </div>
                    <div className="flex items-center">
                      <PillBottle className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">
                        Meds: {patient.meds.join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">
                        Procedures: {patient.procedures.join(", ")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              )}
              <CardFooter className="bg-gray-50 p-4">
                <Button
                  onClick={() => confirmPatientArrival(patient.id)}
                  disabled={hasPatientArrived(patient, beds)}
                  className={`w-full ${hasPatientArrived(patient, beds) ? "bg-green-500 hover:bg-green-500" : "bg-blue-500 hover:bg-grey-600"}`}
                >
                  {hasPatientArrived(patient, beds) ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Arrived
                    </>
                  ) : (
                    "Confirm Arrival"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}
