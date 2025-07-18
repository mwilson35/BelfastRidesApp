// DRIVER BACKEND INTEGRATION - Copy this to your backend
// This file contains all the backend components needed for the driver system

// ===== DATABASE SCHEMA UPDATES =====

/*
-- Add these tables to your database:

-- Driver status tracking
CREATE TABLE driver_status (
    id SERIAL PRIMARY KEY,
    driver_id INT REFERENCES drivers(id) UNIQUE,
    status VARCHAR(20) DEFAULT 'offline', -- 'offline', 'online', 'busy'
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    heading DECIMAL(5, 2),
    speed DECIMAL(5, 2),
    last_location_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Driver active rides
CREATE TABLE driver_active_rides (
    id SERIAL PRIMARY KEY,
    driver_id INT REFERENCES drivers(id),
    ride_id INT REFERENCES rides(id),
    status VARCHAR(20) DEFAULT 'assigned', -- 'assigned', 'en_route_pickup', 'arrived_pickup', 'in_progress', 'completed'
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(driver_id) -- Only one active ride per driver
);

-- Index for performance
CREATE INDEX idx_driver_status_location ON driver_status(driver_id, latitude, longitude);
CREATE INDEX idx_driver_active_rides_status ON driver_active_rides(driver_id, status);
*/

// ===== DRIVER CONTROLLER =====

const db = require('../db');
const { io } = require('../server'); // Adjust path to your socket.io instance

// Driver status management
exports.updateDriverStatus = (req, res) => {
  const driverId = req.user.id;
  const { status, latitude, longitude, heading, speed } = req.body;

  if (!['offline', 'online', 'busy'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const query = `
    INSERT INTO driver_status (driver_id, status, latitude, longitude, heading, speed, last_location_update)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE 
      status = VALUES(status),
      latitude = VALUES(latitude),
      longitude = VALUES(longitude),
      heading = VALUES(heading),
      speed = VALUES(speed),
      last_location_update = NOW(),
      updated_at = NOW()
  `;

  db.query(query, [driverId, status, latitude, longitude, heading, speed], (err, result) => {
    if (err) {
      console.error('Error updating driver status:', err);
      return res.status(500).json({ message: 'Failed to update status' });
    }

    // Broadcast status update to admin/monitoring systems
    io.emit('driverStatusUpdate', {
      driverId,
      status,
      location: { latitude, longitude, heading, speed },
      timestamp: new Date()
    });

    res.json({ message: 'Status updated successfully', status });
  });
};

// Get driver's current status
exports.getDriverStatus = (req, res) => {
  const driverId = req.user.id;

  db.query(
    'SELECT * FROM driver_status WHERE driver_id = ?',
    [driverId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      const status = results.length > 0 ? results[0] : {
        driver_id: driverId,
        status: 'offline',
        latitude: null,
        longitude: null,
        heading: null,
        speed: null
      };

      res.json(status);
    }
  );
};

// Update driver location (real-time GPS tracking)
exports.updateDriverLocation = (req, res) => {
  const driverId = req.user.id;
  const { latitude, longitude, heading, speed } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude required' });
  }

  const query = `
    UPDATE driver_status 
    SET latitude = ?, longitude = ?, heading = ?, speed = ?, last_location_update = NOW()
    WHERE driver_id = ?
  `;

  db.query(query, [latitude, longitude, heading, speed, driverId], (err, result) => {
    if (err) {
      console.error('Error updating driver location:', err);
      return res.status(500).json({ message: 'Failed to update location' });
    }

    // Broadcast location to riders tracking this driver
    broadcastDriverLocation(driverId, { latitude, longitude, heading, speed });

    res.json({ message: 'Location updated successfully' });
  });
};

// Get driver's active ride
exports.getActiveRide = (req, res) => {
  const driverId = req.user.id;

  const query = `
    SELECT 
      r.*,
      dar.status as ride_status,
      dar.assigned_at,
      u.name as rider_name,
      u.phone as rider_phone
    FROM driver_active_rides dar
    JOIN rides r ON dar.ride_id = r.id
    JOIN users u ON r.rider_id = u.id
    WHERE dar.driver_id = ? AND dar.status NOT IN ('completed', 'cancelled')
  `;

  db.query(query, [driverId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.json({ activeRide: null });
    }

    const ride = results[0];
    const activeRide = {
      id: ride.id,
      pickup: {
        latitude: parseFloat(ride.pickup_latitude) || 54.607868,
        longitude: parseFloat(ride.pickup_longitude) || -5.926437,
        title: 'Pickup Location',
        description: ride.pickup_location,
        type: 'pickup'
      },
      destination: {
        latitude: parseFloat(ride.destination_latitude) || 54.584473,
        longitude: parseFloat(ride.destination_longitude) || -5.933669,
        title: 'Destination',
        description: ride.destination,
        type: 'destination'
      },
      status: ride.ride_status,
      encodedPolyline: ride.encoded_polyline,
      rider: {
        name: ride.rider_name,
        phone: ride.rider_phone
      },
      assignedAt: ride.assigned_at
    };

    res.json({ activeRide });
  });
};

