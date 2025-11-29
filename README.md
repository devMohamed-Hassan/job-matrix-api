# Job Search Platform

A comprehensive job search platform built with NestJS, TypeScript, and MongoDB.

## Features

- User authentication and authorization
- Company management
- Job posting and management
- Application tracking
- Real-time chat functionality
- Admin panel

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Access & Refresh Tokens)
- **File Storage**: Cloudinary
- **Validation**: class-validator, class-transformer
- **Configuration**: @nestjs/config with Joi validation

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   NODE_ENV=development
   ```

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Project Structure

```
src/
├── config/          # Configuration files
├── common/          # Shared utilities, guards, interceptors, pipes, decorators
├── modules/         # Feature modules
│   ├── auth/        # Authentication module
│   ├── user/        # User management
│   ├── company/     # Company management
│   ├── job/         # Job posting and management
│   ├── application/ # Application tracking
│   ├── chat/        # Real-time messaging
│   └── admin/       # Admin panel
└── main.ts          # Application entry point
```

## License

MIT

