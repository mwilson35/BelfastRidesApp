// BACKEND FIX: Replace the driver finding query with this version
// This removes the missing rating and total_rides columns

// In your backend file, replace the driver finding query with:

const findAvailableDriversQuery = `
  SELECT 
    ds.driver_id,
    ds.latitude,
    ds.longitude,
    u.username as driver_name,
    u.email as driver_email,
    u.vehicle_description,
    u.vehicle_reg as license_plate,
    5.0 as rating,  -- Fixed: Use default rating
    0 as total_rides,  -- Fixed: Use default total_rides
    (6371 * acos(
      cos(radians(?)) * cos(radians(ds.latitude)) * 
      cos(radians(ds.longitude) - radians(?)) + 
      sin(radians(?)) * sin(radians(ds.latitude))
    )) AS distance
  FROM driver_status ds
  JOIN users u ON ds.driver_id = u.id
  LEFT JOIN driver_active_rides dar ON ds.driver_id = dar.driver_id
  WHERE ds.status = 'online' 
    AND u.role = 'driver'
    AND u.verified = true
    AND dar.driver_id IS NULL
    AND ds.latitude IS NOT NULL 
    AND ds.longitude IS NOT NULL
  HAVING distance <= 10
  ORDER BY distance ASC
  LIMIT 10
`;

// OR completely remove rating from ORDER BY:

const findAvailableDriversQuerySimple = `
  SELECT 
    ds.driver_id,
    ds.latitude,
    ds.longitude,
    u.username as driver_name,
    u.email as driver_email,
    u.vehicle_description,
    u.vehicle_reg as license_plate,
    (6371 * acos(
      cos(radians(?)) * cos(radians(ds.latitude)) * 
      cos(radians(ds.longitude) - radians(?)) + 
      sin(radians(?)) * sin(radians(ds.latitude))
    )) AS distance
  FROM driver_status ds
  JOIN users u ON ds.driver_id = u.id
  LEFT JOIN driver_active_rides dar ON ds.driver_id = dar.driver_id
  WHERE ds.status = 'online' 
    AND u.role = 'driver'
    AND u.verified = true
    AND dar.driver_id IS NULL
    AND ds.latitude IS NOT NULL 
    AND ds.longitude IS NOT NULL
  HAVING distance <= 10
  ORDER BY distance ASC
  LIMIT 10
`;