// Update ride status (driver actions)
exports.updateRideStatus = (req, res) => {
  const driverId = req.user.id;
  const { rideId, status } = req.body;

  const validStatuses = ['assigned', 'en_route_pickup', 'arrived_pickup', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  // Update ride status in driver_active_rides
  db.query(
    'UPDATE driver_active_rides SET status = ?, updated_at = NOW() WHERE driver_id = ? AND ride_id = ?',
    [status, driverId, rideId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Active ride not found' });
      }

      // Also update main rides table
      db.query(
        'UPDATE rides SET status = ?, updated_at = NOW() WHERE id = ? AND driver_id = ?',
        [status === 'completed' ? 'completed' : 'in_progress', rideId, driverId],
        (rideErr) => {
          if (rideErr) {
            console.error('Error updating main ride status:', rideErr);
          }

          // Notify rider of status change
          notifyRiderOfStatusChange(rideId, status);

          // If completed, clean up active ride
          if (status === 'completed') {
            db.query(
              'DELETE FROM driver_active_rides WHERE driver_id = ? AND ride_id = ?',
              [driverId, rideId],
              (cleanupErr) => {
                if (cleanupErr) {
                  console.error('Error cleaning up completed ride:', cleanupErr);
                }
              }
            );
          }

          res.json({ message: 'Ride status updated successfully', status });
        }
      );
    }
  );
};

// ===== AVAILABLE RIDES SYSTEM =====

