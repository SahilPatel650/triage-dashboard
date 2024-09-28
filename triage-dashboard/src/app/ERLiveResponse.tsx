"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Bed, Brain, Bone, Activity, User, Clock, Stethoscope, ChevronDown, ChevronUp, CheckCircle, Hospital } from "lucide-react"
import React from "react"

type Patient = {
  name: string
  callSummary: string
  Timestamp: string
  id: String
  symptoms: string
  triage: string
  meds: string
  procedures: string[]
  rooms: string[]

}

type Room = {
    roomName: string
    patientQueue: Patient[]
}

type Scan = {
  name: string
  icon: React.ReactNode
  isOccupied: boolean
}

type ERLiveResponseProps = {
  patients: Patient[],
}

function parseISOString(s) {
  const b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

function hasPatientArrived(patient) {
  return patient.time && parseISOString(patient.time) > new Date()
}

export default function ERLiveResponse({ patients }: ERLiveResponseProps) {
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)
  const [scans, setScans] = useState<Scan[]>([
    { name: "CT Scan", icon: <Brain className="h-16 w-16 mb-2" />, isOccupied: false },
    { name: "MRI", icon: <Bone className="h-16 w-16 mb-2" />, isOccupied: true },
    { name: "CAT Scan", icon: <Activity className="h-16 w-16 mb-2" />, isOccupied: false },
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

  const confirmPatientArrival = (patientID: number) => {
    // setPatients(prevPatients =>
    //   prevPatients.map(patient =>
    //     patient.name === patientName ? { ...patient, hasArrived: true } : patient
    //   )
    // )
    console.log()
    fetch("http://localhost:5100/edit_patient/" + patientID.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: new Date().toISOString() })
    })
  }

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900">
      {/* Left side - ER Layout */}
      <div className="w-1/2 p-6 border-r border-gray-300">
        <div className="flex h-[calc(100%-4rem)] space-x-6">
          {/* Beds */}
          <div className="w-3/5">
            <div className="grid grid-cols-2 gap-4 h-full">
              {[1, 2, 3, 4, 5, 6].map((bed) => (
                <Card key={bed} className="bg-white flex items-center justify-center">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <Bed className="h-16 w-16 text-blue-500 mb-2" />
                    <span className="text-2xl font-medium">Bed {bed}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          {/* Scanning Rooms */}
          <div className="w-2/5">
            <div className="grid grid-rows-2 gap-4 h-full">
              {scans.map((scan, index) => (
                <Card 
                  key={scan.name} 
                  className={`flex items-center justify-center cursor-pointer transition-colors duration-300 ${
                    scan.isOccupied ? 'bg-red-100' : 'bg-green-100'
                  }`}
                  onClick={() => toggleScanOccupancy(index)}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    {React.cloneElement(scan.icon as React.ReactElement, {
                      className: `h-16 w-16 mb-2 ${scan.isOccupied ? 'text-red-500' : 'text-green-500'}`
                    })}
                    <span className="text-2xl font-medium">{scan.name}</span>
                    <span className="text-sm mt-2">
                      {scan.isOccupied ? 'Occupied' : 'Available'}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Incoming Patients */}
      <div className="w-1/2 p-6">
        <h2 className="text-4xl font-bold mb-6">Incoming Patients</h2>
        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          {patients.map((patient) => (
            <Card key={patient.name} className="mb-4 bg-white">
              <CardHeader 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => togglePatientDetails(patient.name)}
              >
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
                <p className="text-sm text-gray-600 mt-1">{patient.condition}</p>
              </CardHeader>
              {expandedPatient === patient.name && (
                <CardContent className="bg-gray-50 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Age: {patient.age}</span>
                    </div>
                    <div className="flex items-center">
                      <Stethoscope className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Condition: {patient.condition}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Wait Time: {patient.waitTime} minutes</span>
                    </div>
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">Blood Type: {patient.bloodType}</span>
                    </div>
                    <div className="flex items-start">
                      <Bone className="h-5 w-5 text-gray-500 mr-2 mt-1" />
                      <span className="text-sm">
                        Allergies: {patient.allergies.length > 0 ? patient.allergies.join(", ") : "None"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              )}
              <CardFooter className="bg-gray-50 p-4">
                <Button
                  onClick={() => confirmPatientArrival(patient.ID)}
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
