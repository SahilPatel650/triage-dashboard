"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bed, Brain, Bone, Activity, User, Clock, Stethoscope, ChevronDown, ChevronUp } from "lucide-react"
import React from "react"

type Patient = {
  name: string
  condition: string
  waitTime: number
  age: number
  bloodType: string
  allergies: string[]
}

type Scan = {
  name: string
  icon: React.ReactNode
  isOccupied: boolean
}

const patients: Patient[] = [
  { name: "John Doe", condition: "Chest Pain", waitTime: 10, age: 45, bloodType: "A+", allergies: ["Penicillin"] },
  { name: "Jane Smith", condition: "Broken Arm", waitTime: 25, age: 32, bloodType: "O-", allergies: [] },
  { name: "Mike Johnson", condition: "Severe Headache", waitTime: 15, age: 28, bloodType: "B+", allergies: ["Latex"] },
  { name: "Emily Brown", condition: "Allergic Reaction", waitTime: 5, age: 19, bloodType: "AB+", allergies: ["Peanuts", "Shellfish"] },
  { name: "David Wilson", condition: "Deep Cut", waitTime: 20, age: 52, bloodType: "A-", allergies: [] },
  { name: "Sarah Davis", condition: "High Fever", waitTime: 30, age: 37, bloodType: "O+", allergies: ["Sulfa"] },
  { name: "Tom Taylor", condition: "Sprained Ankle", waitTime: 40, age: 24, bloodType: "B-", allergies: [] },
  { name: "Mrinal Patel", condition: "Broken Dick", waitTime: 40, age: 24, bloodType: "B-", allergies: [] },
]

export default function ERLiveResponse() {
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)
  const [scans, setScans] = useState<Scan[]>([
    { name: "CT Scan", icon: <Brain className="h-16 w-16 mb-2" />, isOccupied: false },
    { name: "MRI", icon: <Bone className="h-16 w-16 mb-2" />, isOccupied: true },
    { name: "CAT Scan", icon: <Activity className="h-16 w-16 mb-2" />, isOccupied: false },
    { name: "X-Ray", icon: <Bone className="h-16 w-16 mb-2" />, isOccupied: true },
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

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900">
      {/* Left side - ER Layout */}
      <div className="w-1/2 p-6 border-r border-gray-300">
        <h2 className="text-2xl font-bold mb-6">ER Layout</h2>
        <div className="flex h-[calc(100%-4rem)] space-x-6">
          {/* Beds */}
          <div className="w-3/5">
            <h3 className="text-xl font-semibold mb-4">Beds</h3>
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
            <h3 className="text-xl font-semibold mb-4">Scans</h3>
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
        <h2 className="text-2xl font-bold mb-6">Incoming Patients</h2>
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
            </Card>
          ))}
        </ScrollArea>
      </div>
    </div>
  )
}