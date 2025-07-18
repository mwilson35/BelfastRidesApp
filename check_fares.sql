-- SQL Query to check estimated_fare and ride details
-- Run this in your database to see the actual data structure

SELECT 
    id,
    pickup_location,
    destination,
    estimated_fare,
    distance,
    status,
    created_at,
    rider_id,
    driver_id
FROM rides 
WHERE status IN ('requested', 'pending')
ORDER BY created_at DESC 
LIMIT 10;

-- Check for NULL or empty estimated_fare values specifically
SELECT 
    id,
    pickup_location,
    destination,
    estimated_fare,
    distance,
    status
FROM rides 
WHERE estimated_fare IS NULL 
   OR estimated_fare = 0
ORDER BY created_at DESC
LIMIT 10;

-- Check the range of estimated_fare values
SELECT 
    MIN(estimated_fare) as min_fare,
    MAX(estimated_fare) as max_fare,
    AVG(estimated_fare) as avg_fare,
    COUNT(*) as total_rides,
    COUNT(estimated_fare) as rides_with_fare,
    COUNT(*) - COUNT(estimated_fare) as rides_without_fare
FROM rides;

-- Show all rides with their fare data
SELECT 
    id,
    pickup_location,
    destination,
    estimated_fare,
    fare,
    distance,
    status,
    created_at
FROM rides 
ORDER BY created_at DESC 
LIMIT 20;