// Get available rides for driver (prioritized list)
exports.getAvailableRides = (req, res) => {
  const driverId = req.user.id;

  // First get driver's current location
  db.query(
    'SELECT latitude, longitude FROM driver_status WHERE driver_id = ?',
    [driverId],
    (err, driverResults) => {
      if (err || driverResults.length === 0) {
        return res.status(500).json({ message: 'Driver location not found' });
      }

      const driverLat = parseFloat(driverResults[0].latitude) || 54.607868;
      const driverLng = parseFloat(driverResults[0].longitude) || -5.926437;

      // Get all pending rides with distance calculation and priority scoring
      const query = `
        SELECT 
          r.*,
          u.name as rider_name,
          u.phone as rider_phone,
          u.rating as rider_rating,
          (6371 * acos(
            cos(radians(?)) * cos(radians(r.pickup_latitude)) * 
            cos(radians(r.pickup_longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(r.pickup_latitude))
          )) AS distance_km,
          (
            CASE 
              WHEN r.ride_type = 'premium' THEN 100
              WHEN r.ride_type = 'standard' THEN 50
              ELSE 25
            END +
            CASE 
              WHEN (6371 * acos(
                cos(radians(?)) * cos(radians(r.pickup_latitude)) * 
                cos(radians(r.pickup_longitude) - radians(?)) + 
                sin(radians(?)) * sin(radians(r.pickup_latitude))
              )) < 2 THEN 50
              WHEN (6371 * acos(
                cos(radians(?)) * cos(radians(r.pickup_latitude)) * 
                cos(radians(r.pickup_longitude) - radians(?)) + 
                sin(radians(?)) * sin(radians(r.pickup_latitude))
              )) < 5 THEN 25
              ELSE 0
            END +
            CASE 
              WHEN r.fare_estimate > 20 THEN 30
              WHEN r.fare_estimate > 10 THEN 15
              ELSE 0
            END +
            CASE 
              WHEN u.rating >= 4.5 THEN 20
              WHEN u.rating >= 4.0 THEN 10
              ELSE 0
            END
          ) AS priority_score
        FROM rides r
        JOIN users u ON r.rider_id = u.id
        LEFT JOIN driver_active_rides dar ON r.id = dar.ride_id
        WHERE r.status = 'pending' 
          AND dar.ride_id IS NULL
          AND r.pickup_latitude IS NOT NULL 
          AND r.pickup_longitude IS NOT NULL
          AND (6371 * acos(
            cos(radians(?)) * cos(radians(r.pickup_latitude)) * 
            cos(radians(r.pickup_longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(r.pickup_latitude))
          )) < 15
        ORDER BY priority_score DESC, distance_km ASC
        LIMIT 20
      `;

      const params = [
        driverLat, driverLng, driverLat, // distance calculation
        driverLat, driverLng, driverLat, // priority scoring - close rides
        driverLat, driverLng, driverLat, // priority scoring - medium distance
        driverLat, driverLng, driverLat  // final filter
      ];

      db.query(query, params, (err, results) => {
        if (err) {
          console.error('Error fetching available rides:', err);
          return res.status(500).json({ message: 'Failed to fetch available rides' });
        }

        const availableRides = results.map(ride => {
          const distanceKm = parseFloat(ride.distance_km) || 0;
          const priorityScore = parseInt(ride.priority_score) || 0;
          
          // Determine priority level and color
          let priorityLevel = 'low';
          let priorityColor = '#95a5a6'; // Gray
          
          if (priorityScore >= 150) {
            priorityLevel = 'high';
            priorityColor = '#e74c3c'; // Red - High priority
          } else if (priorityScore >= 100) {
            priorityLevel = 'medium';
            priorityColor = '#f39c12'; // Orange - Medium priority
          } else if (priorityScore >= 75) {
            priorityLevel = 'normal';
            priorityColor = '#3498db'; // Blue - Normal priority
          }

          return {
            id: ride.id,
            pickup: {
              latitude: parseFloat(ride.pickup_latitude),
              longitude: parseFloat(ride.pickup_longitude),
              address: ride.pickup_location,
              title: 'Pickup Location'
            },
            destination: {
              latitude: parseFloat(ride.destination_latitude),
              longitude: parseFloat(ride.destination_longitude),
              address: ride.destination,
              title: 'Destination'
            },
            rider: {
              name: ride.rider_name,
              phone: ride.rider_phone,
              rating: parseFloat(ride.rider_rating) || 0
            },
            fare: {
              estimate: parseFloat(ride.fare_estimate) || 0,
              currency: 'GBP'
            },
            distance: {
              toPickup: distanceKm,
              tripDistance: parseFloat(ride.trip_distance_km) || 0
            },
            rideType: ride.ride_type || 'standard',
            priority: {
              level: priorityLevel,
              score: priorityScore,
              color: priorityColor
            },
            requestedAt: ride.created_at,
            estimatedDuration: ride.estimated_duration || null
          };
        });

        res.json({
          success: true,
          rides: availableRides,
          driverLocation: {
            latitude: driverLat,
            longitude: driverLng
          }
        });
      });
    }
  );
};

