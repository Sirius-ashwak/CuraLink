// Static Site Generation Configuration
module.exports = {
  // Output directory for the static site
  outputDir: 'static-site',
  
  // Routes to be pre-rendered
  routes: [
    '/',
    '/login',
    '/register',
    '/dashboard',
    '/profile',
    '/settings',
    '/notifications',
  ],
  
  // Assets to copy to the static site
  assets: [
    { source: 'client/public', target: '/' },
    { source: 'dist/public', target: '/' }
  ],
  
  // API endpoints to be transformed into static data files
  apis: [
    { endpoint: '/api/doctors', output: 'doctors.json' },
    { endpoint: '/api/maps/nearby-hospitals', output: 'hospitals-sf.json', params: { lat: '37.7749', lng: '-122.4194' } }
  ]
};