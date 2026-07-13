# 🚀 OpenMart Deployment Guide

Complete guide to deploy OpenMart to production.

## Quick Deployment (2 minutes)

### Vercel (Recommended - Easiest)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/openmart
git push -u origin main
```

2. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Click "Deploy"

3. **Add Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from `.env.example`
   - Redeploy

Your app is now live at `openmart.vercel.app`!

### Netlify

1. **Build locally**
```bash
npm run build
```

2. **Deploy to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Drag and drop the `dist/` folder
   - Done!

3. **Add Environment Variables**
   - In Netlify UI: Build & Deploy → Environment
   - Add all environment variables

## Self-Hosted Deployment

### Prerequisites
- VPS/Server (DigitalOcean, Linode, AWS, etc.)
- Domain name
- SSH access
- Linux (Ubuntu recommended)

### Step-by-Step

#### 1. Prepare Server

```bash
# SSH into your server
ssh root@your_server_ip

# Update system
apt-get update && apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install Nginx
apt-get install -y nginx

# Install PM2 for process management
npm install -g pm2

# Install Git
apt-get install -y git
```

#### 2. Clone and Build

```bash
# Create app directory
mkdir -p /var/www/openmart
cd /var/www/openmart

# Clone your repository
git clone https://github.com/yourusername/openmart .

# Install dependencies
npm install

# Create .env.local
nano .env.local
# Add your environment variables here

# Build for production
npm run build

# Verify build
ls -la dist/
```

#### 3. Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/openmart
```

Paste this config:

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/openmart/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript application/xml+rss;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Route all requests to index.html for SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

Enable the config:
```bash
sudo ln -s /etc/nginx/sites-available/openmart /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Set Up SSL (Free with Let's Encrypt)

```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew
systemctl enable certbot.timer
```

#### 5. Run with PM2

```bash
cd /var/www/openmart

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'openmart',
    script: 'npm',
    args: 'run dev',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Start app
pm2 start ecosystem.config.js

# Make it restart on reboot
pm2 startup
pm2 save
```

Verify it's running:
```bash
pm2 logs openmart
```

#### 6. Set Up Auto-Updates

```bash
# Create update script
nano /var/www/openmart/update.sh
```

```bash
#!/bin/bash
cd /var/www/openmart
git pull origin main
npm install
npm run build
pm2 restart openmart
```

Make executable:
```bash
chmod +x /var/www/openmart/update.sh
```

## Monitoring & Maintenance

### View Logs
```bash
# Application logs
pm2 logs openmart

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Update Application
```bash
cd /var/www/openmart
git pull
npm install
npm run build
pm2 restart openmart
```

### Monitor Performance
```bash
# Real-time monitoring
pm2 monit

# Check resource usage
pm2 describe openmart
```

### Backup Database/Data
```bash
# Export orders as JSON
# (From application UI)

# Manual backup
cp -r /var/www/openmart/dist /backup/openmart-$(date +%Y%m%d)
```

## Environment-Specific Deployment

### Development
- Use `npm run dev`
- Enable source maps
- Verbose logging
- No production optimizations

### Staging
- Same as production but on staging domain
- Test all features before prod
- Use test API keys (Paystack test mode)

### Production
- Use `npm run build`
- All env vars set correctly
- Use live API keys
- Enable all security headers
- Set up monitoring

## Docker Deployment (Advanced)

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Build and Run

```bash
# Build image
docker build -t openmart:latest .

# Run container
docker run -d \
  -p 80:3000 \
  --env-file .env.local \
  --name openmart \
  openmart:latest
```

## Performance Optimization

### Code Splitting
Already implemented with Vite. Monitor bundle size:
```bash
npm run build -- --analyze
```

### Caching Strategy
- Static assets: 30 days cache
- API responses: 5 min cache (if backend added)
- HTML: No cache

### CDN Setup (Optional)
- Cloudflare: Free tier covers most needs
- Bunny CDN: Better for images
- AWS CloudFront: Enterprise option

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Input validation active
- [ ] CORS properly set
- [ ] API keys in env vars (not committed)
- [ ] Rate limiting configured
- [ ] DDoS protection enabled
- [ ] Backups automated

## Troubleshooting

### App won't start
```bash
# Check logs
pm2 logs openmart

# Reinstall dependencies
rm -rf node_modules
npm install
npm run build
```

### Nginx not working
```bash
# Check syntax
sudo nginx -t

# Check if running
sudo systemctl status nginx

# Restart
sudo systemctl restart nginx
```

### SSL certificate expired
```bash
# Renew manually
certbot renew --force-renewal
```

## Scaling Considerations

For future growth:

1. **Database** → Firebase, Supabase, or MongoDB
2. **API** → Node.js + Express backend
3. **Authentication** → Firebase Auth or custom
4. **Payments** → Backend webhook handling
5. **Files** → AWS S3 or Google Cloud Storage
6. **Emails** → SendGrid or similar
7. **Analytics** → Mixpanel or Amplitude

## Cost Estimates

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel | 100GB/month | $20+/month |
| Netlify | Unlimited builds | $19+/month |
| DigitalOcean | None | $4-6/month |
| Cloudflare | Yes | $20+/month |
| Domain | ~₦2,000/year | Same |

---

**Need help? Open an issue or contact support@openmart.com**
