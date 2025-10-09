# Threadit API 🧵

> A feature-rich, backend API for a Reddit clone built with Node.js, Express, and MongoDB. It includes complete user authentication, community management, posts, comments, and a voting system with karma tracking.

This project provides a robust and scalable backend service that powers a social media platform similar to Reddit. It's designed with RESTful principles, secure authentication, and efficient database interactions.

---

### Table of Contents

- [About The Project](#about-the-project)
- [Key Features](#key-features)
- [Live API Documentation](#live-api-documentation-swagger)
- [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints Overview](#api-endpoints-overview)
- [Project Structure](#project-structure)
- [Contact](#contact)

---

### About The Project

Threadit is a comprehensive clone of the popular social media platform Reddit. This project focuses exclusively on the backend API, providing all the necessary endpoints to build a full-featured frontend application.

The primary goal was to create a real-world, portfolio-grade project demonstrating proficiency in:
*   Secure user authentication with JWT and email verification.
*   Complex database schema design with Mongoose.
*   RESTful API design and implementation.
*   Handling media uploads to a cloud service (Cloudinary).
*   Implementing core social media mechanics like communities, posts, nested comments, and voting.

---

### Key Features

-   **👤 User Authentication & Management**
    -   Secure user registration with password hashing (`bcrypt`).
    -   Email verification via One-Time Password (OTP).
    -   JWT-based authentication using secure HTTP-only cookies.
    -   User login and logout.
    -   Ability to upload and update profile pictures.
    -   **Karma System**: User karma automatically updates based on upvotes/downvotes on their posts and comments.

-   **🏠 Community Management**
    -   Create public or private communities (subreddits).
    -   Join public communities instantly.
    -   Request to join private communities, which can be approved by admins.
    -   Community owners have full administrative rights, including deleting the community and its content.

-   **📝 Post & Comment System**
    -   Create posts with a title, body, and optional media (images/videos).
    -   Full CRUD (Create, Read, Update, Delete) functionality for posts and comments.
    -   Only post authors or community admins can edit/delete posts.
    -   Hierarchical commenting system.

-   **⬆️ Voting System**
    -   Upvote and downvote both posts and comments.
    -   The system intelligently handles vote changes: casting a new vote, removing an existing vote, or switching from an upvote to a downvote (and vice versa).

---

### Live API Documentation (Swagger)

This API is fully documented using Swagger UI. Once you have the server running locally, you can access the interactive documentation to view all available endpoints, see their required parameters, and test them directly from your browser.

**Access it here:** [`http://localhost:3000/api-docs`](http://localhost:3000/api-docs)

---

### Built With

This project was built using the following technologies:

| Tech                                                                                                                       | Description                                      |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| ![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)                     | Backend JavaScript runtime environment.          |
| ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)               | Web application framework for Node.js.           |
| ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)                     | NoSQL database for storing data.                 |
| ![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)                  | Object Data Modeling (ODM) library for MongoDB.  |
| ![JWT](https://img.shields.io/badge/JSON%20Web%20Tokens-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)        | For secure user authentication.                  |
| ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)            | For cloud-based media storage and management.    |
| ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=white)                     | For API documentation and testing.               |

---

### Getting Started

To get a local copy up and running, follow these simple steps.

#### Prerequisites

Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v14 or newer)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)
*   [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally, or a connection string to a cloud instance (e.g., MongoDB Atlas).
*   [Git](https://git-scm.com/)

#### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/Adam556678/threadit.git
    ```

2.  **Navigate to the project directory:**
    ```sh
    cd threadit
    ```

3.  **Install NPM packages:**
    ```sh
    npm install
    ```

4.  **Set up your environment variables:**
    -   Create a new file named `.env` in the root of the project.
    -   Copy the contents of `.env.example` (or the block below) into your new `.env` file and fill in your own values.

    ```env
    # Server Configuration
    PORT=3000

    # MongoDB Connection
    MONGO_URI=your_mongodb_connection_string

    # JWT Secret
    JWT_SECRET=your_super_secret_key_for_jwt

    # Cloudinary Credentials for media uploads
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret

    # Email Credentials for OTP verification (e.g., using nodemailer)
    EMAIL_HOST=your_smtp_host
    EMAIL_PORT=your_smtp_port
    EMAIL_USER=your_email_address
    EMAIL_PASS=your_email_password
    ```

5.  **Start the server:**
    ```sh
    npm start
    ```
    Your API should now be running on `http://localhost:3000`.

---

### Environment Variables

These are the environment variables required to run the application.

| Variable              | Description                                                                              | Example                                     |
| --------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------- |
| `PORT`                | The port on which the Express server will run.                                           | `3000`                                      |
| `MONGO_URI`           | The connection string for your MongoDB database.                                         | `mongodb://localhost:27017/threadit`        |
| `JWT_SECRET`          | A long, random, and secret string used to sign JSON Web Tokens.                          | `aVeryLongAndRandomSecretString123!`        |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name.                                                              | `dxabc123`                                  |
| `CLOUDINARY_API_KEY`    | Your Cloudinary API key.                                                                 | `123456789012345`                           |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret.                                                              | `aBcDeFgHiJkLmNoPqRsTuVwXyZ_12345`           |
| `EMAIL_HOST`          | SMTP host for sending emails (e.g., for OTPs).                                           | `smtp.gmail.com`                            |
| `EMAIL_PORT`          | SMTP port (usually 587 for TLS).                                                         | `587`                                       |
| `EMAIL_USER`          | The email address to send verification emails from.                                      | `noreply@threadit.com`                      |
| `EMAIL_PASS`          | The password or app-specific password for the email account.                             | `your-email-password`                       |

---

### API Endpoints Overview

The following is a high-level overview of the available API routes. For detailed information on request bodies, parameters, and responses, please refer to the [Swagger documentation](#live-api-documentation-swagger).

| Method | Endpoint                          | Description                                         | Authentication |
| ------ | --------------------------------- | --------------------------------------------------- | :------------: |
| `POST` | `/users/signup`                   | Register a new user.                                |      -         |
| `POST` | `/users/verify`                   | Verify user email with OTP.                         |      -         |
| `POST` | `/users/login`                    | Log in a user and receive a JWT cookie.             |      -         |
| `GET`  | `/users/logout`                   | Log out the current user.                           |      -         |
| `PATCH`| `/users/upload-pfp`               | Upload or update the user's profile picture.        |      ✅        |
| `POST` | `/communities`                    | Create a new community.                             |      ✅        |
| `GET`  | `/communities`                    | Get a list of all communities.                      |      ✅        |
| `POST` | `/communities/:id/join`           | Join a community or request to join a private one.  |      ✅        |
| `POST` | `/communities/:id/add-post`       | Add a new post to a specific community.             |      ✅        |
| `GET`  | `/communities/:id/posts`          | Get all posts within a community.                   |      ✅        |
| `GET`  | `/posts/:postId`                  | Get details of a single post.                       |      ✅        |
| `POST` | `/posts/:postId/add-comment`      | Add a comment to a post.                            |      ✅        |
| `POST` | `/votes/vote`                     | Cast an upvote or downvote on a post or comment.    |      ✅        |

---
### Project Structure

The project follows a standard and scalable structure for an Express.js application, separating concerns into distinct directories.

```plaintext
threadit/
├── server/
│   ├── config/
│   │   ├── cloudinary.js       # Cloudinary configuration for media uploads
│   │   └── db.js               # MongoDB database connection logic
│   │
│   ├── helpers/
│   │   ├── hash.js             # Password hashing and comparison functions
│   │   ├── otp_verification.js # OTP generation and email sending logic
│   │   └── validators.js       # Helper functions for input validation
│   │
│   ├── middlewares/
│   │   ├── auth.js             # JWT authentication middleware to protect routes
│   │   ├── joined.js           # Verifies if a user is a member of a community
│   │   ├── upload.js           # Multer configuration for handling file uploads
│   │   └── ...and other custom middlewares
│   │
│   ├── models/
│   │   ├── User.js             # User schema and model
│   │   ├── Community.js        # Community schema and model
│   │   ├── Post.js             # Post schema and model
│   │   ├── Comment.js          # Comment schema and model
│   │   ├── Vote.js             # Vote schema and model
│   │   └── UserOTP.js          # Schema for storing user OTPs for verification
│   │
│   └── routes/
│       ├── user.js             # Routes for user authentication and management
│       ├── community.js        # Routes for community and post management
│       ├── post.js             # Routes for comments and post details
│       └── vote.js             # Routes for the voting system
│
├── app.js                      # Main Express application file (entry point)
├── package.json                # Project dependencies and scripts
└── .env                        # Environment variables (ignored by git)
```