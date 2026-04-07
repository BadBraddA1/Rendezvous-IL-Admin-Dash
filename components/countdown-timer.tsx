"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon, ClockIcon } from "lucide-react"

interface CountdownTimerProps {
  targetDate: Date
  label: string
  icon?: "calendar" | "clock"
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

export function CountdownTimer({ targetDate, label, icon = "calendar" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = targetDate.getTime()
      const difference = target - now

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isExpired: false,
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  const Icon = icon === "calendar" ? CalendarIcon : ClockIcon

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
            {timeLeft.isExpired ? (
              <p className="text-2xl font-bold text-primary">Event Started!</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{timeLeft.days}</div>
                  <div className="text-xs text-muted-foreground">Days</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{timeLeft.hours}</div>
                  <div className="text-xs text-muted-foreground">Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{timeLeft.minutes}</div>
                  <div className="text-xs text-muted-foreground">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{timeLeft.seconds}</div>
                  <div className="text-xs text-muted-foreground">Seconds</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
