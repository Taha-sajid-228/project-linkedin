# LinkedIn Clone

A full-stack social networking platform inspired by LinkedIn. The project provides features for user authentication, profiles, posts, social connections, real-time messaging, and administration.

## 🚀 Features

### Authentication
- User registration and login
- JWT-based authentication
- Email/OTP verification
- Forgot password and password reset
- Google/GitHub OAuth authentication
- Login attempt protection

### User Profiles
- Create and manage user profiles
- Profile pictures
- Bio and personal information
- View other users' profiles

### Posts
- Create posts
- Edit posts
- Delete posts
- Archive/unarchive posts
- Like posts
- Comment on posts
- Share posts
- Image/video media support
- Post details and likes list

### Social Networking
- Discover users
- Send friend requests
- Accept/reject friend requests
- Follow/unfollow users
- View friends and connections
- Followers/following lists

### Real-Time Chat
- One-to-one messaging
- Conversation management
- Real-time message delivery using WebSockets
- Message read/delivery status
- Online user connection management

### Admin Panel
- Admin dashboard
- User management
- Post management
- Role-based access control
- Administrative actions

### UI/UX
- Responsive interface
- Reusable React components
- Loading and error states
- Modal-based interactions
- Reusable navigation
- Infinite scrolling

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- WebSockets

### Backend

- FastAPI
- Python
- SQLAlchemy
- Alembic
- PostgreSQL
- JWT
- Passlib

### Storage & Media

- AWS S3
- Cloudinary
- Pillow

### Deployment

- AWS Lightsail
- Docker
- Nginx
- Vercel
- Let's Encrypt / HTTPS
- GitHub

---

## 📁 Project Structure

```text
project-linkedin/
│
├── fastapi-auth/          # Backend
│   ├── routers/
│   ├── models/
│   ├── schemas/
│   ├── migrations/
│   └── ...
│
├── react-app/             # Frontend
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── ...
│   └── ...
│
├── docker-compose.yml
└── README.md
