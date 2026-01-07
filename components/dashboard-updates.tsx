"use client"

import { useState } from "react"
import { UpdateNotification } from "@/components/update-notification"
import { FeatureTour } from "@/components/feature-tour"

export function DashboardUpdates() {
  const [tourActive, setTourActive] = useState(false)

  const handleStartTour = () => {
    setTourActive(true)
  }

  const handleCompleteTour = () => {
    setTourActive(false)
  }

  return (
    <>
      <UpdateNotification onStartTour={handleStartTour} />
      <FeatureTour active={tourActive} onComplete={handleCompleteTour} />
    </>
  )
}

