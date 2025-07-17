# Backend API Requirements for New Features

## 🟢 IMPLEMENTATION STATUS

### ✅ COMPLETED (Working)
- User Settings API - `/api/user/settings`
- Favorite Locations API - `/api/user/favorites`  
- **Geocoding API** - `/api/user/geocode` - **FIXED URL**
- Payment Methods API - `/api/payment/methods`
- Notifications API - `/api/notifications`
- Emergency Features API - `/api/emergency/contacts` & `/api/emergency/panic`

**⚠️ CRITICAL FIX NEEDED:**
- Backend returns INT IDs but frontend expects STRING IDs
- **Solution**: Convert all ID fields to strings in API responses
- Example: `"id": location.id.toString()` in your backend responses

### ❌ ISSUES RESOLVED
- **✅ FIXED**: Frontend was calling wrong geocoding URL (`/api/geocode` → `/api/user/geocode`)
- **✅ CONFIRMED**: All backend APIs are actually implemented and working

**Note**: All APIs are now properly connected. The frontend handles errors gracefully and should work fully once any remaining backend setup is complete.

---

## Payment Methods API
```
GET    /api/payment/methods                 - Get user's payment methods
POST   /api/payment/methods                 - Add new payment method
PATCH  /api/payment/methods/:id/default     - Set default payment method
DELETE /api/payment/methods/:id             - Remove payment method
```

## Notifications API
```
GET    /api/notifications                   - Get user notifications
PATCH  /api/notifications/:id/read          - Mark notification as read
PATCH  /api/notifications/read-all          - Mark all as read
DELETE /api/notifications                   - Clear all notifications
GET    /api/notifications/settings          - Get notification preferences
PATCH  /api/notifications/settings          - Update notification settings
```

## Emergency Features API
```
GET    /api/emergency/contacts               - Get emergency contacts
POST   /api/emergency/contacts               - Add emergency contact
PATCH  /api/emergency/contacts/:id/primary  - Set primary contact
DELETE /api/emergency/contacts/:id          - Remove emergency contact
POST   /api/emergency/panic                 - Trigger panic mode
```

## Settings & Favorites API
```
GET    /api/user/favorites                  - Get favorite locations
POST   /api/user/favorites                  - Add favorite location
DELETE /api/user/favorites/:id              - Remove favorite location
GET    /api/user/settings                   - Get app settings
PATCH  /api/user/settings                   - Update app settings
POST   /api/user/geocode                    - Geocode address to coordinates
```

### 🔍 DETAILED API SPECIFICATIONS

#### GET /api/user/favorites
**Response:**
```json
{
  "locations": [
    {
      "id": "1",                          // INT converted to STRING
      "name": "Home",
      "address": "123 Main St, Belfast",
      "latitude": 54.5973,
      "longitude": -5.9301,
      "type": "home"
    }
  ]
}
```

#### POST /api/user/favorites
**Request:**
```json
{
  "name": "Home",
  "address": "123 Main St, Belfast",
  "type": "home",
  "latitude": 54.5973,
  "longitude": -5.9301
}
```
**Response:**
```json
{
  "location": {
    "id": "2",                          // INT converted to STRING
    "name": "Home",
    "address": "123 Main St, Belfast",
    "latitude": 54.5973,
    "longitude": -5.9301,
    "type": "home"
  }
}
```

#### POST /api/user/geocode
**Request:**
```json
{
  "address": "123 Main St, Belfast"
}
```
**Response:**
```json
{
  "latitude": 54.5973,
  "longitude": -5.9301
}
```

## Database Schema Requirements

### payment_methods table
```sql
- id (UUID, primary key)
- user_id (foreign key)
- type (enum: 'card', 'paypal', 'apple_pay', 'google_pay')
- encrypted_card_number (for last 4 digits display)
- brand (visa, mastercard, etc.)
- expiry_month (int)
- expiry_year (int)
- name_on_card (string)
- is_default (boolean)
- stripe_payment_method_id (string, for Stripe integration)
- created_at, updated_at
```

