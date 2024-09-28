"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Bed, Brain, Bone, Activity, User, Clock, Stethoscope, ChevronDown, ChevronUp, CheckCircle, Hospital, UserX } from "lucide-react"
import React from "react"

// Custom FlippingCard Component
function FlippingCard({
    bedNumber,
    patient,
    onRemovePatient,
  }: {
    bedNumber: number
    patient?: any
    onRemovePatient: () => void
  }) {
    const [isFlipped, setIsFlipped] = useState(false)
  
    const toggleFlip = () => {
      setIsFlipped(!isFlipped)
    }
  
    const handleRemovePatient = (e: React.MouseEvent) => {
      e.stopPropagation() // Prevent card from flipping when button is clicked
      onRemovePatient()
    }
  
    // Helper function to determine the bed color based on triage
    const getBedColor = (triage: string) => {
      switch (triage) {
        case '1':
          return 'text-red-500' // Red for triage 1
        case '2':
          return 'text-orange-300' // Orange for triage 2
        case '3':
          return 'text-yellow-500' // Yellow for triage 3
        case '4':
          return 'text-green-500' // Green for triage 4
        default:
          return 'text-gray-500' // Default color if no patient or unknown triage
      }
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
                {patient ? 'Occupied' : 'Available'}
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
                  <p className="text-center text-gray-600">Condition: {patient.symptoms}</p>
                  <p className="text-center text-gray-600">Triage: {patient.triage}</p>
                  <Button variant="destructive" className="mt-4" onClick={handleRemovePatient}>
                    <UserX className="mr-2 h-4 w-4" />
                    Remove Patient
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
  id: string
  symptoms: string
  triage: string
  meds: string
  procedures: string[]
  rooms: string[]
  waitTime: number
}

type Scan = {
  name: string
  icon: React.ReactNode
  isOccupied: boolean
}

function parseISOString(s) {
    const b = s.split(/\D+/);
    return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
  }

type ERLiveResponseProps = {
  patients: Patient[],
}

function hasPatientArrived(patient:Patient): boolean {
    return !!patient.time && parseISOString(patient.time) <= new Date()
}

export default function ERLiveResponse({ patients }: ERLiveResponseProps) {
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
    // setPatients(prevPatients =>
    //   prevPatients.map(patient =>
    //     patient.name === patientName ? { ...patient, hasArrived: true } : patient
    //   )
    // )
    fetch("http://localhost:5100/edit_patient/" + patientID.toString(), {
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
              {[1, 2, 3, 4, 5, 6].map((bed) => (
                <FlippingCard
                  key={bed}
                  bedNumber={bed}
                  patient={patients[bed - 1]}  // Map patient info to the bed number
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
                      <User className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Call Summary: {patient.callSummary}</span>
                    </div>
                    <div className="flex items-center">
                      <Stethoscope className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Symptoms: {patient.symptoms}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Triage: {patient.triage} minutes</span>
                    </div>
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Meds: {patient.meds}</span>
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
