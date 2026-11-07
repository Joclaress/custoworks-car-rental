# Custoworks Car Rental Services - Naga City, Bicol 🚗💨

Official online car rental reservation, fleet management, and quotation platform for **Custoworks Car Rental Services**, Naga City, Camarines Sur, Philippines.

- **Location:** Carnation Street CBD II, Brgy. Triangulo (Beside SM City Naga), Naga City, Camarines Sur, 4400
- **Hotlines:** 0961 722 5326 (Primary) / 0995 382 7972 (Secondary)
- **Email:** custoworks1@gmail.com
- **Facebook:** [Custoworks Car Rental (fb.com/CustoWorkss)](https://www.facebook.com/CustoWorkss)

---

## 🌟 Key Features

1. **Fleet Showcase & Dynamic Rates:**
   - Sedan (Mitsubishi Mirage G4, Toyota Vios), SUV / MPV (Toyota Innova, Mitsubishi Xpander), Passenger Vans (Nissan NV350).
   - Rate matrix covering 12-hour, 24-hour, self-drive, and with-driver tiers across Bicol and Luzon destinations.

2. **Streamlined 8-Step Booking Wizard:**
   - Real-time availability check, destination pricing, delivery options, and driver selection.
   - Low **PHP 500.00** reservation fee to secure vehicle dates on the calendar.

3. **InstaPay QR Code & Digital Payments:**
   - Integrated **GCash** (`0995 382 7972` - Jericho Oclares) and **BDO Unibank** (`0051 6059 4036` - Jericho Oclares) with scan-to-pay InstaPay QR code previews.
   - Customer proof-of-payment receipt upload with instant status tracking.

4. **Self-Service Booking Tracking Portal:**
   - Customers track live status via reference code (e.g. `CW-202611-1001`).
   - Upload driver documents (Driver's License, 2nd Valid ID, selfie) directly online.

5. **Official PDF Quotation & Inquiry Engine:**
   - Auto-generates branded PDF quotations with official Custoworks breakdown, terms, and QR payment details.
   - 1-click email dispatch to customers with attached PDF.

6. **Comprehensive Admin Dashboard:**
   - Live fleet calendar with maintenance blocks.
   - Monthly Gross Revenue analytics with vehicle-by-vehicle earnings breakdown (e.g. Mirage G4 24h performance).
   - Document verification with AI license OCR assist and payment verification queue.
   - User & staff management with credential reset.

---

## 🚀 Live Deployment Guide

### Deploying the Frontend (Client) on Vercel (Recommended)
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account (**Joclaress**).
2. Click **"Add New Project"** and import `custoworks-car-rental`.
3. In **Root Directory**, click edit and select `client`.
4. Add Environment Variable:
   - `VITE_API_URL` = URL of your deployed backend (e.g. `https://custoworks-api.onrender.com/api`).
5. Click **Deploy**. Vercel provides a free live HTTPS URL with continuous deployment on every git push!

### Deploying the Backend (Server) on Render
1. Go to [render.com](https://render.com) and create a **Web Service** connected to `custoworks-car-rental`.
2. In **Root Directory**, set `server`.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm run start`
5. Create a free managed **PostgreSQL Database** on Render (or Supabase/Neon) and set `DATABASE_URL` in the environment variables.

---

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Joclaress/custoworks-car-rental.git
cd custoworks-car-rental
```

### 2. Backend Server
```bash
cd server
npm install
npm run dev
```
Backend runs on `http://localhost:4001`.

### 3. Frontend Client
```bash
cd client
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.
