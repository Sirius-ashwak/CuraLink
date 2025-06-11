import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Video, Calendar, MapPin } from "lucide-react";
import { Link } from "wouter";

export default function Doctors() {
  const doctors = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialty: "General Medicine",
      rating: 4.9,
      reviews: 128,
      available: true,
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=faces"
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      specialty: "Cardiology",
      rating: 4.8,
      reviews: 95,
      available: true,
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=faces"
    },
    {
      id: 3,
      name: "Dr. Emily Rodriguez",
      specialty: "Pediatrics",
      rating: 4.9,
      reviews: 167,
      available: false,
      image: "https://images.unsplash.com/photo-1594824388531-6ac6a8e3e4b5?w=400&h=400&fit=crop&crop=faces"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Find a Doctor</h1>
          <p className="text-gray-600 dark:text-gray-300">Connect with qualified healthcare professionals</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <CardTitle className="text-xl">{doctor.name}</CardTitle>
                <Badge variant="secondary">{doctor.specialty}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{doctor.rating}</span>
                  <span className="text-gray-500">({doctor.reviews} reviews)</span>
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${doctor.available ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">
                    {doctor.available ? 'Available Now' : 'Busy'}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <Link href={`/video-call/${doctor.id}`}>
                    <Button className="flex-1" disabled={!doctor.available}>
                      <Video className="h-4 w-4 mr-2" />
                      Video Call
                    </Button>
                  </Link>
                  <Button variant="outline" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/dashboard">
            <Button variant="outline">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}