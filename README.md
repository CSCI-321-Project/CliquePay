# CliquePay: Modern Bill Splitting & Expense Management

![CliquePay Logo](https://img.shields.io/badge/CliquePay-Split%20Bills%20Effortlessly-8b5cf6)

CliquePay is a comprehensive bill splitting and expense management application designed to make financial interactions between friends simple and stress-free. It provides a seamless way to track expenses, split bills, and manage debts with friends, roommates, or any group.

**Live Demo:** [http://18.234.167.115/](http://18.234.167.115/)

## 📌 Table of Contents

- [Features](#features)
- [Technology Stack](#technologies-used)
- [Project Architecture](#project-architecture)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [API Documentation](#api-documentation)
- [Deployment Architecture](#deployment-architecture)

## ✨ Features

- **Group Expenses Management**: Create groups for trips, roommates, or events to track shared expenses
- **Real-time Chat**: Communicate with friends through integrated real-time messaging
- **Secure Transactions**: Bank-level security ensures your financial data stays protected
- **Smart Expense Tracking**: Automatically calculate who owes what and simplify complex group expenses
- **Instant Settlements**: Transfer money instantly between friends with zero fees
- **User-friendly Interface**: Intuitive design makes managing expenses simple for everyone
- **Friend Management System**: Add, remove, and block friends with ease
- **Notification System**: Get real-time updates about payments, group activities, and friend requests
- **Expense Analytics**: Visualize your spending patterns and track group expenses over time
- **Multi-platform Accessibility**: Access your accounts and expenses from any device
## 🛠️ Technologies Used

### 🧑‍💻 Frontend  

- **React 18.2.0**: Modern UI library for building dynamic user interfaces
- **Vite 4.5.0**: Next-generation frontend tooling for faster development
- **TailwindCSS 3.3.5**: Utility-first CSS framework for rapid UI development
- **JavaScript ES6+**: Modern JavaScript with latest language features
- **React Router 6.18.0**: Routing library for React applications
- **Framer Motion 10.16.4**: Production-ready animation library for React
- **Lucide React**: Icon library for crisp, minimal UI elements
- **Shadcn UI**: Customizable UI components with beautiful design
- **Event Source Polyfill**: Enables server-sent events for real-time communication

### 🧠 Backend  
- **Django 4.2.6**: High-level Python web framework for rapid development
- **Django REST Framework 3.14.0**: Toolkit for building Web APIs in Django
- **Python 3.9+**: Powerful programming language with extensive libraries
- **PostgreSQL 15.3**: Advanced open-source relational database
- **Django Channels 4.0.0**: Extends Django to handle WebSockets
- **Redis 7.2**: In-memory data structure store for caching and messaging
- **AWS Cognito**: User authentication, authorization, and management
- **JWT Authentication**: Secure token-based authentication system
- **Boto3 1.26.153**: AWS SDK for Python to interact with AWS services
- **Daphne 4.0.0**: ASGI server for Django Channels applications

### ⚙️ DevOps & Deployment  
- **Docker**: Containerization platform for consistent deployment
- **Nginx**: High-performance web server and reverse proxy
- **AWS EC2**: Cloud computing service for backend and frontend hosting
- **Git**: Version control system for collaborative development
- **ESLint 8.53.0**: Static code analysis tool for identifying problems

## 🏗️ Project Architecture

CliquePay follows a modern client-server architecture with:

1. **Frontend SPA**: A Single Page Application built with React and hosted on Vercel
2. **RESTful API**: Built with Django REST Framework for handling core business logic
3. **Real-time Services**: Implemented using Django Channels and Redis for chat and notifications
4. **Authentication Layer**: AWS Cognito for user management and authentication
5. **Database Layer**: PostgreSQL for persistent data storage
6. **Caching Layer**: Redis for performance optimization
7. **Media Storage**: Cloud storage for profile pictures and other user-uploaded content

### Authentication Flow

1. User registers or logs in through frontend
2. AWS Cognito validates credentials and issues JWT tokens
3. Tokens are stored securely in client-side cookies
4. API calls include JWT tokens for authentication
5. Backend validates tokens before processing requests

## 📊 Database Schema

CliquePay uses a relational database with the following core entities:

1. **User**: Stores user profiles, credentials, and preferences
2. **Friendship**: Manages friend relationships between users
3. **Group**: Represents expense sharing groups (trips, households, etc.)
4. **GroupMember**: Links users to groups with role information
5. **GroupInvitation**: Handles pending group invitations
6. **ChatMessage**: Abstract base for messaging functionality
7. **DirectMessage**: One-to-one messages between users
8. **GroupMessage**: Messages sent within a group
9. **GroupReadReceipt**: Tracks message read status in groups
10. **Expense**: Records financial transactions and payments
11. **ExpenseSplit**: Tracks how expenses are divided between users

Each entity includes appropriate timestamps, relationship constraints, and indexes for performance optimization.



## 🔐 Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **AWS Cognito Integration**: Professional user management and authentication
3. **HTTPS**: End-to-end encryption for data transfers
4. **Input Validation**: Protection against injection attacks
5. **CORS Configuration**: Protection against cross-origin attacks
6. **Secure Storage**: Password hashing and secure data handling
7. **Regular Security Updates**: Continuous security improvements
8. **Session Management**: Proper handling of user sessions

## 📝 API Documentation

CliquePay's API is organized around RESTful principles with the following major endpoints:

### Authentication
- User registration, login, and session management
- Password reset and account recovery
- Token refresh and validation

### User Management
- Profile creation and updates
- Friend requests and management
- Account settings and preferences

### Groups
- Group creation and management
- Member invitations and permissions
- Group settings and deletion

### Expenses
- Expense creation and tracking
- Payment processing and settlement
- Expense history and analytics

### Messaging
- Direct messages between users
- Group chat functionality
- Real-time updates and notifications

All API endpoints follow consistent patterns for request/response formatting, error handling, and authentication requirements.

## 🚀 Deployment Architecture

CliquePay uses a modern cloud deployment setup:

1. **Frontend**: Hosted on Vercel for global CDN distribution
2. **Backend API**: Deployed on AWS EC2 instances
3. **Database**: PostgreSQL on dedicated instances
4. **Cache & Message Broker**: Redis servers
5. **Authentication**: AWS Cognito service
6. **Media Storage**: Cloud storage for user uploads
7. **Load Balancing**: For high availability and scaling
8. **CI/CD Pipeline**: Automated testing and deployment

The system is designed to scale horizontally to accommodate growing user bases and traffic patterns.
### 💻⚙ Tech Stack  
---
<p align="left">
    <p align="left">
        <img src="https://cdn.simpleicons.org/react/61DAFB" height="70" alt="React" />
        <img src="https://cdn.simpleicons.org/vite/646CFF" height="70" alt="Vite" />
        <img src="https://cdn.simpleicons.org/tailwindcss/38B2AC" height="70" alt="Tailwind CSS" />
        <img src="https://cdn.simpleicons.org/javascript/F7DF1E" height="70" alt="JavaScript" />
        <img src="https://cdn.simpleicons.org/reactrouter/CA4245" height="70" alt="React Router" />
        <img src="https://cdn.simpleicons.org/framer/0055FF" height="70" alt="Framer Motion" />
        <img src="https://cdn.simpleicons.org/django/38B2AC" height="70" alt="Django" />
        <img src="https://cdn.simpleicons.org/python/3776AB" height="70" alt="Python" />
        <img src="https://cdn.simpleicons.org/mysql/336791" height="70" alt="MySQL" />
        <img src="https://cdn.simpleicons.org/redis/DC382D" height="70" alt="Redis" />
        <img src="https://cdn.simpleicons.org/jsonwebtokens/000000" height="70" alt="JWT" />
        <img src="https://cdn.simpleicons.org/AmazonWebServices/FF9900" height="70" alt="AWS Cognito" />
        <img src="https://cdn.simpleicons.org/googlecloud" height="70" alt="Google Cloud Storage" />
        <img src="https://cdn.simpleicons.org/ubuntu/E95420?" height="70" alt="Ubuntu" />
        <img src="https://cdn.simpleicons.org/docker/2496ED" height="70" alt="Docker" />
        <img src="https://cdn.simpleicons.org/nginx/009639" height="70" alt="Nginx" />
        <img src="https://cdn.simpleicons.org/amazonec2/FF9900" height="70" alt="AWS EC2" />
        <img src="https://cdn.simpleicons.org/git/F05032" height="70" alt="Git" />
        <img src="https://cdn.simpleicons.org/eslint/4B32C3" height="70" alt="ESLint" />
        <img src="https://cdn.simpleicons.org/lucide" height="70" alt="Lucide" />
    </p>

## 📄 License

CliquePay © 2025. All rights reserved.
