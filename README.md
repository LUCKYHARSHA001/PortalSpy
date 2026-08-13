# PortalSpy 🚀

PortalSpy is a real-time web scraper and automated WhatsApp alert application designed to monitor target job/data portals for keyword matching updates and deliver instant notifications.

## 🌟 Key Features
- 🔐 **User Authentication**: Secure JWT authentication and Google OAuth support.
- 🌐 **Dynamic Scraping Engine**: Automated Web Scraping service for dynamic portals.
- ⚡ **Queue Management**: Asynchronous task processing with Bull Queue & Redis.
- 📲 **WhatsApp Bot Integration**: Instant alerts delivered straight to WhatsApp via `whatsapp-web.js`.
- 📊 **Interactive Dashboard**: Real-time stats, filter configuration, portal management, and alert history.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide React Icons
- **Backend**: Node.js, Express, MongoDB (Mongoose), Redis
- **Automation**: Puppeteer / Cheerio, WhatsApp Web JS

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- Redis Server

### Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/LUCKYHARSHA001/PortalSpy.git
   cd PortalSpy
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` files to `.env` in both `client` and `server` folders and fill in your credentials:
   ```bash
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   ```

3. **Backend Setup**:
   ```bash
   cd server
   npm install
   npm start
   ```

4. **Frontend Setup**:
   ```bash
   cd client
   npm install
   npm run dev
   ```


