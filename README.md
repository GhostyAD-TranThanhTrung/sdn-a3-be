# Assignment 3 SDN - Backend Deployment on Vercel

## Environment Variables Required

When deploying to Vercel, you need to set these environment variables in your Vercel dashboard:

1. **MONGO_URI** - Your MongoDB Atlas connection string
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database_name?retryWrites=true&w=majority&appName=Cluster0
   ```
2. **JWT_SECRET** - A strong secret key for JWT tokens
3. **FRONTEND_URL** - URL of your deployed frontend (e.g., https://sdn-a4-frontend2.vercel.app)
4. **NODE_ENV** - Set to `production`

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment template and configure:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your actual values:

   ```
   MONGO_URI=mongodb+srv://your_user:your_password@cluster0.xxxxx.mongodb.net/SDN_Assignment3?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your_jwt_secret
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

✅ **MongoDB Atlas Already Configured** - Your database is ready to use!

1. **Update Vercel Environment Variables**:
   Go to your Vercel project dashboard and update these variables:

   ```
   MONGO_URI=mongodb+srv://tranthanhtrung2015_db_user:eLD5saGINDW9e1Dy@cluster0.pwhlg9v.mongodb.net/SDN_Assignment3?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=helloworasdasdknl124jljsfdsfasdld
   FRONTEND_URL=https://sdn-a4-frontend2.vercel.app
   NODE_ENV=production
   ```

2. **Deploy to Vercel**:

   ```bash
   git add .
   git commit -m "Update MongoDB Atlas connection"
   git push
   ```

   Vercel will automatically redeploy with the new database connection.

3. **Verify Connection**:
   - Visit your deployed backend URL
   - Check the status page for database connection status
   - Look for "✅ Connected" in the database status section

## API Endpoints

- `GET /` - Server status page with database connection status (web interface)
- `GET /health` - JSON health check endpoint with detailed system status
- `POST /users/register` - User registration
- `POST /users/login` - User login
- `GET /quizzes` - Get all quizzes
- `POST /quizzes` - Create quiz (authenticated)
- `GET /quizzes/:id` - Get quiz by ID
- `PUT /quizzes/:id` - Update quiz (authenticated)
- `DELETE /quizzes/:id` - Delete quiz (authenticated)

## Database Connection Monitoring

The application includes built-in database monitoring that you can check on Vercel:

1. **Web Status Page** (`GET /`):
   - Visit your Vercel URL to see a formatted status page
   - Shows real-time database connection status with visual indicators
   - Displays server uptime and environment information
   - Lists all available API endpoints

2. **JSON Health Check** (`GET /health`):
   - Returns detailed JSON health status
   - Includes database connection state, server uptime, and timestamps
   - Returns HTTP 200 for healthy, 503 for unhealthy
   - Useful for monitoring tools and automated health checks

3. **Connection States**:
   - ✅ Connected: Database is connected and ready
   - 🔄 Connecting: Database connection in progress
   - ❌ Disconnected: Database connection failed
   - ⚠️ Disconnecting: Database is disconnecting

## CORS Configuration

The app is configured to accept requests from:

- `http://localhost:5173` (local development)
- `http://localhost:3000` (alternative local port)
- The URL specified in `FRONTEND_URL` environment variable
