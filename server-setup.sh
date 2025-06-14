#!/bin/bash
# 🚀 Yumi Website Builder - Server Setup Script
# Run this on your DigitalOcean droplet

echo "🌟 Setting up Yumi Website Builder Backend on api.yumi77965.online"
echo "======================================================================="

# 1. System Updates
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Install Node.js 18
echo "🟢 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 3. Install nginx, certbot
echo "🌐 Installing nginx and certbot..."
apt-get install -y nginx certbot python3-certbot-nginx

# 4. Install PM2 globally
echo "⚙️ Installing PM2 process manager..."
npm install -g pm2

# 5. Clone repository
echo "📥 Cloning repository..."
cd /opt
git clone https://github.com/richardmuz9/rrrichardzengyumi.git
cd rrrichardzengyumi/backend

# 6. Install dependencies and build
echo "🔨 Installing dependencies and building..."
npm install
npm run build

# 7. Create environment file
echo "🔧 Creating environment file..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
QWEN_API_KEY=your-qwen-api-key-here
OPENROUTER_API_KEY=your-openrouter-api-key-here
FRONTEND_URL=https://yumi77965.online
EOF

echo "⚠️  IMPORTANT: Edit /opt/rrrichardzengyumi/backend/.env with your actual API keys!"

# 8. Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start dist/index.js --name "yumi-backend"
pm2 startup
pm2 save

# 9. Create nginx configuration
echo "🌐 Creating nginx configuration..."
cat > /etc/nginx/sites-available/api.yumi77965.online << 'EOF'
server {
    listen 80;
    server_name api.yumi77965.online;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

# 10. Enable nginx site
echo "🔗 Enabling nginx site..."
ln -s /etc/nginx/sites-available/api.yumi77965.online /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 11. Setup SSL with certbot
echo "🔒 Setting up SSL certificate..."
certbot --nginx -d api.yumi77965.online --non-interactive --agree-tos --email admin@yumi77965.online

# 12. Test the setup
echo "🧪 Testing the setup..."
sleep 5
curl -k https://api.yumi77965.online/health

echo ""
echo "🎉 Setup complete!"
echo "======================================================================="
echo "✅ Backend API: https://api.yumi77965.online"
echo "✅ Health check: https://api.yumi77965.online/health"
echo "✅ Frontend: https://yumi77965.online (GitHub Pages)"
echo ""
echo "🔧 Next steps:"
echo "1. Edit /opt/rrrichardzengyumi/backend/.env with your actual API keys"
echo "2. Restart backend: pm2 restart yumi-backend"
echo "3. Deploy frontend to GitHub Pages"
echo "4. Test the full application"
echo ""
echo "📋 Useful commands:"
echo "- Check backend status: pm2 status"
echo "- View backend logs: pm2 logs yumi-backend"
echo "- Restart backend: pm2 restart yumi-backend"
echo "- Check nginx status: systemctl status nginx"
echo "- View nginx logs: tail -f /var/log/nginx/error.log" 