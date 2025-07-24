# REST API Plan

## 1. Resources
- **Users** - Managed by Supabase Auth
- **Flashcards** - Stored in the `flashcards` table
- **Generations** - Stored in the `generations` table
- **Generation Error Logs** - Stored in the `generation_error_logs` table

## 2. Endpoints


#### Get All Flashcards
- **Method**: GET
- **URL**: `/flashcards`
- **Description**: Get all flashcards for the current user
- **Query Parameters**:
  - `page`: integer (default: 1)
  - `limit`: integer (default: 20)
  - `sort_by`: string (default: "created_at")
  - `sort_order`: string (default: "desc")
  - `source`: string (optional, filter by source: "ai-full", "ai-edited", "manual")
- **Response Body**:
  ```json
  {
    "data": [
      {
        "id": "integer",
        "front": "string",
        "back": "string",
        "source": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "generation_id": "integer | null"
      }
    ],
    "pagination": {
      "total": "integer",
      "page": "integer",
      "limit": "integer",
      "total_pages": "integer"
    }
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

#### Create Flashcards
- **Method**: POST
- **URL**: `/flashcards`
- **Description**: Create one or multiple flashcards (manually or from AI generations)
- **Request Body**:
    ```json
    {
        "flashcards": [
            {
                "front": "string",
                "back": "string",
                "source": "string", // "manual", "ai-full", or "ai-edited"
                "generation_id": "integer | null"
            }
        ]
    }
    ```
- **Response Body**:
    ```json
    {
        "data": [
            {
                "id": "integer",
                "front": "string",
                "back": "string",
                "source": "string",
                "created_at": "timestamp",
                "updated_at": "timestamp",
                "generation_id": "integer | null",
                "user_id": "uuid"
            }
        ],
        "count": "integer"
    }
    ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized

