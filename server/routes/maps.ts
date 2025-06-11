import { Router, Request, Response } from "express";
import axios from "axios";

const router = Router();

/**
 * GET /api/maps/nearby-hospitals
 * Find nearby hospitals based on user location
 */
router.get("/nearby-hospitals", async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: "Missing latitude or longitude" });
    }
    
    // Call the Google Places API to find nearby hospitals
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&type=hospital&key=${process.env.GOOGLE_CLOUD_API_KEY}`
    );
    
    if (response.data.status !== "OK") {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }
    
    // Format the hospital data
    const hospitals = response.data.results.map((place: any) => ({
      name: place.name,
      address: place.vicinity,
      distance: calculateDistance(
        parseFloat(lat as string), 
        parseFloat(lng as string), 
        place.geometry.location.lat, 
        place.geometry.location.lng
      )
    }));
    
    // Sort hospitals by distance
    hospitals.sort((a: any, b: any) => parseFloat(a.distance) - parseFloat(b.distance));
    
    // Return the closest 5 hospitals
    res.json({
      hospitals: hospitals.slice(0, 5)
    });
  } catch (error) {
    console.error("Error finding nearby hospitals:", error);
    res.status(500).json({ 
      message: "Failed to find nearby hospitals",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * Returns the distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  if (distance < 1) {
    // For distances less than 1 km, convert to meters
    return `${Math.round(distance * 1000)}m`;
  }
  
  return `${distance.toFixed(1)}km`;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

export default router;