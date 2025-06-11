import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, User } from "lucide-react";
import { Link } from "wouter";

export default function Appointments() {
  const appointments = [
    {
      id: 1,
      doctor: "Dr. Sarah Johnson",
      specialty: "General Medicine",
      date: "2024-01-25",
      time: "10:00 AM",
      status: "upcoming",
      type: "video"
    },
    {
      id: 2,
      doctor: "Dr. Michael Chen",
      specialty: "Cardiology",
      date: "2024-01-23",
      time: "2:30 PM",
      status: "completed",
      type: "video"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Appointments</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your healthcare appointments</p>
        </div>

        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{appointment.doctor}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{appointment.specialty}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{appointment.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{appointment.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={appointment.status === "upcoming" ? "default" : "secondary"}>
                      {appointment.status}
                    </Badge>
                    {appointment.status === "upcoming" && (
                      <Link href={`/video-call/${appointment.id}`}>
                        <Button>
                          <Video className="h-4 w-4 mr-2" />
                          Join Call
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}