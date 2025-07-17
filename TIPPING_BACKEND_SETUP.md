# Tipping System Backend Setup

The TipScreen is now integrated but requires backend API endpoints to be implemented. Here's what needs to be added:

## Required API Endpoints

### 1. GET /api/user/tip-settings
**Purpose**: Get user's tip preferences
**Response**:
```json
{
  "auto_tip_enabled": false,
  "default_tip_amount": 0
}
```

### 2. PUT /api/user/tip-settings
**Purpose**: Update user's tip preferences
**Request Body**:
```json
{
  "auto_tip_enabled": true,
  "default_tip_amount": 5.0
}
```

### 3. GET /api/user/recent-rides-for-tip
**Purpose**: Get recent rides that can receive tips (last 30 days)
**Response**:
```json
[
  {
    "id": 123,
    "pickup_location": "Belfast City Centre",
    "destination": "Queen's University",
    "fare": 12.50,
    "requested_at": "2025-07-15T14:30:00Z",
    "driver_name": "John Smith",
    "existing_tip": null
  }
]
```

### 4. POST /api/user/add-tip
**Purpose**: Add a tip to a completed ride
**Request Body**:
```json
{
  "ride_id": 123,
  "tip_amount": 2.50
}
```
**Important**: This endpoint must also update driver earnings (see implementation below)

## Database Tables

### user_tip_settings
```sql
CREATE TABLE user_tip_settings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    auto_tip_enabled BOOLEAN DEFAULT FALSE,
    default_tip_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ride_tips
```sql
CREATE TABLE ride_tips (
    id SERIAL PRIMARY KEY,
    ride_id INT REFERENCES rides(id),
    rider_id INT REFERENCES users(id),
    driver_id INT REFERENCES drivers(id),
    tip_amount DECIMAL(10,2) NOT NULL,
    tip_type VARCHAR(20) DEFAULT 'manual', -- 'auto' or 'manual'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Update driver_earnings table
```sql
-- Add earning_type column to distinguish fare from tips
ALTER TABLE driver_earnings ADD COLUMN earning_type VARCHAR(20) DEFAULT 'fare';
```

## Critical: Driver Earnings Integration

**IMPORTANT**: When tips are added retrospectively, driver earnings must be updated!

The `/api/user/add-tip` endpoint must:
1. Add tip to `ride_tips` table
2. Add tip amount to `driver_earnings` table with `earning_type = 'tip'`
3. Update `weekly_earnings` to include the tip amount

See `BACKEND_TIP_EARNINGS_UPDATE.js` for complete implementation including:
- `updateDriverEarningsWithTip()` function
- Updated `addTip` endpoint with earnings integration
- Proper error handling and validation

## Current Status

✅ **Frontend**: TipScreen is complete and integrated
✅ **Navigation**: Added to hamburger menu
✅ **Error Handling**: Graceful fallback when backend is not available
❌ **Backend**: API endpoints need to be implemented
❌ **Earnings Integration**: Critical for driver payment accuracy

## Fallback Behavior

When backend endpoints return 404:
- Uses default tip settings locally
- Shows a warning banner to user
- Settings changes are saved locally only
- Helpful error messages guide the user

The app is fully functional for testing the UI, but tip data won't persist until backend is implemented.

## Implementation Priority

1. **High Priority**: Implement tip endpoints with earnings integration
2. **Medium Priority**: Test earnings calculation accuracy
3. **Low Priority**: Add tip analytics/reporting features
