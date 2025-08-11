# PDFToolkit Deployment Security Guide

## 🔐 Security Measures for Production Deployment

When deploying PDFToolkit to Railway/Render (backend) and Vercel (frontend), implement these security measures:

### 1. API Key Authentication

The application now uses two levels of API keys:

- **API_KEY**: Required for general PDF operations (upload, create, download)
- **ADMIN_API_KEY**: Required for cleanup operations and admin endpoints

#### Usage:
```bash
# For PDF operations
curl -H "X-API-Key: your-api-key" https://your-api.railway.app/api/upload

# For cleanup operations  
curl -H "X-API-Key: your-admin-key" https://your-api.railway.app/api/cleanup/stats
```

### 2. Environment Variables Setup

#### For Railway/Render (Backend):
```bash
API_KEY=your-super-secret-api-key-here
ADMIN_API_KEY=your-admin-secret-key-here
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
ENVIRONMENT=production
CLEANUP_INTERVAL_MINUTES=1440
MAX_FILE_AGE_MINUTES=2880
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
```

#### For Vercel (Frontend):
```bash
NEXT_PUBLIC_API_URL=https://your-api.railway.app
NEXT_PUBLIC_API_KEY=your-super-secret-api-key-here
```

### 3. CORS Configuration

The backend automatically configures CORS based on the `ALLOWED_ORIGINS` environment variable:
- Set this to your Vercel frontend URL
- Multiple origins can be comma-separated

### 4. Rate Limiting

Built-in rate limiting prevents abuse:
- Default: 100 requests per hour per IP
- Configurable via environment variables
- Returns 429 status when exceeded

### 5. Protected Endpoints

#### Public Endpoints (no authentication):
- `GET /` - Welcome message
- `GET /api/health` - Health check
- `GET /api/version` - API version

#### API Key Protected:
- `POST /api/upload` - Upload PDFs
- `POST /api/create-pdf` - Create merged PDFs
- `GET /api/download/{result_id}` - Download results
- `GET /api/result/{result_id}` - Get result info

#### Admin Key Protected:
- `GET /api/cleanup/stats` - File statistics
- `POST /api/cleanup/old-files` - Manual cleanup
- `POST /api/cleanup/all-files` - Delete all files

### 6. Frontend Security

Update your frontend to include the API key in requests:

```typescript
// lib/api.ts
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

### 7. Additional Security Recommendations

1. **Use HTTPS Only**: Both Railway and Vercel provide HTTPS by default
2. **Regular Key Rotation**: Change API keys periodically
3. **Monitor Usage**: Check logs for suspicious activity
4. **File Size Limits**: FastAPI has built-in file size limits
5. **Cleanup Schedule**: Enable automatic cleanup to prevent disk space issues

### 8. Deployment Commands

#### Railway:
```bash
# Connect to Railway
railway login
railway link

# Set environment variables
railway variables set API_KEY=your-secret-key
railway variables set ADMIN_API_KEY=your-admin-key
railway variables set ALLOWED_ORIGINS=https://your-app.vercel.app

# Deploy
railway up
```

#### Vercel:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod

# Set environment variables in Vercel dashboard
```

### 9. Testing Security

Test your deployed API:

```bash
# Should fail without API key
curl https://your-api.railway.app/api/upload

# Should succeed with API key
curl -H "X-API-Key: your-key" https://your-api.railway.app/api/version

# Admin endpoint should require admin key
curl -H "X-API-Key: regular-key" https://your-api.railway.app/api/cleanup/stats
# Should return 403 Forbidden
```

### 10. Monitoring

- Monitor API usage through Railway/Render dashboards
- Set up alerts for high error rates
- Check cleanup logs for file management
- Monitor disk usage to prevent storage issues

## 🚨 Security Checklist

- [ ] Changed default API keys
- [ ] Set production CORS origins
- [ ] Enabled cleanup scheduler
- [ ] Set appropriate rate limits
- [ ] Updated frontend to use API keys
- [ ] Tested all endpoints
- [ ] Configured HTTPS
- [ ] Set up monitoring
