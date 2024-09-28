"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Bed, Brain, Bone, Activity, User, Clock, Stethoscope, ChevronDown, ChevronUp, CheckCircle, Hospital, UserX, Check, ListPlus, Captions, PillBottle } from "lucide-react"
import React from "react"

// Custom FlippingCard Component
function FlippingCard({
    bedNumber,
    patient,
  }: {
    bedNumber: number
    patient: Patient
  }) {
    const [isFlipped, setIsFlipped] = useState(false)
  
    const toggleFlip = () => {
      setIsFlipped(!isFlipped)
    }

    const removePatient = () => {
      fetch("http://localhost:5100/delete_patient/" + patient.id, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    }
  
    // Helper function to determine the bed color based on triage
    const getBedColor = (triage: number) => {
        return ["text-red-500", "text-orange-300", "text-yellow-300", "text-green-300", "text-green-500"][triage-1];
    }
  
    return (
      <div
        className="relative w-full h-full [perspective:1000px] group cursor-pointer"
        onClick={toggleFlip}
      >
        <div
          className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* Front of the card */}
          <Card
            className={`absolute w-full h-full [backface-visibility:hidden] transition-colors duration-300 bg-white backdrop-blur-sm border-2 border-gray-300 shadow-xl`}
          >
            <CardContent className="flex flex-col items-center justify-center h-full">
              <div className="relative w-24 h-24 mb-4">
                <Bed className={`w-full h-full ${patient ? getBedColor(patient.triage) : 'text-gray-500'}`} />
              </div>
              <h2 className={`text-2xl font-bold ${patient ? 'text-black' : 'text-gray-500'}`}>
                Bed {bedNumber}
              </h2>
              <p className="text-sm mt-2 text-center">
                {patient ? patient.name : 'Available'}
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
                  <User className={`w-24 h-24 mb-4 ${getBedColor(patient.triage)}`} />
                  <h2 className="text-2xl font-bold mb-4 text-black-700">{patient.name}</h2>
                  <p className="text-center text-gray-600">Symptoms: {patient.symptoms.join(', ')}</p>
                  <p className="text-center text-gray-600">Triage: {patient.triage}</p>
                  <Button variant="destructive" className="mt-4" onClick={removePatient}>
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
    )
  }

  

type Patient = {
  name: string
  callSummary: string
  time: string
  bed: number
  id: string
  symptoms: string[]
  triage: number
  meds: string[]
  procedures: string[]
  rooms: string[]
  waitTime: number
}

type Scan = {
  name: string
  icon: React.ReactNode
  isOccupied: boolean
}

type Room = {
  name: string
  patientQueue: string[]
}

function parseISOString(s) {
    const b = s.split(/\D+/);
    return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

type ERLiveResponseProps = {
  patients: Patient[],
  beds: string[],
  rooms: Scan[]
}

function hasPatientArrived(patient:Patient): boolean {
    return !!patient.time && parseISOString(patient.time) <= new Date()
}

function id2patient(id: string, patients: Patient[]): Patient {
  for (const patient of patients) {
    if (patient.id === id) {
      return patient
    }
  }
}

export default function ERLiveResponse({ patients, beds, rooms }: ERLiveResponseProps) {
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)
  const [scans, setScans] = useState<Scan[]>([
    { name: "CT Scan", icon: <Brain className="h-16 w-16 mb-2" />, isOccupied: false },
    { name: "MRI", icon: <Bone className="h-16 w-16 mb-2" />, isOccupied: true },
    { name: "Blood Test", icon: <Activity className="h-16 w-16 mb-2" />, isOccupied: false },
    { name: "X-Ray", icon: <Bone className="h-16 w-16 mb-2" />, isOccupied: true },
    { name: "Operating Room", icon: <Hospital className="h-16 w-16 mb-2" />, isOccupied: true },
  ])
  
  const togglePatientDetails = (patientName: string) => {
    setExpandedPatient(expandedPatient === patientName ? null : patientName)
  }

  const toggleScanOccupancy = (index: number) => {
    setScans(prevScans =>
      prevScans.map((scan, i) =>
        i === index ? { ...scan, isOccupied: !scan.isOccupied } : scan
      )
    )
  }

  const confirmPatientArrival = (patientID: string) => {
    for (let i = 0; i < beds.length; i++) {
      if (beds[i].length === 0) {
        beds[i] = patientID;
        console.log("setting beds", JSON.stringify(beds));
        fetch("http://localhost:5100/set_beds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(beds)
        });
        break;
      }
    }
    fetch("http://localhost:5100/edit_patient/" + patientID, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: new Date().toISOString() })
    })
  }

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
                  bedNumber={bedIdx+1}
                  patient={id2patient(bed, patients)}
                />
              ))}
            </div>
          </div>

          {/* Scanning Rooms */}
          <div className="w-2/5 pl-2">
            <div className="grid grid-rows-2 gap-4 h-full">
              {scans.map((scan, index) => (
                <Card
                  key={scan.name}
                  className={`flex items-center justify-center cursor-pointer transition-colors duration-300 ${scan.isOccupied ? 'bg-red-100' : 'bg-green-100'}`}
                  onClick={() => toggleScanOccupancy(index)}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    {React.cloneElement(scan.icon as React.ReactElement, {
                      className: `h-16 w-16 mb-2 ${scan.isOccupied ? 'text-red-500' : 'text-green-500'}`,
                    })}
                    <span className="text-2xl font-medium">{scan.name}</span>
                    <span className="text-sm mt-2">{scan.isOccupied ? 'Occupied' : 'Available'}</span>
                  </CardContent>
                </Card>
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
              <CardHeader className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => togglePatientDetails(patient.name)}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold">{patient.name}</CardTitle>
                  <div className="flex items-center">
                    <Badge variant={patient.waitTime <= 10 ? "destructive" : patient.waitTime <= 20 ? "secondary" : "default"}>
                      {patient.waitTime} min
                    </Badge>
                    {expandedPatient === patient.name ? (
                      <ChevronUp className="ml-2 h-5 w-5" />
                    ) : (
                      <ChevronDown className="ml-2 h-5 w-5" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{patient.name}</p>
              </CardHeader>
              {expandedPatient === patient.name && (
                <CardContent className="bg-gray-50 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Captions className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Call Summary: {patient.callSummary}</span>
                    </div>
                    <div className="flex items-center">
                      <Stethoscope className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Symptoms: {patient.symptoms.join(', ')}</span>
                    </div>
                    <div className="flex items-center">
                      <ListPlus className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Triage: {patient.triage}</span>
                    </div>
                    <div className="flex items-center">
                      <PillBottle className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Meds: {patient.meds.join(', ')}</span>
                    </div>
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Procedures: {patient.procedures.join(', ')}</span>
                    </div>
                  </div>
                </CardContent>
              )}
              <CardFooter className="bg-gray-50 p-4">
                <Button
                  onClick={() => confirmPatientArrival(patient.id)}
                  disabled={hasPatientArrived(patient)}
                  className={`w-full ${hasPatientArrived(patient) ? 'bg-green-500 hover:bg-green-500' : 'bg-blue-500 hover:bg-grey-600'}`}
                >
                  {hasPatientArrived(patient) ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Arrived
                    </>
                  ) : (
                    'Confirm Arrival'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </ScrollArea>
      </div>
    </div>
  )
}
