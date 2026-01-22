<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>


# Job Matrix API

A comprehensive job search and recruitment platform API built with NestJS, providing a complete backend solution for connecting job seekers, companies, and administrators. The platform enables seamless job posting, application management, real-time communication, and administrative oversight.

## Project Description

Job Matrix API is a full-featured RESTful and GraphQL API designed to power modern job search and recruitment platforms. It provides robust authentication, role-based access control, job management, application tracking, real-time chat capabilities, and comprehensive administrative tools. The API supports multiple user roles (Admin, Company Owner, HR, and regular Users) and includes features like OTP verification, Google OAuth integration, file uploads to AWS S3, and WebSocket-based real-time messaging.

## Tech Stack

### Backend
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Runtime**: Node.js

### Database
- **Database**: MongoDB
- **ODM**: Mongoose 7.x

### API & Communication
- **REST API**: Express.js (via NestJS)
- **GraphQL**: Apollo Server with NestJS GraphQL
- **Real-time**: Socket.io 4.x

### Authentication & Security
- **Authentication**: Passport.js with JWT strategy
- **OAuth**: Google OAuth 2.0
- **Password Hashing**: bcrypt
- **Security Headers**: Helmet
- **Rate Limiting**: @nestjs/throttler

### File Storage & Services
- **Cloud Storage**: AWS S3
- **Email Service**: Nodemailer

### Validation & Utilities
- **Validation**: class-validator, class-transformer
- **Configuration**: @nestjs/config with Joi validation

### Development Tools
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest
- **Task Scheduling**: @nestjs/schedule

## Key Features

### Authentication & Authorization
- User registration with email/password and OTP verification
- Google OAuth 2.0 integration for social authentication
- JWT-based authentication with access and refresh tokens
- Role-based access control (Admin, Company Owner, HR, User)
- Password reset functionality with OTP verification
- Secure token refresh mechanism

### User Management
- Complete user profile management
- Profile and cover picture uploads
- Account settings and password updates
- Soft delete functionality
- User search and profile viewing
- Encrypted mobile number storage

### Company Management
- Company registration with legal document verification
- Admin approval system for company accounts
- Company profile management (logo, cover picture, company details)
- Company search functionality
- HR management within companies
- Company ban/unban functionality by administrators

### Job Management
- Create, update, and delete job postings
- Advanced job filtering (location, working time, seniority level, technical skills)
- Job status management (open/closed)
- Company-specific job listings
- Job search with multiple filter criteria
- Pagination support for job listings

### Application Management
- Apply to jobs with CV upload
- Track application status
- View applications for job postings (HR/Company Owner)
- Update application status (pending, accepted, rejected)
- Application history tracking

### Real-time Communication
- WebSocket-based chat system
- Real-time messaging between users
- Chat history and conversation management
- Message read status tracking
- Conversation deletion
- User presence tracking

### Admin Features
- GraphQL admin panel with Apollo Playground
- View all users and companies
- Approve/ban companies
- Ban/unban users
- System-wide data management
- Comprehensive admin queries and mutations

### Additional Features
- File upload to AWS S3 (profile pictures, CVs, company documents)
- Email notifications for OTP and password resets
- Rate limiting and API throttling
- Comprehensive input validation and error handling
- CORS configuration
- Security headers with Helmet
- Scheduled OTP cleanup tasks
- Global exception filtering
- Response interceptors for consistent API responses

## Project Structure

```
src/
├── common/                    # Shared utilities and cross-cutting concerns
│   ├── decorators/           # Custom decorators (current-user, refresh-token)
│   ├── filters/              # Exception filters
│   ├── guards/               # Authentication and authorization guards
│   ├── interceptors/         # Response interceptors
│   ├── services/            # Shared services (S3 service)
│   ├── utils/               # Utility functions (JWT, OTP, crypto, pagination)
│   └── validators/          # Custom validators
├── config/                   # Configuration files
│   ├── database.config.ts   # MongoDB connection configuration
│   ├── env.config.ts        # Environment variables configuration
│   ├── jwt.config.ts        # JWT configuration
│   └── multer.config.ts     # File upload configuration
├── modules/                  # Feature modules
│   ├── admin/               # Admin GraphQL operations
│   ├── application/         # Job application management
│   ├── assets/              # Asset/file handling
│   ├── auth/                # Authentication & authorization
│   ├── chat/                # Real-time chat system
│   ├── company/             # Company management
│   ├── email/               # Email service
│   ├── job/                 # Job posting management
│   ├── notifications/       # Notification system
│   ├── otp-cleanup/         # OTP cleanup scheduler
│   └── user/                # User management
├── app.module.ts            # Root application module
├── main.ts                  # Application entry point
└── schema.gql               # Generated GraphQL schema
```

## How the Project Works

### High-Level Workflow

