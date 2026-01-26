# StudyBuddy 📚

A modern, real-time collaborative study platform built with Django and React. StudyBuddy helps students connect, organize study groups, manage tasks, and communicate effectively through an intuitive interface.

![StudyBuddy](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Django](https://img.shields.io/badge/Django-5.2.7-green.svg)
![React](https://img.shields.io/badge/React-18.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🎯 Core Functionality
- **Real-time Chat**: WebSocket-powered messaging with file and image sharing
- **Study Groups**: Create and manage collaborative study groups
- **Task Management**: Organize and track study tasks with deadlines
- **User Profiles**: Customizable profiles with avatars and bio
- **Notifications**: Real-time notifications for messages, tasks, and group activities
- **Analytics**: Track study hours and progress

### 🎨 Modern UI/UX
- Dark theme with glassmorphism effects
- Responsive design for all devices
- Smooth animations and transitions
- Intuitive navigation and user experience

### 🔒 Security
- JWT-based authentication
- Secure WebSocket connections
- Token refresh mechanism
- Protected routes and API endpoints

## 🏗️ Architecture

### Backend (Django)
```
backend/
├── studybuddy/          # Main project settings
├── accounts/            # User authentication & profiles
├── Message/             # Chat & messaging system
├── group/               # Study groups management
├── Tasks/               # Task & study session tracking
├── Notifications/       # Real-time notifications
└── common/              # Shared utilities
```

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── api/            # API service layer
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # Business logic
│   └── types/          # TypeScript definitions
```

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Redis**: For WebSocket support (optional for development)

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (optional)
EMAIL_FROM=noreply@studybuddy.com
RESEND_API_KEY=your-resend-api-key
CLIENT_URL=http://localhost:5173
EMAIL_FROM_NAME=StudyBuddy
```

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server**
   ```bash
   # For WebSocket support
   daphne studybuddy.asgi:application
   
   # Or standard Django server (no WebSocket)
   python manage.py runserver
   ```

   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

4. **Build for production**
   ```bash
   npm run build
   ```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | User login |
| POST | `/api/auth/register/` | User registration |
| POST | `/api/auth/token/refresh/` | Refresh JWT token |
| GET | `/api/auth/users/me/` | Get current user |
| PUT | `/api/auth/users/me/` | Update user profile |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations/` | List conversations |
| GET | `/api/messages/conversations/{id}/messages/` | Get messages |
| POST | `/api/messages/conversations/` | Create conversation |
| POST | `/api/messages/send/` | Send message |

### Groups Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/group/groups/` | List groups |
| POST | `/api/group/groups/` | Create group |
| GET | `/api/group/groups/{id}/` | Get group details |
| GET | `/api/group/groups/{id}/members/` | List group members |

### Tasks Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/Tasks/tasks/` | List tasks |
| POST | `/api/Tasks/tasks/` | Create task |
| GET | `/api/Tasks/study-resources/` | List study resources |
| GET | `/api/Tasks/study-sessions/` | List study sessions |

### Notifications Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/Notifications/all/` | List all notifications |
| GET | `/api/Notifications/unread/` | List unread notifications |
| PUT | `/api/Notifications/{id}/mark-read/` | Mark as read |

## 🔌 WebSocket Connection

Connect to WebSocket for real-time chat:

```javascript
const ws = new WebSocket(
  `ws://localhost:8000/ws/chat/?token=${yourJWTToken}`
);
```

### WebSocket Message Format

**Send Message:**
```json
{
  "type": "chat_message",
  "conversation_id": 1,
  "message": "Hello!",
  "message_type": "text"
}
```

**Send File:**
```json
{
  "type": "file_message",
  "conversation_id": 1,
  "file_data": "base64_encoded_file",
  "file_name": "document.pdf",
  "file_type": "application/pdf"
}
```

## 🛠️ Tech Stack

### Backend
- **Django 5.2.7** - Web framework
- **Django REST Framework** - API development
- **Django Channels** - WebSocket support
- **Daphne** - ASGI server
- **SimpleJWT** - JWT authentication
- **Cloudinary** - File storage
- **Pillow** - Image processing

### Frontend
- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Lucide React** - Icons
- **TailwindCSS** - Styling
- **date-fns** - Date utilities

## 📁 Project Structure

### Key Files

- **Backend**
  - `studybuddy/settings.py` - Django settings
  - `studybuddy/asgi.py` - ASGI configuration
  - `Message/consumers.py` - WebSocket handlers
  - `Message/routing.py` - WebSocket routing

- **Frontend**
  - `src/App.tsx` - Main app component
  - `src/api/` - API service layer
  - `src/contexts/AuthContext.tsx` - Authentication context
  - `src/hooks/useWebsocket.ts` - WebSocket hook

## 🎯 Usage

### Creating a Study Group

1. Navigate to Dashboard
2. Click "New Group" button
3. Fill in group details (name, description)
4. Invite members
5. Start collaborating!

### Sending Messages

1. Select a conversation from the sidebar
2. Type your message in the input field
3. Press Enter or click Send
4. Attach files using the paperclip icon

### Managing Tasks

1. Navigate to Tasks page
2. Click "Add Task" button
3. Set task details and deadline
4. Track progress and mark complete

## 🔧 Development

### Running Tests

**Backend:**
```bash
cd backend
python manage.py test
```

**Frontend:**
```bash
cd frontend
npm run test
```

### Code Quality

**Backend:**
```bash
# Format code
black .

# Lint
flake8
```

**Frontend:**
```bash
# Type check
npm run type-check

# Lint
npm run lint
```

## 🚢 Deployment

### Backend Deployment

1. Set `DEBUG=False` in settings
2. Configure `ALLOWED_HOSTS`
3. Set up production database (PostgreSQL recommended)
4. Configure Redis for channels
5. Collect static files: `python manage.py collectstatic`
6. Use Gunicorn + Daphne for production

### Frontend Deployment

1. Build the app: `npm run build`
2. Deploy `dist/` folder to static hosting (Vercel, Netlify, etc.)
3. Configure environment variables for API URL

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Your Name** - Initial work

## 🙏 Acknowledgments

- Django and React communities
- All contributors and testers
- Open source libraries used in this project

## 📞 Support

For support, email support@studybuddy.com or open an issue in the repository.

---

**Built with ❤️ by the StudyBuddy Team**
