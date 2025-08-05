# API Endpoints Documentation

This document outlines all the API endpoints required for the assessment application backend.

## Base Configuration

- **Base URL**: `http://localhost:3001/api` (configurable via environment)
- **Authentication**: Bearer token in Authorization header
- **Content-Type**: `application/json` for most endpoints
- **Response Format**: All endpoints return data in this format:

```json
{
  "success": boolean,
  "data": any,
  "message": string (optional)
}
```

## Authentication Endpoints

### POST `/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token_here",
    "refresh_token": "refresh_token_here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "admin|user",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

### POST `/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "user" // optional, defaults to "user"
}
```

**Response:** Same as login

### POST `/auth/logout`
Logout current user (invalidate token).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET `/auth/me`
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin|user",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST `/auth/refresh`
Refresh access token.

**Headers:** `Authorization: Bearer <refresh_token>`

**Response:** Same as login

## Questionnaire Endpoints

### GET `/questionnaires`
Get all questionnaires (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Food Preferences Assessment",
      "description": "Assessment description",
      "is_active": true,
      "created_by": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/questionnaires/active`
Get the currently active questionnaire (public).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Food Preferences Assessment",
    "description": "Assessment description",
    "is_active": true,
    "created_by": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET `/questionnaires/:id`
Get questionnaire by ID.

**Headers:** `Authorization: Bearer <token>` (admin only)

**Response:** Same as single questionnaire object

### POST `/questionnaires`
Create new questionnaire (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "New Assessment",
  "description": "Assessment description"
}
```

**Response:** Same as single questionnaire object

### PUT `/questionnaires/:id`
Update questionnaire (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Assessment",
  "description": "Updated description",
  "is_active": false
}
```

**Response:** Same as single questionnaire object

### DELETE `/questionnaires/:id`
Delete questionnaire (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Questionnaire deleted successfully"
}
```

### POST `/questionnaires/:id/activate`
Activate questionnaire (deactivates all others) (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Questionnaire activated successfully"
}
```

## Category Endpoints

### GET `/categories`
Get all categories.

**Query Parameters:**
- `questionnaire_id` (optional): Filter by questionnaire ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Breakfast",
      "description": "Morning meal preferences",
      "icon_url": "https://example.com/icon.png",
      "questionnaire_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/categories/:id`
Get category by ID.

**Response:** Same as single category object

### POST `/categories`
Create new category (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Category",
  "description": "Category description",
  "questionnaire_id": "uuid",
  "icon_url": "https://example.com/icon.png"
}
```

**Response:** Same as single category object

### PUT `/categories/:id`
Update category (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Category",
  "description": "Updated description",
  "icon_url": "https://example.com/new-icon.png"
}
```

**Response:** Same as single category object

### DELETE `/categories/:id`
Delete category (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

## Question Endpoints

### GET `/questions`
Get all questions.

**Query Parameters:**
- `questionnaire_id` (optional): Filter by questionnaire ID
- `category_id` (optional): Filter by category ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "text": "What type of breakfast do you prefer?",
      "type": "multiple_choice",
      "options": [
        {"text": "Full breakfast", "score": 3},
        {"text": "Light breakfast", "score": 2},
        {"text": "No breakfast", "score": 1}
      ],
      "category_id": "uuid",
      "questionnaire_id": "uuid",
      "order_number": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "categories": {"name": "Breakfast"}
    }
  ]
}
```

### GET `/questions/:id`
Get question by ID.

**Response:** Same as single question object

### POST `/questions`
Create new question (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "text": "New question text?",
  "type": "multiple_choice",
  "options": [
    {"text": "Option 1", "score": 3},
    {"text": "Option 2", "score": 2}
  ],
  "category_id": "uuid",
  "questionnaire_id": "uuid",
  "order_number": 1
}
```

**Response:** Same as single question object

### PUT `/questions/:id`
Update question (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "text": "Updated question text?",
  "options": [
    {"text": "Updated Option 1", "score": 3},
    {"text": "Updated Option 2", "score": 2}
  ],
  "order_number": 2
}
```

**Response:** Same as single question object

### DELETE `/questions/:id`
Delete question (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

### PUT `/questions/reorder`
Reorder questions (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "questionnaire_id": "uuid",
  "question_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Questions reordered successfully"
}
```

## Scoring Rules Endpoints

### GET `/scoring-rules`
Get all scoring rules.