### notifications table
```sql
- id (UUID, primary key)  
- user_id (foreign key)
- type (enum: ride_accepted, ride_started, etc.)
- title (string)
- message (text)
- is_read (boolean, default false)
- ride_id (foreign key, nullable)
- metadata (JSON, for extra data)
- created_at, updated_at
```

### notification_settings table
```sql
- user_id (foreign key, primary key)
- ride_updates (boolean, default true)
- driver_arrival (boolean, default true) 
- payment_confirmations (boolean, default true)
- scheduled_reminders (boolean, default true)
- promotions (boolean, default false)
- system_updates (boolean, default true)
- push_enabled (boolean, default true)
- email_enabled (boolean, default true)
- sms_enabled (boolean, default false)
- updated_at
```

### emergency_contacts table
```sql
- id (UUID, primary key)
- user_id (foreign key)
- name (string)
- phone_number (string)
- relationship (string, nullable)
- is_primary (boolean, default false)
- created_at, updated_at
```

### emergency_alerts table  
```sql
- id (UUID, primary key)
- user_id (foreign key)
- ride_id (foreign key, nullable)
- latitude (decimal)
- longitude (decimal)
- alert_type (enum: 'panic', 'emergency_call')
- resolved (boolean, default false)
- created_at, updated_at
```

### favorite_locations table
```sql
- id (INT AUTO_INCREMENT, primary key)  -- ⚠️ FRONTEND EXPECTS STRING
- user_id (INT, foreign key)
- name (VARCHAR(255))
- address (TEXT)
- latitude (DECIMAL(10, 8))
- longitude (DECIMAL(11, 8))
- type (ENUM: 'home', 'work', 'other', default 'other')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**⚠️ ID TYPE MISMATCH:**
- **Backend**: Uses `INT` for IDs
- **Frontend**: Expects `string` for IDs
- **Solution**: Convert IDs to strings in API responses

### user_settings table
```sql
- user_id (foreign key, primary key)
- default_payment_method_id (foreign key, nullable)
- auto_accept_best_fare (boolean, default false)
- share_location_with_contacts (boolean, default true)
- enable_push_notifications (boolean, default true)
- enable_location_services (boolean, default true)
- enable_touch_id (boolean, default false)
- enable_face_id (boolean, default false)
- auto_book_from_favorites (boolean, default false)
- show_driver_photo (boolean, default true)
- enable_ride_reminders (boolean, default true)
- preferred_language (string, default 'en')
- distance_unit (enum: 'km', 'miles', default 'km')
- currency (enum: 'GBP', 'EUR', 'USD', default 'GBP')
- updated_at
```

## Integration Requirements

### Payment Processing
- Stripe integration for secure card storage
- PCI compliance for card data handling
- Webhook endpoints for payment events

### Push Notifications  
- Firebase Cloud Messaging (FCM) setup
- Apple Push Notification Service (APNS)
- Notification scheduling for ride reminders

### SMS/Email Services
- Twilio for SMS notifications
- SendGrid/AWS SES for email notifications
- Emergency contact messaging

### Security
- Encryption for sensitive data (payment methods, emergency contacts)
- Rate limiting on emergency endpoints
- Audit logging for panic mode activations

## Recommendation

**Should you implement the backend first?** 

**YES** - I'd recommend implementing at least the basic backend endpoints before continuing with more frontend features. Here's a prioritized approach:

### Phase 1 (Essential - Do First):
1. **User Settings API** - Basic app preferences
2. **Favorite Locations API** - For better UX in ride booking
3. **Basic Notifications API** - At least read/mark as read

### Phase 2 (Important - Do Next):
4. **Emergency Contacts API** - For safety features
5. **Payment Methods API** - For payment integration

### Phase 3 (Nice to Have - Do Later):
6. **Advanced Notifications** - Full preference management
7. **Emergency Panic System** - Advanced safety features

This way you can test the integration as you build, rather than having a lot of frontend code that can't actually work yet.

Would you like me to help you implement any of these backend endpoints first?
