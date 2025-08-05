# Migration from Supabase to MongoDB Atlas

This document explains the migration from Supabase to MongoDB Atlas and provides instructions for setting up the external backend.

## Overview

The application has been restructured to use external API endpoints instead of Supabase. All database operations now go through RESTful API calls to your MongoDB backend.

## What Changed

### 1. New API Service Layer
- `src/services/api.ts` - Base API client with authentication
- `src/services/auth.ts` - Authentication service
- `src/services/questionnaires.ts` - Questionnaire management
- `src/services/categories.ts` - Category management  
- `src/services/questions.ts` - Question management
- `src/services/scoringRules.ts` - Scoring rules management
- `src/services/userResponses.ts` - User response handling

### 2. Removed Supabase Dependencies
The following Supabase-specific code has been replaced:
- All `supabase.from()` calls replaced with API service calls
- Authentication flows now use JWT tokens
- File uploads now use multipart form data to API endpoints

### 3. Updated Components
Components now use the new API services instead of direct Supabase calls.

## Backend Requirements

You need to implement a Node.js/Express backend with the following features:

### Required Endpoints
See `API_ENDPOINTS.md` for complete documentation of all required endpoints.

### Database Schema
Your MongoDB database should have these collections:
- `users` - User authentication and profiles
- `questionnaires` - Assessment questionnaires
- `categories` - Question categories
- `questions` - Individual questions with options
- `scoring_rules` - Scoring and level definitions
- `user_responses` - User assessment submissions

### Authentication
- JWT-based authentication with access and refresh tokens
- Role-based access control (admin/user)
- Secure password hashing

### File Upload
- Category icon upload support
- File storage (local or cloud storage)

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in your frontend root:

```env
VITE_API_URL=http://localhost:3001/api
```

### 2. Backend Setup
Your backend should use these environment variables:

```env
MONGODB_URI=mongodb+srv://myclinicuser:<password>@<url>/?retryWrites=true&w=majority&appName=myclinic-cluster
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
PORT=3001
UPLOAD_PATH=./uploads
BASE_URL=http://localhost:3001
```

### 3. Database Migration
You'll need to migrate your existing Supabase data to MongoDB. The data structure mapping:

```
Supabase Table -> MongoDB Collection
profiles -> users
questionnaires -> questionnaires  
categories -> categories
questions -> questions
scoring_rules -> scoring_rules
user_responses -> user_responses
```

### 4. CORS Configuration
Your backend must configure CORS to allow requests from your frontend domain.

## Testing the Migration

1. Start your MongoDB backend server
2. Update the `VITE_API_URL` environment variable
3. Test the following flows:
   - Admin login
   - Create/edit questionnaires
   - Manage categories and questions
   - Take assessments
   - View results

## Backend Implementation Example

Here's a basic Express.js structure you could use:

```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.js
│   │   ├── questionnaires.js
│   │   ├── categories.js
│   │   ├── questions.js
│   │   ├── scoringRules.js
│   │   └── userResponses.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Questionnaire.js
│   │   ├── Category.js
│   │   ├── Question.js
│   │   ├── ScoringRule.js
│   │   └── UserResponse.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── questionnaires.js
│   │   ├── categories.js
│   │   ├── questions.js
│   │   ├── scoringRules.js
│   │   ├── userResponses.js
│   │   └── uploads.js
│   ├── utils/
│   │   └── database.js
│   └── app.js
├── uploads/
├── package.json
└── .env
```

## Key Differences from Supabase

1. **Authentication**: Now uses JWT tokens instead of Supabase auth
2. **File Storage**: Direct file uploads instead of Supabase storage
3. **Real-time**: No real-time features (would need WebSocket implementation)
4. **RLS**: Security handled by API middleware instead of Row Level Security
5. **Functions**: Business logic moved to API endpoints instead of edge functions

## Benefits of This Approach

1. **Full Control**: Complete control over your data and backend logic
2. **Flexibility**: Can customize business logic without platform constraints
3. **Cost Predictability**: No per-request pricing from third-party services
4. **Data Ownership**: Your data stays in your MongoDB instance

## Migration Checklist

- [ ] Set up MongoDB Atlas cluster
- [ ] Implement backend API with all required endpoints
- [ ] Configure authentication with JWT
- [ ] Set up file upload handling
- [ ] Migrate existing data from Supabase to MongoDB
- [ ] Test all functionality (admin, assessments, results)
- [ ] Update environment variables
- [ ] Deploy backend to production
- [ ] Update frontend API URL for production

## Support

If you need help with the backend implementation, refer to:
- `API_ENDPOINTS.md` for complete API documentation
- MongoDB Atlas documentation for database setup
- Express.js documentation for backend framework
- JWT documentation for authentication implementation