// Accept a ride (driver claims a specific ride)
exports.acceptRide = (req, res) => {
  const driverId = req.user.id;
  const { rideId } = req.body;

  if (!rideId) {
    return res.status(400).json({ message: 'Ride ID required' });
  }

  // Check if driver already has an active ride
  db.query(
    'SELECT id FROM driver_active_rides WHERE driver_id = ? AND status NOT IN ("completed", "cancelled")',
    [driverId],
    (err, activeRides) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (activeRides.length > 0) {
        return res.status(400).json({ message: 'Driver already has an active ride' });
      }

      // Check if ride is still available
      db.query(
        'SELECT * FROM rides WHERE id = ? AND status = "pending"',
        [rideId],
        (err, rideResults) => {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }

          if (rideResults.length === 0) {
            return res.status(404).json({ message: 'Ride not available' });
          }

          const ride = rideResults[0];

          // Start transaction to assign ride
          db.beginTransaction((transErr) => {
            if (transErr) {
              return res.status(500).json({ message: 'Transaction error' });
            }

            // Insert into driver_active_rides
            db.query(
              'INSERT INTO driver_active_rides (driver_id, ride_id, status) VALUES (?, ?, "assigned")',
              [driverId, rideId],
              (assignErr) => {
                if (assignErr) {
                  return db.rollback(() => {
                    res.status(500).json({ message: 'Failed to assign ride' });
                  });
                }

                // Update ride status
                db.query(
                  'UPDATE rides SET driver_id = ?, status = "assigned", updated_at = NOW() WHERE id = ?',
                  [driverId, rideId],
                  (updateErr) => {
                    if (updateErr) {
                      return db.rollback(() => {
                        res.status(500).json({ message: 'Failed to update ride' });
                      });
                    }

                    // Update driver status to busy
                    db.query(
                      'UPDATE driver_status SET status = "busy", updated_at = NOW() WHERE driver_id = ?',
                      [driverId],
                      (statusErr) => {
                        if (statusErr) {
                          return db.rollback(() => {
                            res.status(500).json({ message: 'Failed to update driver status' });
                          });
                        }

                        // Commit transaction
                        db.commit((commitErr) => {
                          if (commitErr) {
                            return db.rollback(() => {
                              res.status(500).json({ message: 'Failed to commit transaction' });
                            });
                          }

                          // Notify rider that driver has accepted
                          io.to(`rider_${ride.rider_id}`).emit('rideAccepted', {
                            rideId,
                            driverId,
                            message: 'Driver is on the way!'
                          });

                          // Send ride details back to driver
                          const acceptedRide = {
                            id: ride.id,
                            pickup: {
                              latitude: parseFloat(ride.pickup_latitude),
                              longitude: parseFloat(ride.pickup_longitude),
                              title: 'Pickup Location',
                              description: ride.pickup_location,
                              type: 'pickup'
                            },
                            destination: {
                              latitude: parseFloat(ride.destination_latitude),
                              longitude: parseFloat(ride.destination_longitude),
                              title: 'Destination',
                              description: ride.destination,
                              type: 'destination'
                            },
                            status: 'assigned',
                            encodedPolyline: ride.encoded_polyline,
                            rider: {
                              name: ride.rider_name || 'Rider',
                              phone: ride.rider_phone || ''
                            },
                            fare: {
                              estimate: parseFloat(ride.fare_estimate) || 0,
                              currency: 'GBP'
                            }
                          };

                          res.json({
                            success: true,
                            message: 'Ride accepted successfully',
                            activeRide: acceptedRide
                          });
                        });
                      }
                    );
                  }
                );
              }
            );
          });
        }
      );
    }
  );
};

// ===== SOCKET.IO EVENTS FOR DRIVERS =====

// Add these to your existing socket.io setup
function setupDriverSocketEvents(io) {
  io.on('connection', (socket) => {
    // Driver joins their room
    socket.on('registerDriver', (driverId) => {
      socket.join(`driver_${driverId}`);
      console.log(`Driver ${driverId} connected`);
      
      // Update driver status to online if they were offline
      db.query(
        'UPDATE driver_status SET status = "online", updated_at = NOW() WHERE driver_id = ? AND status = "offline"',
        [driverId]
      );
    });

    // Real-time location updates
    socket.on('driverLocationUpdate', (data) => {
      const { driverId, latitude, longitude, heading, speed } = data;
      
      // Update database
      db.query(
        `UPDATE driver_status 
         SET latitude = ?, longitude = ?, heading = ?, speed = ?, last_location_update = NOW()
         WHERE driver_id = ?`,
        [latitude, longitude, heading, speed, driverId]
      );

      // Broadcast to tracking riders
      broadcastDriverLocation(driverId, { latitude, longitude, heading, speed });
    });

    // Driver status changes
    socket.on('driverStatusChange', (data) => {
      const { driverId, status } = data;
      
      db.query(
        'UPDATE driver_status SET status = ?, updated_at = NOW() WHERE driver_id = ?',
        [status, driverId]
      );

      // Broadcast to admin/monitoring
      socket.broadcast.emit('driverStatusUpdate', {
        driverId,
        status,
        timestamp: new Date()
      });
    });

    // Driver disconnection
    socket.on('disconnect', () => {
      // You might want to update driver status to offline after a timeout
      console.log('Driver disconnected');
    });
  });
}

// ===== RIDE ASSIGNMENT LOGIC =====

