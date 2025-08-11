# Migration from Supabase to MongoDB Atlas

## Overview
This document explains the migration from Supabase to MongoDB Atlas and provides instructions for setting up the external backend.

## Migration Status: ✅ COMPLETE

The application has been restructured to use external API endpoints instead of Supabase. All database operations now go through RESTful API calls to your MongoDB backend.

## What Was Changed

### 1. Removed Supabase Completely
The following Supabase-specific code has been completely removed:
- All `supabase.from()` calls replaced with API service calls
- Supabase client configuration and dependencies
- Supabase authentication system
- Supabase storage for file uploads
- Supabase migrations and schema files

### 2. New Architecture
Components now use the new API services instead of direct Supabase calls.

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/assess-and-share
PORT=5002
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:8080,http://localhost:3000
JWT_SECRET=your-secret-key-here
```

### 3. Start the Backend
```bash
npm run dev
```

The server will start on `http://localhost:5002`.

## Frontend Configuration

### 1. API Base URL
The frontend is configured to use `http://localhost:5002/api` as the base URL for all API calls.

### 2. No Supabase Dependencies
All Supabase packages have been removed from `package.json`. The frontend now only uses the custom REST API client.

## Data Migration

You'll need to migrate your existing Supabase data to MongoDB. The data structure mapping:

### Database Mapping
Supabase Table -> MongoDB Collection
- `questionnaires` -> `questionnaires`
- `categories` -> `categories`
- `questions` -> `questions`
- `user_responses` -> `userresponses`
- `scoring_rules` -> `scoringrules`

### Field Mapping
- `id` (UUID) -> `_id` (ObjectId)
- `created_at` -> `createdAt`
- `updated_at` -> `updatedAt`
- `questionnaire_id` -> `questionnaireId`
- `category_id` -> `categoryId`

## API Endpoints

### Health Check
- `GET /api/health` - Server status

### Questionnaires
- `GET /api/questionnaires` - List all questionnaires
- `POST /api/questionnaires` - Create questionnaire
- `PUT /api/questionnaires/:id` - Update questionnaire
- `DELETE /api/questionnaires/:id` - Delete questionnaire

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `POST /api/categories/:id/icon` - Upload category icon
- `GET /api/categories/:id/icon` - Serve category icon

### Questions
- `GET /api/questions` - List all questions
- `POST /api/questions` - Create question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### User Responses
- `GET /api/user-responses` - List all responses
- `POST /api/user-responses` - Create response
- `PUT /api/user-responses/:id` - Update response
- `DELETE /api/user-responses/:id` - Delete response

### Scoring Rules
- `GET /api/scoring-rules` - List all rules
- `POST /api/scoring-rules` - Create rule
- `PUT /api/scoring-rules/:id` - Update rule
- `DELETE /api/scoring-rules/:id` - Delete rule

## Key Differences from Supabase

1. **Authentication**: Now uses JWT tokens instead of Supabase auth
2. **File Storage**: Direct file uploads to MongoDB instead of Supabase storage
3. **Real-time**: No built-in real-time updates (can be added with WebSockets)
4. **Database**: MongoDB instead of PostgreSQL
5. **API**: Custom REST API instead of Supabase client

## Testing

### 1. Backend Health Check
```bash
curl http://localhost:5002/api/health
```

### 2. Create a Test Category
```bash
curl -X POST http://localhost:5002/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Category","description":"Test Description"}'
```

### 3. Test Frontend
Start the frontend and navigate to the admin panel to test CRUD operations.

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your frontend port is included in `CORS_ORIGIN`
2. **MongoDB Connection**: Verify your MongoDB URI is correct
3. **Port Conflicts**: Make sure port 5002 is available

### Debug Mode
The backend includes comprehensive logging. Check the console for detailed error messages.

## Next Steps

- [x] Remove all Supabase dependencies
- [x] Set up MongoDB backend
- [x] Implement REST API endpoints
- [x] Update frontend to use new API
- [x] Test all functionality
- [ ] Monitor performance
- [ ] Add additional features as needed

## Conclusion

The migration from Supabase to MongoDB is now complete. All Supabase code has been removed, and the application now uses a custom REST API backend with MongoDB Atlas. The frontend is fully functional with the new backend system.