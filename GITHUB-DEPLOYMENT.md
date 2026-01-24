# 🚀 GitHub Pages Deployment Guide

## Quick Deploy to GitHub

### Step 1: Initialize Git Repository

```bash
cd C:\Users\hasan\.gemini\antigravity\scratch\dr-drashtis-dental-clinic
git init
git add .
git commit -m "Initial commit: Dr. Drashti's Dental Clinic"
```

### Step 2: Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `dr-drashtis-dental-clinic`
3. Description: `Advanced Dental and Cosmetic Clinic Management System`
4. Make it **Public** (required for free GitHub Pages)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### Step 3: Push to GitHub

```bash
git remote add origin https://github.com/engaqk/dr-drashtis-dental-cosmetic-clinic.git
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Pages** in the left sidebar
4. Under "Source", select **main** branch
5. Click **Save**
6. Wait 1-2 minutes for deployment

### Step 5: Access Your Live Site

Your site will be available at:
```
https://engaqk.github.io/dr-drashtis-dental-cosmetic-clinic/
```

---

## Features

✅ **Bright, Theme-Adaptive Logo**
✅ **Two Professional Themes** (Green & Blue-Green)
✅ **Staff Authentication** (admin / drashti@123)
✅ **Appointment Booking** with time slots (11 AM-2 PM, 4 PM-7 PM)
✅ **Double-Booking Prevention**
✅ **Form Validations** (Indian mobile numbers, name validation)
✅ **Mobile-First Responsive Design**
✅ **Dashboard Analytics** with charts
✅ **Google Calendar Integration**
✅ **Search & Filter Patients**
✅ **Fee Management**
✅ **Print Schedule**
✅ **Delete Appointments**
✅ **Logout Functionality**

---

## Data Storage

- Uses **localStorage** for data persistence
- Data is stored locally in the browser
- Each browser/device has its own data
- For shared database, consider upgrading to a backend solution

---

## Custom Domain (Optional)

1. Buy a domain (e.g., from Namecheap, GoDaddy)
2. In GitHub repo: Settings → Pages → Custom domain
3. Add your domain and follow DNS setup instructions

---

## Continuous Deployment

Every time you push to GitHub, your site automatically updates!

```bash
# Make changes to your files
git add .
git commit -m "Update: description of changes"
git push
```

---

**Your dental clinic is ready to go live! 🎉**
