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

// Helper function to broadcast driver location to relevant riders
function broadcastDriverLocation(driverId, location) {
  // Get riders who are tracking this driver
  db.query(
    `SELECT r.rider_id 
     FROM rides r 
     JOIN driver_active_rides dar ON r.id = dar.ride_id 
     WHERE dar.driver_id = ? AND dar.status IN ('en_route_pickup', 'arrived_pickup', 'in_progress')`,
    [driverId],
    (err, results) => {
      if (err || results.length === 0) return;

      results.forEach(row => {
        io.to(`rider_${row.rider_id}`).emit('driverLocationUpdate', {
          driverId,
          location,
          timestamp: new Date()
        });
      });
    }
  );
}

// Helper function to notify rider of ride status changes
function notifyRiderOfStatusChange(rideId, status) {
  db.query(
    'SELECT rider_id FROM rides WHERE id = ?',
    [rideId],
    (err, results) => {
      if (err || results.length === 0) return;

      const riderId = results[0].rider_id;
      io.to(`rider_${riderId}`).emit('rideStatusUpdate', {
        rideId,
        status,
        timestamp: new Date()
      });
    }
  );
}

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
  setupDriverSocketEvents
};
