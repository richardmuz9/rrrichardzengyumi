# 🔑 Fix SSH Access to DigitalOcean Droplet

## Problem: Permission denied (publickey)
Your droplet is configured for SSH key authentication only.

## Solutions:

### Option 1: Use Web Console (Recommended)
1. Go to DigitalOcean Dashboard
2. Click your droplet → **Console** button
3. Login as `root` with the password you set during droplet creation

### Option 2: Add SSH Key (Windows)
```powershell
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your-email@example.com"
# Press Enter for all prompts (use default locations)

# Copy public key
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
```

Then:
1. DigitalOcean Dashboard → Droplet → Settings → SSH Keys
2. Add the copied public key
3. Try SSH again: `ssh root@137.184.89.215`

### Option 3: Enable Password Authentication
Via DigitalOcean Console, run:
```bash
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd
```

## DNS Issue: api.yumi77965.online not resolving
DNS takes time to propagate. Use IP address for now:
```bash
ssh root@137.184.89.215
``` 