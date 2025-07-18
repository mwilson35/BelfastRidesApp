# 🚗 Available Rides Integration Guide

## ✅ What's Been Implemented

I've updated the driver dashboard to work with your **existing backend patterns**! No new complex endpoints needed.

### 📱 Frontend Updates (Complete)
- **AvailableRidesList.tsx** - Works with your existing ride data structure
- **DriverDashboard.tsx** - Shows "Available Rides" button when driver is online
- **API endpoints** - Uses your existing `/api/rides` pattern

### 🔧 Backend Integration (Simple)

You just need to add **2 simple endpoints** to your existing rides API:

#### 1. GET `/api/rides/pending` 
```javascript
// Add this to your existing rides controller
app.get('/api/rides/pending', authenticateDriver, (req, res) => {
  const query = `
    SELECT r.*, u.name as rider_name, u.rating as rider_rating
    FROM rides r
    JOIN users u ON r.rider_id = u.id
    WHERE r.status = 'pending' 
      AND r.driver_id IS NULL
    ORDER BY r.created_at DESC
    LIMIT 20
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ rides: results });
  });
});
```

#### 2. POST `/api/rides/accept`
```javascript
// Add this to your existing rides controller
app.post('/api/rides/accept', authenticateDriver, (req, res) => {
  const driverId = req.user.id;
  const { rideId } = req.body;
  
  // Update ride with driver assignment
  db.query(
    'UPDATE rides SET driver_id = ?, status = "assigned", updated_at = NOW() WHERE id = ? AND status = "pending"',
    [driverId, rideId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Ride not available' });
      }
      
      // Get the updated ride details
      db.query(
        'SELECT * FROM rides WHERE id = ?',
        [rideId],
        (err, rideResults) => {
          if (err || rideResults.length === 0) {
            return res.status(500).json({ message: 'Error fetching ride details' });
          }
          
          res.json({ 
            success: true, 
            ride: rideResults[0],
            message: 'Ride accepted successfully'
          });
        }
      );
    }
  );
});
```

## 🎯 How It Works

### Driver Experience:
1. **Driver goes online** using existing status toggle
2. **"Available Rides" button appears** (green, top-right of map)
3. **Tap button** → See list of pending rides
4. **Rides are color-coded** by priority:
   - 🔴 **Red**: Premium rides, high fare (£15+)
   - 🟠 **Orange**: Medium priority rides  
   - 🔵 **Blue**: Standard rides
   - ⚪ **Gray**: Low priority rides
5. **Tap any ride** → Route preview modal
6. **Accept ride** → Becomes active ride, navigation starts

### Priority Algorithm (Frontend):
The app automatically calculates priority based on:
- **Ride type**: Premium = 50 points, Standard = 25 points
- **Fare amount**: £15+ = 30 points, £8-15 = 15 points
- **Auto-sorts** by highest priority first

## 🚀 Testing

### 1. Add Test Data
Add some pending rides to your database:
```sql
INSERT INTO rides (pickup_location, destination, fare_estimate, ride_type, status, rider_id, created_at) VALUES
('Belfast City Centre', 'Queens University', 12.50, 'standard', 'pending', 1, NOW()),
('Titanic Quarter', 'George Best Airport', 18.75, 'premium', 'pending', 2, NOW()),
('Botanic Gardens', 'Victoria Square', 8.25, 'standard', 'pending', 3, NOW());
```

### 2. Test Flow
1. **Login as driver** and go online
2. **Tap "Available Rides"** button
3. **See color-coded list** of rides
4. **Tap a ride** to preview
5. **Accept ride** to test assignment

## 📡 Real-time Updates (Optional)

To make rides disappear when accepted by other drivers, add this to your ride acceptance logic:

```javascript
// After successful ride assignment, broadcast update
io.emit('rideAccepted', { rideId, driverId });
```

The frontend already refreshes every 30 seconds, plus pull-to-refresh.

## 🎨 Customization

### Priority Thresholds
In `AvailableRidesList.tsx`, you can adjust the priority scoring:
```javascript
// Current scoring:
priorityScore += rideType === 'premium' ? 50 : 25;
priorityScore += fareAmount > 15 ? 30 : fareAmount > 8 ? 15 : 0;

// High priority: 75+ points
// Medium priority: 50-74 points  
// Normal priority: 35-49 points
// Low priority: <35 points
```

### Colors
```javascript
// Current colors:
Red (#e74c3c): High priority
Orange (#f39c12): Medium priority
Blue (#3498db): Normal priority
Gray (#95a5a6): Low priority
```

## ✅ Ready to Test!

The system now works with your existing:
- ✅ Database structure (`rides` table)
- ✅ Authentication system
- ✅ API patterns (`/api/rides/*`)
- ✅ Socket.io setup

Just add the 2 endpoints above and you're ready to test with real data! 🎊

---

**Note**: The system gracefully handles missing data (rider names, ratings, etc.) and shows appropriate defaults.
