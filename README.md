<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Job Matrix API

A comprehensive job search and recruitment platform API built with NestJS, providing features for job seekers, companies, and administrators.

## Features

### Authentication & Authorization
- **User Registration & Login** - Email/password authentication with OTP verification
- **Google OAuth** - Social authentication support
- **JWT Authentication** - Access and refresh token-based authentication
- **Role-Based Access Control** - Support for Admin, Company Owner, HR, and User roles
- **Password Management** - Forgot password and reset password functionality

### User Management
- User profile management with profile and cover pictures
- Account settings and password updates
- Soft delete functionality
- User search and profile viewing

### Company Management
- Company registration with legal document verification
- Admin approval system for companies
- Company profile management (logo, cover picture, details)
- Company search functionality
- HR management for companies
- Company ban/unban functionality

### Job Management
- Create, update, and delete job postings
- Job filtering and search
- Job status management (open/closed)
- Company-specific job listings

### Application Management
- Apply to jobs with CV upload
- Track application status
- View applications for job postings (HR/Company Owner)
- Update application status

### Real-time Communication
- WebSocket-based chat system
- Real-time messaging between users
- Chat history and conversation management
- Message read status tracking

### Admin Features
- GraphQL admin panel
- View all users and companies
- Approve/ban companies
- Ban/unban users
- System-wide data management

### Additional Features
- File upload to AWS S3 (profile pictures, CVs, company documents)
- Email notifications
- Rate limiting and throttling
- Input validation and error handling
- CORS configuration
- Security headers (Helmet)

## Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **GraphQL**: Apollo Server with NestJS GraphQL
- **Authentication**: Passport JWT, Google OAuth
- **File Storage**: AWS S3
- **Real-time**: Socket.io
- **Email**: Nodemailer
- **Security**: Helmet, bcrypt, JWT
- **Validation**: class-validator, class-transformer
- **Rate Limiting**: @nestjs/throttler

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- AWS Account (for S3 file storage)
- Email service credentials (for email notifications)

##  API Endpoints

### Authentication (`/auth`)
- `POST /auth/signup` - User registration
- `POST /auth/confirm-otp` - Confirm OTP for email verification
- `POST /auth/signin` - User login
- `POST /auth/google/signup` - Google OAuth signup
- `POST /auth/google/login` - Google OAuth login
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
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
- `GET /jobs` - Get all jobs (with filters)
- `GET /jobs/:id` - Get job by ID
- `GET /jobs/companies/:companyId/jobs` - Get jobs by company
- `POST /jobs?companyId=...` - Create job (HR or Owner)
- `PATCH /jobs/:jobId` - Update job (Job Owner)
- `DELETE /jobs/:jobId` - Delete job (Company HR)

### Applications (`/jobs/:jobId/apply`)
- `POST /jobs/:jobId/apply` - Apply to job with CV (User)
- `GET /jobs/:jobId/applications` - Get applications for job (HR or Owner)
- `PATCH /applications/:applicationId` - Update application status (HR or Owner)

### Chat (`/chat`)
- `GET /chat/history/:userId` - Get chat history with user (protected)
- `GET /chat/conversations` - Get all conversations (protected)
- `PATCH /chat/conversations/:conversationId/read` - Mark messages as read (protected)
- `DELETE /chat/conversations/:conversationId` - Delete conversation (protected)

### Assets (`/assets`)
- File upload endpoints for various asset types

### GraphQL (`/graphql`)
- GraphQL Playground available at `/graphql`
- Admin queries and mutations for system management

## Authentication

Most endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### User Roles
- **admin** - Full system access
- **company_owner** - Company management access
- **hr** - HR management within assigned company
- **user** - Standard user access


##  Project Structure

```
src/
├── common/           # Shared utilities, guards, decorators, interceptors
├── config/           # Configuration files
├── modules/          # Feature modules
│   ├── admin/        # Admin GraphQL operations
│   ├── application/  # Job application management
│   ├── assets/       # Asset/file handling
│   ├── auth/         # Authentication & authorization
│   ├── chat/         # Real-time chat system
│   ├── company/      # Company management
│   ├── email/        # Email service
│   ├── job/          # Job posting management
│   ├── notifications/# Notification system
│   ├── otp-cleanup/  # OTP cleanup scheduler
│   └── user/         # User management
├── app.module.ts     # Root application module
├── main.ts           # Application entry point
└── schema.gql        # Generated GraphQL schema
```

##  Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet
- Role-based access control
- File upload validation
