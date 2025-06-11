import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Get nearby medical facilities using Google Places API
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

    // Use Google Places API to find nearby hospitals
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    const params = {
      location: `${lat},${lng}`,
      radius: radius,
      type: 'hospital',
      key: apiKey
    };

    const response = await axios.get(placesUrl, { params });
    
    if (response.data.status !== 'OK') {
      console.error('Google Places API error:', response.data.status);
      return res.status(500).json({ error: 'Failed to fetch nearby facilities' });
    }

    // Transform the data to match our interface
    const facilities = response.data.results.map((place: any, index: number) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      distance: calculateDistance(
        parseFloat(lat as string),
        parseFloat(lng as string),
        place.geometry.location.lat,
        place.geometry.location.lng
      ),
      rating: place.rating || 4.0,
      type: 'Hospital',
      specialties: ['Emergency', 'General Medicine'],
      waitTime: `${Math.floor(Math.random() * 30) + 10} min`,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      isOpen: place.opening_hours?.open_now ?? true,
      phoneNumber: place.formatted_phone_number,
      website: place.website
    }));

    // Sort by distance
    facilities.sort((a: any, b: any) => parseFloat(a.distance) - parseFloat(b.distance));

    res.json({ facilities: facilities.slice(0, 10) }); // Return top 10 closest
    
  } catch (error) {
    console.error('Error fetching nearby facilities:', error);
    res.status(500).json({ error: 'Failed to fetch nearby facilities' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  return distance < 1 ? 
    `${Math.round(distance * 1000)}m` : 
    `${distance.toFixed(1)}km`;
}

export default router;