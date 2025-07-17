// Backend function to add to your tip controller or create a new updateDriverEarnings function

/**
 * Update driver earnings when a tip is added retroactively
 * This should be called whenever a tip is added to a completed ride
 */
const updateDriverEarningsWithTip = (rideId, tipAmount, callback) => {
  // First, get ride details to find the driver
  db.query('SELECT driver_id, status FROM rides WHERE id = ?', [rideId], (err, rideResults) => {
    if (err) {
      console.error('Error fetching ride details for tip earnings:', err);
      return callback(err);
    }

    if (rideResults.length === 0) {
      return callback(new Error('Ride not found'));
    }

    const ride = rideResults[0];
    const driverId = ride.driver_id;

    if (ride.status !== 'completed') {
      return callback(new Error('Can only add tip earnings to completed rides'));
    }

    // Add tip to driver earnings table
    db.query(
      'INSERT INTO driver_earnings (driver_id, ride_id, amount, earning_type) VALUES (?, ?, ?, ?)',
      [driverId, rideId, tipAmount, 'tip'],
      (err) => {
        if (err) {
          console.error('Error inserting tip into driver_earnings:', err);
          return callback(err);
        }

        // Update weekly earnings to include the tip
        const currentDate = new Date();
        const { formattedWeekStart, formattedWeekEnd } = getWeekStartAndEnd(currentDate);

        db.query(
          `INSERT INTO weekly_earnings (driver_id, week_start, week_end, total_earnings)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE total_earnings = total_earnings + ?`,
          [driverId, formattedWeekStart, formattedWeekEnd, tipAmount, tipAmount],
          (err) => {
            if (err) {
              console.error('Error updating weekly earnings with tip:', err);
              return callback(err);
            }

            console.log(`✅ Added £${tipAmount} tip to driver ${driverId} earnings for ride ${rideId}`);
            callback(null, { success: true, message: 'Driver earnings updated with tip' });
          }
        );
      }
    );
  });
};

// Update your existing tip-adding endpoint to include earnings update
// This would go in your tip controller (e.g., tipController.js)

exports.addTip = (req, res) => {
  const userId = req.user.id;
  const { ride_id, tip_amount } = req.body;

  if (!ride_id || !tip_amount || tip_amount <= 0) {
    return res.status(400).json({ message: 'Valid ride_id and tip_amount required' });
  }

  // First, verify the user owns this ride
  db.query('SELECT * FROM rides WHERE id = ? AND rider_id = ?', [ride_id, userId], (err, rideResults) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (rideResults.length === 0) {
      return res.status(404).json({ message: 'Ride not found or not authorized' });
    }

    const ride = rideResults[0];

    if (ride.status !== 'completed') {
      return res.status(400).json({ message: 'Can only tip completed rides' });
    }

    // Check if tip already exists
    db.query('SELECT * FROM ride_tips WHERE ride_id = ?', [ride_id], (err, existingTips) => {
      if (err) {
        return res.status(500).json({ message: 'Database error checking existing tips' });
      }

      if (existingTips.length > 0) {
        return res.status(400).json({ message: 'Tip already exists for this ride' });
      }

      // Add the tip
      const tipQuery = `
        INSERT INTO ride_tips (ride_id, rider_id, driver_id, tip_amount, tip_type)
        VALUES (?, ?, ?, ?, 'manual')
      `;
      
      db.query(tipQuery, [ride_id, userId, ride.driver_id, tip_amount], (tipErr, tipResult) => {
        if (tipErr) {
          console.error('Error adding tip:', tipErr);
          return res.status(500).json({ message: 'Failed to add tip' });
        }

        // Update driver earnings with the tip
        updateDriverEarningsWithTip(ride_id, tip_amount, (earningsErr, earningsResult) => {
          if (earningsErr) {
            console.error('Tip added but earnings update failed:', earningsErr);
            // Still return success since tip was added, but log the earnings error
          }

          res.json({ 
            message: 'Tip added successfully',
            tip_id: tipResult.insertId,
            earnings_updated: !earningsErr
          });
        });
      });
    });
  });
};

// You may also need to update your driver_earnings table to include earning_type
// ALTER TABLE driver_earnings ADD COLUMN earning_type VARCHAR(20) DEFAULT 'fare';

module.exports = {
  updateDriverEarningsWithTip,
  addTip: exports.addTip
};