#### Get Flashcard by ID
- **Method**: GET
- **URL**: `/flashcards/{id}`
- **Description**: Get a specific flashcard by ID
- **Response Body**:
  ```json
  {
    "id": "integer",
    "front": "string",
    "back": "string",
    "source": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "generation_id": "integer | null",
    "user_id": "uuid"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### Update Flashcard
- **Method**: PUT
- **URL**: `/flashcards/{id}`
- **Description**: Update an existing flashcard
- **Request Body**:
  ```json
  {
    "front": "string",
    "back": "string"
  }
  ```
- **Response Body**:
  ```json
  {
    "id": "integer",
    "front": "string",
    "back": "string",
    "source": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "generation_id": "integer | null",
    "user_id": "uuid"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### Delete Flashcard
- **Method**: DELETE
- **URL**: `/flashcards/{id}`
- **Description**: Delete a flashcard
- **Response Body**:
  ```json
  {
    "message": "Flashcard successfully deleted"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found


### AI Generations

#### Generate Flashcards
- **Method**: POST
- **URL**: `/generations`
- **Description**: Generate flashcards using AI from provided text
- **Request Body**:
  ```json
  {
    "source_text": "string",
    "model": "string" // Optional, can have a default
  }
  ```
- **Response Body**:
  ```json
  {
    "generation_id": "integer",
    "flashcards": [
      {
        "id": "integer",
        "front": "string",
        "back": "string",
        "source": "ai-full"
      }
    ],
    "stats": {
      "generated_count": "integer",
      "source_text_length": "integer"
    }
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 503 Service Unavailable (AI service error)

#### Get Generation by ID
- **Method**: GET
- **URL**: `/generations/{id}`
- **Description**: Get details about a specific generation
- **Response Body**:
  ```json
  {
    "id": "integer",
    "model": "string",
    "generated_count": "integer",
    "accepted_unedited_count": "integer",
    "accepted_edited_count": "integer",
    "source_text_length": "integer",
    "created_at": "timestamp",
    "flashcards": [
      {
        "id": "integer",
        "front": "string",
        "back": "string",
        "source": "string"
      }
    ]
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### Accept Generated Flashcards
- **Method**: POST
- **URL**: `/generations/{id}/accept`
- **Description**: Accept and save generated flashcards, potentially with edits
- **Request Body**:
  ```json
  {
    "flashcards": [
      {
        "id": "integer", // ID from generation response
        "front": "string", // Can be edited from original
        "back": "string", // Can be edited from original
        "accept": "boolean" // Whether to accept this flashcard
      }
    ]
  }
  ```
- **Response Body**:
  ```json
  {
    "accepted_count": "integer",
    "flashcards": [
      {
        "id": "integer",
        "front": "string",
        "back": "string",
        "source": "string", // "ai-full" or "ai-edited"
        "created_at": "timestamp"
      }
    ]
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### Get User Generation Statistics
- **Method**: GET
- **URL**: `/generations/statistics`
- **Description**: Get statistics about the user's flashcard generations
- **Response Body**:
  ```json
  {
    "total_generations": "integer",
    "total_generated_flashcards": "integer",
    "total_accepted_unedited": "integer",
    "total_accepted_edited": "integer",
    "acceptance_rate": "float",
    "models_used": [
      {
        "model": "string",
        "count": "integer"
      }
    ]
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

### User Account Management

#### Get User Profile
- **Method**: GET
- **URL**: `/users/me`
- **Description**: Get current user profile information
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "email": "string",
    "created_at": "timestamp",
    "flashcards_count": {
      "total": "integer",
      "ai_generated": "integer",
      "manual": "integer"
    }
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

#### Delete Account
- **Method**: DELETE
- **URL**: `/users/me`
- **Description**: Delete user account and all associated data
- **Request Body**:
  ```json
  {
    "confirmation": "DELETE MY ACCOUNT" // Security confirmation
  }
  ```
- **Response Body**:
  ```json
  {
    "message": "Account successfully deleted"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized

## 3. Authentication and Authorization

The API will use Supabase Auth for authentication, leveraging JWT tokens:

- **Authentication Flow**:
  1. User registers or logs in via Supabase Auth endpoints
  2. Supabase returns JWT access and refresh tokens
  3. Client includes access token in Authorization header (`Bearer {token}`)
  4. Server validates token for each request
  5. Row Level Security (RLS) policies in Supabase ensure users can only access their own data

- **Token Management**:
  - Access tokens expire after a short period (e.g., 1 hour)
  - Refresh tokens allow obtaining new access tokens
  - Tokens can be revoked for logout/security purposes

- **Authorization**:
  - All endpoints except registration and login require authentication
  - Row Level Security in the database ensures users can only access their own data
  - Backend API adds additional validation where needed

## 4. Validation and Business Logic

### General Validation Rules
- All string inputs must be properly sanitized to prevent injection attacks
- Request bodies should be validated for required fields and proper data types
- Rate limiting should be implemented to prevent abuse

### Resource-Specific Validation

#### Flashcards
- `front` field: Required, string, 1-200 characters
- `back` field: Required, string, 1-500 characters
- `source` field: Must be one of "ai-full", "ai-edited", or "manual"
- User can only access, modify, and delete their own flashcards

#### Generations
- `source_text`: Required, string, 1000-10000 characters
- `model`: Optional, string
- User can only access their own generation records
- Source text must be properly sanitized to prevent injection in AI models

### Business Logic Implementation

1. **Flashcard Generation**:
   - The API will send the source text to the AI service (through OpenRouter.ai)
   - The service will parse AI responses into structured flashcard format
   - Generated flashcards are temporarily stored until user accepts/rejects them
   - Statistics are tracked for analytics purposes

2. **Spaced Repetition Algorithm**:
   - The API will implement a standard spaced repetition algorithm (e.g., SM-2)
   - It will calculate next review times based on user performance ratings
   - Learning session endpoints will retrieve cards due for review

3. **Statistics Tracking**:
   - The API will track metrics on AI generation quality
   - Acceptance rates for generated flashcards will be calculated
   - This data will be used to improve the system and meet success metrics

4. **Error Handling**:
   - AI service errors will be logged for analysis
   - Appropriate error messages will be returned to users
   - The system will implement retries for transient AI service failures
