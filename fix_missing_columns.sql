-- Fix for missing rating and total_rides columns
-- Run these SQL commands on your database

-- Add rating column to users table
ALTER TABLE users ADD COLUMN rating DECIMAL(3,2) DEFAULT 5.0;

-- Add total_rides column to users table  
ALTER TABLE users ADD COLUMN total_rides INT DEFAULT 0;

-- Add indexes for performance
CREATE INDEX idx_users_rating ON users(rating);
CREATE INDEX idx_users_total_rides ON users(total_rides);

-- Update existing drivers with default values
UPDATE users SET rating = 5.0, total_rides = 0 WHERE role = 'driver' AND rating IS NULL;
