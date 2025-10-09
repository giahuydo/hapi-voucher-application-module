# 🚀 Hướng dẫn Deploy lên Render

## 📋 Chuẩn bị

### 1. Database Services
Bạn cần tạo các service sau trên Render:

#### MongoDB Atlas (Recommended)
- Truy cập [MongoDB Atlas](https://www.mongodb.com/atlas)
- Tạo cluster miễn phí
- Lấy connection string

#### Redis (Render Redis)
- Trên Render Dashboard, tạo Redis service
- Lấy connection details

### 2. Environment Variables cần thiết

```bash
# Application
NODE_ENV=production
PORT=10000
APP_URL=https://your-app-name.onrender.com

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/voucher_app

# Redis
REDIS_HOST=your-redis-host.onrender.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Security (QUAN TRỌNG - PHẢI THAY ĐỔI!)
JWT_SECRET=your-super-secure-production-jwt-secret-key-here-must-be-at-least-32-chars

# Email
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Voucher App <no-reply@voucherapp.com>
EMAIL_REPLY_TO=support@voucherapp.com

# Logging
LOG_LEVEL=warn
CORS_ORIGIN=*
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
```

## 🔧 Cách Deploy

### Phương pháp 1: Sử dụng render.yaml (Recommended)

1. **Push code lên GitHub**
   ```bash
   git add .
   git commit -m "Add Render deployment config"
   git push origin main
   ```

2. **Tạo Web Service trên Render**
   - Truy cập [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Chọn repository này
   - Render sẽ tự động detect `render.yaml`

3. **Cấu hình Environment Variables**
   - Vào Settings → Environment
   - Thêm tất cả variables từ danh sách trên
   - **QUAN TRỌNG**: Thay đổi `JWT_SECRET` thành một chuỗi bí mật mạnh

4. **Tạo Worker Service**
   - Click "New +" → "Background Worker"
   - Chọn cùng repository
   - Cấu hình environment variables tương tự
   - Start Command: `npm run worker`

### Phương pháp 2: Manual Setup

1. **Tạo Web Service**
   - Name: `hapi-voucher-app`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Health Check Path: `/`

2. **Tạo Worker Service**
   - Name: `hapi-voucher-worker`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run worker`

## 🔍 Kiểm tra Deployment

### Health Check
```bash
curl https://your-app-name.onrender.com/
```

### API Documentation
```
https://your-app-name.onrender.com/docs
```

### Telescope Dashboard
```
https://your-app-name.onrender.com/telescope
```

## 🛠️ Troubleshooting

### Lỗi thường gặp:

1. **Build failed**
   - Kiểm tra Node.js version (cần 18+)
   - Kiểm tra TypeScript compilation

2. **Database connection failed**
   - Kiểm tra MONGO_URI
   - Kiểm tra network access trong MongoDB Atlas

3. **Redis connection failed**
   - Kiểm tra REDIS_HOST và REDIS_PASSWORD
   - Kiểm tra Redis service status

4. **Email không hoạt động**
   - Kiểm tra EMAIL_USER và EMAIL_PASS
   - Sử dụng App Password cho Gmail

### Logs
- Vào Render Dashboard → Service → Logs
- Kiểm tra build logs và runtime logs

## 📊 Monitoring

### Health Checks
- Endpoint: `GET /`
- Render sẽ tự động monitor

### Metrics
- Endpoint: `GET /metrics` (nếu enabled)

## 🔒 Security Checklist

- [ ] Thay đổi JWT_SECRET
- [ ] Cấu hình CORS_ORIGIN phù hợp
- [ ] Sử dụng HTTPS
- [ ] Cấu hình rate limiting
- [ ] Kiểm tra security headers

## 💰 Cost Optimization

### Free Tier Limits
- 750 hours/month cho Web Service
- 750 hours/month cho Worker
- 1GB RAM limit
- Sleep sau 15 phút không hoạt động

### Upgrade Options
- Starter Plan: $7/month
- Standard Plan: $25/month
- Pro Plan: $85/month

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra Render logs
2. Kiểm tra application logs
3. Test locally với production config
4. Liên hệ Render support
