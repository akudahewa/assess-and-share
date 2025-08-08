# Assess and Share Backend API

A Node.js + Express backend server that connects to MongoDB Atlas, providing a REST API for the Assess and Share application.

## Features

- **MongoDB Atlas Integration**: Cloud-hosted MongoDB database
- **RESTful API**: Complete CRUD operations for all entities
- **Input Validation**: Request validation using express-validator
- **Error Handling**: Comprehensive error handling and logging
- **CORS Support**: Cross-origin resource sharing for frontend integration
- **Rate Limiting**: API rate limiting for security
- **Security**: Helmet.js for security headers
- **Logging**: Morgan for HTTP request logging

## Database Models

The backend includes the following MongoDB models:

1. **Item** - Sample model for demonstration (name, description, price, category, etc.)
2. **Category** - Assessment categories with names, descriptions, and icons
3. **Questionnaire** - Assessment questionnaires with titles, descriptions, and settings
4. **Question** - Individual questions within questionnaires
5. **UserResponse** - User responses to questionnaires
6. **ScoringRule** - Rules for scoring and categorizing responses

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- npm or yarn package manager

## Installation

1. **Clone the repository and navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your MongoDB Atlas connection string and other settings:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/assess-and-share?retryWrites=true&w=majority
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   Or start the production server:
   ```bash
   npm start
   ```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Items (Sample CRUD)
- `GET /api/items` - Get all items (with pagination, filtering, sorting)
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `PATCH /api/items/:id/toggle-stock` - Toggle item stock status
- `GET /api/items/category/:category` - Get items by category
- `GET /api/items/stock/in-stock` - Get items in stock

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/active` - Get active categories
- `GET /api/categories/questionnaire/:questionnaireId` - Get categories by questionnaire
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `PATCH /api/categories/:id/activate` - Activate category
- `PATCH /api/categories/:id/deactivate` - Deactivate category

### Questionnaires
- `GET /api/questionnaires` - Get all questionnaires
- `GET /api/questionnaires/active` - Get active questionnaires
- `GET /api/questionnaires/creator/:createdBy` - Get questionnaires by creator
- `GET /api/questionnaires/:id` - Get single questionnaire
- `POST /api/questionnaires` - Create new questionnaire
- `PUT /api/questionnaires/:id` - Update questionnaire
- `DELETE /api/questionnaires/:id` - Delete questionnaire
- `PATCH /api/questionnaires/:id/activate` - Activate questionnaire
- `PATCH /api/questionnaires/:id/deactivate` - Deactivate questionnaire
- `PATCH /api/questionnaires/:id/update-metadata` - Update questionnaire metadata

### Questions
- `GET /api/questions` - Get all questions
- `GET /api/questions/questionnaire/:questionnaireId` - Get questions by questionnaire
- `GET /api/questions/category/:categoryId` - Get questions by category
- `GET /api/questions/:id` - Get single question
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/reorder` - Reorder questions
- `GET /api/questions/next-order/:questionnaireId` - Get next order number

### User Responses
- `GET /api/user-responses` - Get all user responses
- `GET /api/user-responses/questionnaire/:questionnaireId` - Get responses by questionnaire
- `GET /api/user-responses/user/:userEmail` - Get responses by user email
- `GET /api/user-responses/:id` - Get single user response
- `POST /api/user-responses` - Create new user response
- `PUT /api/user-responses/:id` - Update user response
- `DELETE /api/user-responses/:id` - Delete user response
- `PATCH /api/user-responses/:id/complete` - Mark response as completed
- `PATCH /api/user-responses/:id/abandon` - Mark response as abandoned

### Scoring Rules
- `GET /api/scoring-rules` - Get all scoring rules
- `GET /api/scoring-rules/questionnaire/:questionnaireId` - Get rules by questionnaire
- `GET /api/scoring-rules/category/:categoryId` - Get rules by category
- `GET /api/scoring-rules/:id` - Get single scoring rule
- `POST /api/scoring-rules` - Create new scoring rule
- `PUT /api/scoring-rules/:id` - Update scoring rule
- `DELETE /api/scoring-rules/:id` - Delete scoring rule
- `POST /api/scoring-rules/level` - Get level for a percentage
- `POST /api/scoring-rules/bulk` - Create multiple scoring rules

## API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## Query Parameters

Most GET endpoints support the following query parameters:

- `page` - Page number for pagination (default: 1)
- `limit` - Number of items per page (default: 10)
- `sortBy` - Field to sort by (default varies by endpoint)
- `sortOrder` - Sort order: 'asc' or 'desc' (default: 'asc' or 'desc' depending on endpoint)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | Required |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment (development/production) | development |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | 900000 (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | Maximum requests per window | 100 |
| `JWT_SECRET` | JWT secret for authentication | your-super-secret-jwt-key-here |

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [mongodb.com](https://mongodb.com)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string from the cluster dashboard
5. Replace the placeholder values in your `.env` file

## Development

### Running in Development Mode
```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

### Running in Production Mode
```bash
npm start
```

### Testing the API

You can test the API using tools like:
- [Postman](https://postman.com)
- [Insomnia](https://insomnia.rest)
- [curl](https://curl.se)

Example curl commands:

```bash
# Health check
curl http://localhost:5000/api/health

# Get all items
curl http://localhost:5000/api/items

# Create a new item
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Item",
    "description": "A sample item for testing",
    "price": 29.99,
    "category": "electronics"
  }'
```

## Frontend Integration

To integrate with your React frontend, update your API calls to use the new backend endpoints instead of Supabase. For example:

```javascript
// Old Supabase call
const { data, error } = await supabase
  .from('items')
  .select('*');

// New API call
const response = await fetch('http://localhost:5000/api/items');
const { data, success, error } = await response.json();
```

## Security Features

- **CORS**: Configured to allow requests from your frontend
- **Rate Limiting**: Prevents abuse with configurable limits
- **Helmet**: Security headers for protection
- **Input Validation**: All inputs are validated using express-validator
- **Error Handling**: Comprehensive error handling without exposing sensitive information

## Deployment

The backend can be deployed to various platforms:

- **Heroku**: Use the provided `package.json` scripts
- **Vercel**: Configure for Node.js deployment
- **Railway**: Direct deployment from GitHub
- **DigitalOcean App Platform**: Container-based deployment

Make sure to set the appropriate environment variables in your deployment platform.

## License

MIT License - see LICENSE file for details. 