**Query Parameters:**
- `questionnaire_id` (optional): Filter by questionnaire ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "questionnaire_id": "uuid",
      "category_id": "uuid",
      "min_percentage": 0,
      "max_percentage": 33,
      "level_name": "Beginner",
      "description": "Basic level description",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/scoring-rules/:id`
Get scoring rule by ID.

**Response:** Same as single scoring rule object

### POST `/scoring-rules`
Create new scoring rule (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "questionnaire_id": "uuid",
  "category_id": "uuid",
  "min_percentage": 0,
  "max_percentage": 33,
  "level_name": "Beginner",
  "description": "Basic level description"
}
```

**Response:** Same as single scoring rule object

### PUT `/scoring-rules/:id`
Update scoring rule (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "min_percentage": 0,
  "max_percentage": 40,
  "level_name": "Updated Beginner",
  "description": "Updated description"
}
```

**Response:** Same as single scoring rule object

### DELETE `/scoring-rules/:id`
Delete scoring rule (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Scoring rule deleted successfully"
}
```

## User Response Endpoints

### GET `/user-responses`
Get all user responses (admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `questionnaire_id` (optional): Filter by questionnaire ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "questionnaire_id": "uuid",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "responses": {
        "question_id_1": 3,
        "question_id_2": 2
      },
      "scores": [
        {
          "category": "Breakfast",
          "score": 8,
          "maxScore": 12,
          "percentage": 67,
          "level": "Intermediate",
          "color": "blue"
        }
      ],
      "completed_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/user-responses/:id`
Get user response by ID (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:** Same as single user response object

### POST `/user-responses`
Submit user response (public).

**Request Body:**
```json
{
  "questionnaire_id": "uuid",
  "user_name": "John Doe",
  "user_email": "john@example.com",
  "responses": {
    "question_id_1": 3,
    "question_id_2": 2
  },
  "scores": [
    {
      "category": "Breakfast",
      "score": 8,
      "maxScore": 12,
      "percentage": 67,
      "level": "Intermediate",
      "color": "blue"
    }
  ]
}
```

**Response:** Same as single user response object

### DELETE `/user-responses/:id`
Delete user response (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "User response deleted successfully"
}
```

### GET `/user-responses/stats`
Get response statistics (admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `questionnaire_id` (required): Questionnaire ID for stats

**Response:**
```json
{
  "success": true,
  "data": {
    "total_responses": 150,
    "average_scores": {
      "Breakfast": 65.5,
      "Lunch": 72.3,
      "Dinner": 68.1
    },
    "completion_rate": 85.2
  }
}
```

## File Upload Endpoints

### POST `/uploads/category-icons`
Upload category icon file.

**Headers:** `Authorization: Bearer <token>` (admin only)

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/uploads/category-icons/filename.png"
  }
}
```

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information" // optional
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

## Database Schema

The backend should implement these MongoDB collections:

### users
```json
{
  "_id": "ObjectId",
  "email": "string",
  "password": "string (hashed)",
  "role": "admin|user",
  "created_at": "Date",
  "updated_at": "Date"
}
```

### questionnaires
```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string",
  "is_active": "boolean",
  "created_by": "ObjectId (user_id)",
  "created_at": "Date",
  "updated_at": "Date"
}
```

### categories
```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "icon_url": "string",
  "questionnaire_id": "ObjectId",
  "created_at": "Date",
  "updated_at": "Date"
}
```

### questions
```json
{
  "_id": "ObjectId",
  "text": "string",
  "type": "string",
  "options": "Array<{text: string, score: number}>",
  "category_id": "ObjectId",
  "questionnaire_id": "ObjectId",
  "order_number": "number",
  "created_at": "Date",
  "updated_at": "Date"
}
```

### scoring_rules
```json
{
  "_id": "ObjectId",
  "questionnaire_id": "ObjectId",
  "category_id": "ObjectId",
  "min_percentage": "number",
  "max_percentage": "number",
  "level_name": "string",
  "description": "string",
  "created_at": "Date",
  "updated_at": "Date"
}
```

### user_responses
```json
{
  "_id": "ObjectId",
  "questionnaire_id": "ObjectId",
  "user_name": "string",
  "user_email": "string",
  "responses": "Object (question_id -> score)",
  "scores": "Array<{category, score, maxScore, percentage, level, color}>",
  "completed_at": "Date"
}
```

## Environment Variables

The backend should use these environment variables:

```
MONGODB_URI=mongodb+srv://myclinicuser:<password>@<url>/?retryWrites=true&w=majority&appName=myclinic-cluster
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
PORT=3001
UPLOAD_PATH=./uploads
BASE_URL=http://localhost:3001
```