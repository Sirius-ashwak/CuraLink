import React from 'react';
import SimpleMap from '../components/maps/SimpleMap';

const MapTest: React.FC = () => {
  const markers = [
    { lat: 37.7749, lng: -122.4194 }, // San Francisco
    { lat: 37.7833, lng: -122.4167 }, // Nearby location
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Map Test Page</h1>
      <p className="mb-4">This page tests the Google Maps integration.</p>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Simple Map</h2>
        <SimpleMap markers={markers} />
      </div>
    </div>
  );
};

export default MapTest;