// Function to assign ride to nearest available driver
exports.assignRideToDriver = (rideId, callback) => {
  // Get ride details
  db.query('SELECT * FROM rides WHERE id = ?', [rideId], (err, rideResults) => {
    if (err || rideResults.length === 0) {
      return callback(new Error('Ride not found'));
    }

    const ride = rideResults[0];

    // Find nearest available driver
    const query = `
      SELECT 
        ds.driver_id,
        ds.latitude,
        ds.longitude,
        d.name as driver_name,
        d.phone as driver_phone,
        d.vehicle_model,
        d.license_plate,
        (6371 * acos(
          cos(radians(?)) * cos(radians(ds.latitude)) * 
          cos(radians(ds.longitude) - radians(?)) + 
          sin(radians(?)) * sin(radians(ds.latitude))
        )) AS distance
      FROM driver_status ds
      JOIN drivers d ON ds.driver_id = d.id
      LEFT JOIN driver_active_rides dar ON ds.driver_id = dar.driver_id
      WHERE ds.status = 'online' 
        AND dar.driver_id IS NULL
        AND ds.latitude IS NOT NULL 
        AND ds.longitude IS NOT NULL
      ORDER BY distance ASC
      LIMIT 1
    `;

    const pickupLat = parseFloat(ride.pickup_latitude) || 54.607868;
    const pickupLng = parseFloat(ride.pickup_longitude) || -5.926437;

    db.query(query, [pickupLat, pickupLng, pickupLat], (err, driverResults) => {
      if (err || driverResults.length === 0) {
        return callback(new Error('No available drivers found'));
      }

      const driver = driverResults[0];

      // Assign ride to driver
      db.query(
        'INSERT INTO driver_active_rides (driver_id, ride_id, status) VALUES (?, ?, "assigned")',
        [driver.driver_id, rideId],
        (assignErr) => {
          if (assignErr) {
            return callback(assignErr);
          }

          // Update driver status to busy
          db.query(
            'UPDATE driver_status SET status = "busy" WHERE driver_id = ?',
            [driver.driver_id]
          );

          // Update ride with driver info
          db.query(
            'UPDATE rides SET driver_id = ?, status = "assigned" WHERE id = ?',
            [driver.driver_id, rideId]
          );

          // Notify driver of new ride assignment
          io.to(`driver_${driver.driver_id}`).emit('rideAssigned', {
            rideId,
            pickup: {
              latitude: pickupLat,
              longitude: pickupLng,
              title: 'Pickup Location',
              description: ride.pickup_location,
              type: 'pickup'
            },
            destination: {
              latitude: parseFloat(ride.destination_latitude) || 54.584473,
              longitude: parseFloat(ride.destination_longitude) || -5.933669,
              title: 'Destination',
              description: ride.destination,
              type: 'destination'
            },
            rider: {
              name: ride.rider_name || 'Rider',
              phone: ride.rider_phone || ''
            }
          });

          callback(null, { success: true, driverId: driver.driver_id, driver });
        }
      );
    });
  });
};

// ===== API ROUTES =====

/*
Add these routes to your Express app:

// Driver status routes
app.get('/api/driver/status', authenticateDriver, driverController.getDriverStatus);
app.put('/api/driver/status', authenticateDriver, driverController.updateDriverStatus);
app.put('/api/driver/location', authenticateDriver, driverController.updateDriverLocation);

// Driver ride routes  
app.get('/api/driver/active-ride', authenticateDriver, driverController.getActiveRide);
app.put('/api/driver/ride-status', authenticateDriver, driverController.updateRideStatus);

// Available rides routes
app.get('/api/drivers/available-rides', authenticateDriver, driverController.getAvailableRides);
app.post('/api/drivers/accept-ride', authenticateDriver, driverController.acceptRide);

// Middleware to authenticate drivers (adjust based on your auth system)
function authenticateDriver(req, res, next) {
  // Your driver authentication logic here
  // Should set req.user.id to the driver ID
  next();
}
*/

module.exports = {
  updateDriverStatus: exports.updateDriverStatus,
  getDriverStatus: exports.getDriverStatus,
  updateDriverLocation: exports.updateDriverLocation,
  getActiveRide: exports.getActiveRide,
  updateRideStatus: exports.updateRideStatus,
  assignRideToDriver: exports.assignRideToDriver,
  getAvailableRides: exports.getAvailableRides,
  acceptRide: exports.acceptRide,
  setupDriverSocketEvents
};
