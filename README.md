# Multi-Tenant Platform - My Group

A comprehensive multi-tenant platform with 23+ integrated applications including chat, e-commerce, service booking, media management, and more.

## 🚀 Quick Start

### Prerequisites
- **XAMPP** (MySQL/MariaDB running)
- **Node.js** (v16+)
- **npm**

### Step 1: Database Setup (REQUIRED)

**Using phpMyAdmin (Recommended):**
1. Start XAMPP and open http://localhost/phpmyadmin
2. Create database: `my_group` with collation `utf8mb4_unicode_ci`
3. Import schema files **in this exact order**:
   - `database/schema/01_core_tables.sql`
   - `database/schema/02_group_management.sql`
   - `database/schema/03_geographic_reference.sql`
   - `database/schema/04_needy_services.sql`
   - `database/schema/05_labor_management.sql`
   - `database/schema/06_shop_ecommerce.sql`
   - `database/schema/07_media_gallery.sql`
   - `database/schema/08_unions_chat.sql`

📖 **Detailed instructions:** See `SETUP_GUIDE.md`

### Step 2: Start Servers

**Option A - Windows Quick Start:**
```bash
# Double-click or run:
start-all.bat
```

**Option B - Manual Start:**
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
npm install
npm run dev
```

### Step 3: Access Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## 🎯 23 Integrated Applications

- 💬 **MyChat** - Messaging & Communication
- 📔 **MyDiary** - Personal Journal
- ❤️ **MyNeedy** - Service Booking Platform
- 😊 **MyJoy** - Entertainment & Fun
- 📻 **MyMedia** - Media Gallery & Management
- 👥 **MyUnions** - Organization Management
- 📺 **MyTV** - Video Streaming
- 💰 **MyFin** - Finance Management
- 🛍️ **MyShop** - E-Commerce Platform
- 👫 **MyFriend** - Social Networking
- 💼 **MyBiz** - Business Tools
- ...and 12 more!

## 🛠️ Technology Stack

**Backend:** Node.js, Express, Sequelize, MySQL, JWT
**Frontend:** React 18, TypeScript, Tailwind CSS, React Router

## 📚 Documentation

- 📖 **Complete Setup Guide:** `SETUP_GUIDE.md`
- 📊 **Implementation Status:** `IMPLEMENTATION_STATUS.md`
- 🗄️ **Database Documentation:** `database/SCHEMA_DOCUMENTATION.md`
- 🎨 **UI Design System:** `UI_DESIGN_SYSTEM.md`

## 🧪 Testing

1. **Register:** http://localhost:3000/register
2. **Login:** http://localhost:3000/login
3. **Dashboard:** http://localhost:3000/dashboard

## 🐛 Troubleshooting

**Backend won't start?**
- Ensure MySQL is running in XAMPP
- Check `backend/.env` for correct database credentials
- Verify database `my_group` exists and schemas are imported

**Frontend errors?**
- Clear browser cache
- Delete `node_modules` and run `npm install`

**Need help?** See `SETUP_GUIDE.md` for detailed troubleshooting

---

**Original Figma Design:** https://www.figma.com/design/5M9x3oEbslOWzBc8qEJPKg/Premium-Multi-Tenant-Platform-UI-UX

**Built with ❤️ for Multi-Tenant Excellence**