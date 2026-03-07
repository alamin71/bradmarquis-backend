# EC2 Deploy Guide (Node.js + PM2 + Nginx)

## 1) Launch EC2
- Use Ubuntu 22.04 LTS.
- Security Group inbound:
  - `22` (SSH) from your IP
  - `80` (HTTP) from `0.0.0.0/0`
  - `443` (HTTPS) from `0.0.0.0/0` (optional now, needed for SSL)

## 2) SSH into server
```bash
ssh -i /path/to/key.pem ubuntu@<EC2_PUBLIC_IP>
```

## 3) Prepare server (one-time)
```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
```

Copy setup script to EC2 and run:
```bash
cd /var/www
# clone your project
git clone <YOUR_REPO_URL> bradmarquis-backend
cd bradmarquis-backend
chmod +x deploy/ec2/setup-server.sh
./deploy/ec2/setup-server.sh
```

## 4) Create production env file
```bash
cd /var/www/bradmarquis-backend
cp .env .env.backup.local
nano .env
```

Minimum values to check in `.env`:
- `NODE_ENV=production`
- `PORT=5000`
- `IP_ADDRESS=0.0.0.0`
- `DATABASE_URL=<your production Mongo URI>`
- `JWT_SECRET=<strong random value>`
- `JWT_REFRESH_SECRET=<strong random value>`
- `ALLOWED_ORIGINS=<your frontend domain>`

## 5) Deploy app
```bash
cd /var/www/bradmarquis-backend
chmod +x deploy/ec2/deploy.sh
./deploy/ec2/deploy.sh
```

## 6) Configure Nginx reverse proxy
Create Nginx site config:
```bash
sudo nano /etc/nginx/sites-available/bradmarquis-backend
```

Use this config:
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/bradmarquis-backend /etc/nginx/sites-enabled/bradmarquis-backend
sudo nginx -t
sudo systemctl reload nginx
```

## 7) Verify
```bash
pm2 status
pm2 logs bradmarquis-backend --lines 100
curl http://127.0.0.1:5000
```

## 8) Next deploys
For every code change:
```bash
cd /var/www/bradmarquis-backend
./deploy/ec2/deploy.sh
```

## 9) SSL (recommended)
After domain is connected to EC2 public IP:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
