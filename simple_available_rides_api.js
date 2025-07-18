// SIMPLE AVAILABLE RIDES API - Add this to your backend

// GET /api/rides/available
// Returns available rides for drivers
exports.getAvailableRides = (req, res) => {
  // Simple query using your actual table structure
  const query = `
    SELECT 
      r.id,
      r.pickup_location,
      r.destination,
      r.estimated_fare,
      r.status,
      r.created_at,
      r.distance,
      r.pickup_lat,
      r.pickup_lng,
      r.destination_lat,
      r.destination_lng,
      u.username as rider_name
    FROM rides r
    JOIN users u ON r.rider_id = u.id
    WHERE r.status = 'pending' 
      AND r.driver_id IS NULL
    ORDER BY r.created_at DESC
    LIMIT 20
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching available rides:', err);
      return res.status(500).json({ message: 'Failed to fetch available rides' });
    }

    // Format the response for your frontend
    const availableRides = results.map(ride => ({
      id: ride.id,
      pickup_location: ride.pickup_location,
      destination: ride.destination,
      fare_estimate: parseFloat(ride.estimated_fare) || 0,
      ride_type: 'standard', // default since not in your table
      created_at: ride.created_at,
      rider_name: ride.rider_name,
      // Add pickup/destination coordinates if needed
      pickup_lat: ride.pickup_lat,
      pickup_lng: ride.pickup_lng,
      destination_lat: ride.destination_lat,
      destination_lng: ride.destination_lng
    }));

    res.json({
      availableRides: availableRides
    });
  });
};

// POST /api/rides/accept
// Accept a ride
exports.acceptRide = (req, res) => {
  const driverId = req.user.id; // from your auth middleware
  const { rideId } = req.body;

  if (!rideId) {
    return res.status(400).json({ message: 'Ride ID required' });
  }

  // Check if ride is still available
  const checkQuery = 'SELECT * FROM rides WHERE id = ? AND status = "pending" AND driver_id IS NULL';
  
  db.query(checkQuery, [rideId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Ride not available' });
    }

    // Accept the ride
    const acceptQuery = `
      UPDATE rides 
      SET driver_id = ?, status = 'accepted', accepted_at = NOW() 
      WHERE id = ?
    `;

    db.query(acceptQuery, [driverId, rideId], (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Error accepting ride:', updateErr);
        return res.status(500).json({ message: 'Failed to accept ride' });
      }

      res.json({
        success: true,
        message: 'Ride accepted successfully',
        rideId: rideId
      });
    });
  });
};

// Add these routes to your Express app:
/*
app.get('/api/rides/available', authenticateDriver, getAvailableRides);
app.post('/api/rides/accept', authenticateDriver, acceptRide);
*/
