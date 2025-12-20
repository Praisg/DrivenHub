# DRIVEN Community Institute - Communication Hub

A comprehensive platform for managing member engagement, skills tracking, events, and community resources.

## 🎯 What Is This?

The DRIVEN Community Institute Communication Hub is a web platform that connects members with:
- **Skills tracking and development**
- **Community events and announcements**
- **Coaching resources**
- **Member directory**
- **Learning resources**

---

## 👥 Roles & Access

### **Members** 
Regular users who are part of the DRIVEN community.

**Access:** `/member/login` or click "Sign In as Member" on the homepage

**What Members Can Do:**
- ✅ View their assigned skills and track progress
- ✅ See upcoming events and announcements
- ✅ Access coaching resources
- ✅ Browse the member directory
- ✅ View learning resources
- ✅ Request password reset via email
- ✅ Update their profile

**Member Features:**
- **Home Dashboard** - Overview of announcements, events, and quick actions
- **Skills Wallet** - View assigned skills and track learning progress
- **Events** - See upcoming community events with Zoom links and calendar integration
- **Coaching** - Access coaching resources and booking
- **Resources** - Browse videos, documents, and learning materials

---

### **Admins**
Administrators who manage the platform and members.

**Access:** `/admin/login` (direct link - not shown on homepage)

**What Admins Can Do:**
- ✅ Create and manage skills
- ✅ Assign skills to members
- ✅ Manage member accounts
- ✅ Create announcements
- ✅ Manage events
- ✅ View all member skills and progress
- ✅ Sync events with Google Calendar
- ✅ Manage coaching requests
- ✅ View surveys and member feedback

**Admin Features:**
- **Dashboard** - Overview of platform activity
- **Skills Management** - Create, edit, and organize skills
- **Skill Assignment** - Assign skills to members individually or by level
- **Member Management** - View and manage member accounts
- **Announcements** - Create and publish community announcements
- **Events Management** - Add and manage community events
- **Google Calendar Sync** - Sync events with Google Calendar
- **Coaching Requests** - Manage member coaching requests
- **Surveys** - View and manage member surveys

---

## 🔑 Key Features

### For Everyone
- **Secure Authentication** - Password-protected accounts with email reset
- **Mobile-Friendly** - Works great on phones, tablets, and desktops
- **Real-Time Updates** - See new assignments and announcements instantly

### Skills System
- **Hierarchical Skills** - Skills organized by categories and levels
- **Progress Tracking** - Members can mark skills as complete
- **Skill Wallet** - Visual display of all skills and progress
- **Level-Based Assignment** - Admins can assign skills by proficiency level

### Events & Communication
- **Event Calendar** - View upcoming events with dates, times, and Zoom links
- **Announcements** - Important updates from admins
- **Calendar Integration** - Add events to your personal calendar (.ics files)
- **Email Notifications** - Password reset emails via Resend

### Community
- **Member Directory** - See other community members
- **Coaching Requests** - Request coaching sessions
- **Resources Library** - Access videos, documents, and learning materials
- **Surveys** - Participate in community surveys

---

## 🚀 Quick Start

### For Members
1. Go to the homepage
2. Click **"Sign In as Member"** or **"Register as Member"**
3. Log in with your email and password
4. Start exploring your dashboard!

### For Admins
1. Go to `/admin/login` (direct link)
2. Log in with your admin credentials
3. Access the admin dashboard to manage the platform

---

## 🔒 Security

- **Role-Based Access** - Members and admins have different permissions
- **Secure Passwords** - Passwords are hashed and stored securely
- **Email Verification** - Password reset emails sent securely
- **Data Isolation** - Members can only see their own data

---

## 📧 Support

- **Forgot Password?** - Use the "Forgot your password?" link on the login page
- **Need Help?** - Contact your admin or the DRIVEN team

---

## 🛠️ Technical Details

**Built With:**
- Next.js 15 (React framework)
- TypeScript
- Supabase (database)
- Resend (email service)
- Tailwind CSS (styling)

**Deployment:**
- Hosted on Heroku/Vercel
- Database: Supabase
- Email: Resend

---

## 📝 Notes

- Admin login is not shown on the homepage for security
- Members can register themselves or be added by admins
- Skills are assigned by admins and tracked by members
- All events include timezone information (CT/ET)