1. **Application Bootstrap**: The application starts in `main.ts`, which initializes NestJS, configures global pipes, interceptors, filters, CORS, and security headers.

2. **Module Architecture**: The application follows NestJS modular architecture, with each feature encapsulated in its own module (auth, user, company, job, application, chat, etc.).

3. **Authentication Flow**:
   - Users register with email/password or Google OAuth
   - OTP is sent for email verification
   - Upon verification, users receive JWT access and refresh tokens
   - Protected routes use JWT guards to validate tokens
   - Role-based guards enforce permissions based on user roles

4. **Request Flow**:
   - Requests enter through controllers
   - Guards validate authentication and authorization
   - DTOs validate and transform input data
   - Services contain business logic
   - Repositories handle database operations
   - Responses are standardized through interceptors

5. **Real-time Communication**:
   - WebSocket gateway handles chat connections
   - JWT authentication validates socket connections
   - Messages are stored in MongoDB
   - Real-time events are emitted to connected clients

6. **File Management**:
   - Files are uploaded via multipart/form-data
   - Files are validated and uploaded to AWS S3
   - File URLs are stored in the database
   - Files can be deleted from S3 when removed

7. **Admin Operations**:
   - GraphQL endpoint provides admin queries and mutations
   - Admin guards restrict access to administrators
   - Comprehensive data retrieval and management operations


## API Endpoints

### Authentication (`/auth`)
- `POST /auth/signup` - User registration
- `POST /auth/confirm-otp` - Confirm OTP for email verification
- `POST /auth/signin` - User login
- `POST /auth/google/signup` - Google OAuth signup
- `POST /auth/google/login` - Google OAuth login
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with OTP
- `POST /auth/refresh-token` - Refresh access token

### Users (`/users`)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `GET /users/profile/:id` - Get user profile data
- `GET /users/account/me` - Get current user account (protected)
- `PATCH /users/account/me` - Update current user account (protected)
- `PUT /users/account/password` - Update password (protected)
- `POST /users/account/profile-pic` - Upload profile picture (protected)
- `POST /users/account/cover-pic` - Upload cover picture (protected)
- `DELETE /users/account/profile-pic` - Delete profile picture (protected)
- `DELETE /users/account/cover-pic` - Delete cover picture (protected)
- `DELETE /users/account/me` - Soft delete account (protected)

### Companies (`/companies`)
- `POST /companies` - Create company (protected)
- `GET /companies/search?name=...` - Search companies by name
- `GET /companies/:id/jobs` - Get company with jobs
- `PATCH /companies/:id` - Update company (Company Owner only)
- `DELETE /companies/:id` - Delete company (Admin or Owner)
- `POST /companies/:id/logo` - Upload company logo (Company Owner)
- `POST /companies/:id/cover` - Upload cover picture (Company Owner)
- `DELETE /companies/:id/logo` - Delete logo (Company Owner)
- `DELETE /companies/:id/cover` - Delete cover picture (Company Owner)

### Jobs (`/jobs`)
- `GET /jobs` - Get all jobs (with filters: jobTitle, jobLocation, workingTime, seniorityLevel, technicalSkills, companyId, companyName, closed)
- `GET /jobs/:id` - Get job by ID
- `GET /jobs/companies/:companyId/jobs` - Get jobs by company
- `POST /jobs?companyId=...` - Create job (HR or Owner)
- `PATCH /jobs/:jobId` - Update job (Job Owner)
- `DELETE /jobs/:jobId` - Delete job (Company HR)

### Applications (`/applications`)
- `POST /jobs/:jobId/apply` - Apply to job with CV (User)
- `GET /jobs/:jobId/applications` - Get applications for job (HR or Owner)
- `PATCH /applications/:applicationId` - Update application status (HR or Owner)

### Chat (`/chat`)
- `GET /chat/history/:userId` - Get chat history with user (protected)
- `GET /chat/conversations` - Get all conversations (protected)
- `PATCH /chat/conversations/:conversationId/read` - Mark messages as read (protected)
- `DELETE /chat/conversations/:conversationId` - Delete conversation (protected)

### GraphQL (`/graphql`)
- GraphQL Playground available at `/graphql`
- Admin queries and mutations for system management

### Authentication

Most endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

> For complete API documentation [API Documentation](https://www.postman.com/maintenance-candidate-2675300/workspace/public-workspace/collection/45449526-802b2f33-5050-46e3-81e5-a999697e6728?action=share&creator=45449526&active-environment=45449526-c3ef379c-add5-4408-90b5-3407db5366fb).

### User Roles

- **Admin** - Full system access, can manage all users and companies
- **Company Owner** - Can manage their company, jobs, and applications
- **HR** - Can manage jobs and applications within their assigned company
- **User** - Standard user access, can apply to jobs and manage profile
