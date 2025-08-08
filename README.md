# Study Tracker Backend API

Express.js backend API for the Study Tracker application with JSON file storage and authentication.

## 🚀 Live Deployment

- **URL**: [Railway](https://web-production-36760.up.railway.app/api)
- **Health Check**: `https://web-production-36760.up.railway.app/api/health`

## 🛠️ Tech Stack

- **Express.js** server
- **JSON file storage** (simple database)
- **Token-based authentication**
- **Railway** for deployment

## 📁 Project Structure

```
backend/
├── server.js            # Main server file
├── database.js          # JSON file database operations
├── package.json         # Dependencies
├── Procfile            # Railway deployment config
└── data.json           # Database file (created automatically)
```

## 🔧 Deployment Configuration

### Railway Settings
- **Repository**: `iagoboson/study-tracker-backend`
- **Root Directory**: `/` (root of backend repo)
- **Start Command**: `npm start`
- **Environment Variables**: None required
- **Database**: JSON file storage (`data.json`)

## 🔗 API Endpoints

Base URL: `https://web-production-36760.up.railway.app/api`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user (requires token)
- `POST /auth/forgot-password` - Password recovery (simulated)

### Study Sessions
- `GET /study-sessions` - Get all sessions (requires token)
- `POST /study-sessions` - Create session (requires token)
- `PUT /study-sessions/:id` - Update session (requires token)
- `DELETE /study-sessions/:id` - Delete session (requires token)
- `GET /study-sessions/stats` - Get statistics (requires token)
- `GET /study-sessions/date/:date` - Get sessions by date (requires token)

### Health Check
- `GET /health` - API health check (public)

## 🔐 Authentication

The API uses simple token-based authentication (not JWT):

```
Authorization: Bearer <token>
```

### Password Security
- **Hashing**: SHA-256 (simple implementation)
- **Storage**: JSON file with hashed passwords
- **Tokens**: Simple random string tokens

## 📊 Data Models

### User
```javascript
{
  id: String,
  name: String,
  email: String,
  password: String (hashed),
  token: String,
  createdAt: String,
  updatedAt: String
}
```

### Study Session
```javascript
{
  id: String,
  userId: String,
  date: String (YYYY-MM-DD),
  duration: Number (minutes),
  notes: String,
  createdAt: String,
  updatedAt: String
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Development
```bash
npm install
npm start
```

### Production
```bash
npm start
```

## 🔄 Development Workflow

### Making Changes
1. Edit files in backend directory
2. Test locally with `npm start`
3. Push to `iagoboson/study-tracker-backend` repository
4. Railway automatically deploys

### Important Files
- `server.js` - Main server and API endpoints
- `database.js` - Database operations
- `data.json` - Database file (auto-created)

## 🐛 Troubleshooting

### Common Issues
1. **Server not starting**: Check `package.json` dependencies
2. **Database errors**: Check `data.json` file permissions
3. **CORS issues**: Verify frontend domain in CORS config

### Logs
- **Railway**: Check deployment logs in Railway dashboard
- **Local**: Check console output

## 📝 Notes

### Database
- **Type**: JSON file storage
- **File**: `data.json` (auto-created)
- **Backup**: Manual download from Railway
- **Limitations**: Not suitable for high concurrency

### Security
- **Authentication**: Simple token-based (not JWT)
- **Password**: SHA-256 hashing
- **CORS**: Configured for Vercel frontend
- **Rate Limiting**: Basic Express rate limiting

### Performance
- **Storage**: File-based (not scalable for large datasets)
- **Concurrency**: Limited by file I/O
- **Recommendation**: Consider MongoDB for production

## 🔄 Future Improvements

- [ ] MongoDB database migration
- [ ] JWT authentication
- [ ] Email service for password recovery
- [ ] Rate limiting improvements
- [ ] Input validation middleware
- [ ] Logging system
- [ ] API documentation (Swagger)

---

**Last Updated**: January 2025
**Repository**: [iagoboson/study-tracker-backend](https://github.com/iagoboson/study-tracker-backend) 