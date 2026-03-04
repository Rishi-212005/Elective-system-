# Elective Harmony 🎓

A modern, intelligent web application for managing elective course allocation in educational institutions. Built with React, TypeScript, and Vite.

## 🌟 Features

### Multi-Role Dashboard System
- **Student Dashboard**: Browse electives, set preferences, view AI recommendations, and track allocation results
- **Admin Dashboard**: Manage electives, students, and oversee the allocation process
- **Faculty Dashboard**: View assigned electives and student information

### Core Functionality
- ✨ **Elective Management**: Create, view, and manage elective courses with seat tracking
- 🎯 **Preference Selection**: Students can select 3-10 preferred electives
- 🤖 **AI Recommendations**: Smart elective suggestions based on student profiles and CGPA
- 📊 **Real-time Analytics**: Track seat utilization, elective popularity, and allocation fairness
- 🔄 **Multi-Round Allocation**: CGPA-based priority allocation system
- 📈 **Fairness Metrics**: Monitor allocation satisfaction across different CGPA ranges
- 🎨 **Modern UI/UX**: Beautiful, responsive design with smooth animations using Framer Motion

## 🚀 Tech Stack

### Frontend Framework
- **React 18.3** - UI library
- **TypeScript 5.8** - Type safety
- **Vite 5.4** - Build tool and dev server

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Beautiful component library
- **Radix UI** - Accessible UI primitives
- **Framer Motion** - Animation library
- **Lucide Icons** - Icon library

### State Management & Routing
- **React Router v6** - Client-side routing
- **React Context API** - Authentication state management
- **TanStack Query (React Query)** - Server state management

### Form Handling & Validation
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Data Visualization
- **Recharts** - Charts and data visualization

### Testing
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing

## 📁 Project Structure

```
elective-harmony/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Shadcn UI components
│   │   ├── AppSidebar.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── ElectiveCard.tsx
│   │   ├── NavLink.tsx
│   │   └── StatCard.tsx
│   ├── context/          # React Context providers
│   │   └── AuthContext.tsx
│   ├── data/             # Mock data and types
│   │   └── mockData.ts
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── pages/            # Page components
│   │   ├── Admin*.tsx    # Admin pages
│   │   ├── Student*.tsx  # Student pages
│   │   ├── Faculty*.tsx  # Faculty pages
│   │   └── Login.tsx
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
└── package.json
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd elective-harmony

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Build for Production

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## 👤 User Credentials

### Demo Login Credentials

**Student Account:**
- Username: `student`
- Password: `123`

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Faculty Account:**
- Username: `faculty`
- Password: `faculty123`

## 📱 Available Routes

### Public Routes
- `/` - Landing page
- `/login` - Login page
- `/register` - Student registration

### Protected Routes (Student)
- `/dashboard/student` - Student dashboard
- `/student/profile` - Student profile
- `/elective-selection` - Browse and select electives
- `/preference-checkout` - Review and submit preferences
- `/allocation-result` - View allocation results

### Protected Routes (Admin)
- `/dashboard/admin` - Admin dashboard
- `/admin/electives` - Manage electives
- `/admin/students` - Manage students
- `/admin/allocation` - Allocation controls
- `/analytics` - Analytics dashboard

### Protected Routes (Faculty)
- `/dashboard/faculty` - Faculty dashboard

## 🎨 Key Components

### ElectiveCard
Displays elective information with:
- Course code and name
- Faculty details
- Description
- Seat availability (removed as per recent update)
- Select/deselect functionality

### DashboardLayout
Consistent layout wrapper with:
- Sidebar navigation
- Header with user info
- Responsive design

### StatCard
Statistics display component showing:
- Metric value
- Icon
- Description
- Trend indicators

## 📊 Data Models

### Elective
```typescript
interface Elective {
  id: string;
  code: string;
  name: string;
  faculty: string;
  department: string;
  totalSeats: number;
  remainingSeats: number;
  description: string;
}
```

### Student
```typescript
interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  semester: number;
  cgpa: number;
  preferences: string[];
  allocatedElective?: string;
}
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build in development mode
npm run build:dev

# Run linter
npm run lint

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## 🎯 Features in Detail

### Preference Selection System
- Minimum 3 preferences required
- Maximum 10 preferences allowed
- Real-time count and validation
- Visual preference ordering

### Allocation Algorithm
- CGPA-based priority system
- Multiple allocation rounds
- Fair distribution mechanism
- Tie-breaking rules
- Seat capacity enforcement

### Analytics Dashboard
- Elective popularity charts
- Seat utilization metrics
- Allocation round statistics
- Fairness analysis by CGPA range
- Satisfaction scores

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For contributions, please contact the maintainers.

## 📞 Support

For issues or questions, please open an issue in the repository.

---

**Built with ❤️ using React, TypeScript, and Vite**
