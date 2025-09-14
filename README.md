# Book Master

A professional British English book editing application designed for authors, publishers, and editorial professionals. The system provides comprehensive British English spell checking, real-time editing capabilities, and manuscript management features for full-length book projects.

## 🚀 Features

### Core Editing Features
- **British English Spell Checking**: 50,000+ word dictionary with real-time error detection
- **Professional Text Editor**: Large editing area with word and character counting
- **Autosave Functionality**: 30-second intervals with unsaved changes protection
- **Keyboard Shortcuts**: Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline), Ctrl+S (save)
- **Font Selection**: Curated professional fonts with persistent preferences
- **Markdown Preview**: Real-time markdown rendering with Ctrl+M activation

### Book Management
- **Multi-Book Support**: Create and manage multiple book projects
- **Chapter Organisation**: Hierarchical chapter structure with auto-numbering
- **Book Statistics**: Word count, character count, reading time estimates
- **Export Functionality**: Export to TXT and Markdown formats

### Advanced Features
- **Custom Dictionary**: User-defined terms with categories
- **Memory Management**: Automatic pagination for large documents (100,000+ words)
- **Global Scratchpad**: Persistent notes across all books and sessions
- **Responsive Design**: Desktop, tablet, and mobile compatibility
- **Performance Optimised**: Lazy loading, caching, and memory cleanup

## 🎯 Target Deployment

Designed for deployment on **Raspberry Pi 5** with the following specifications:
- **Frontend**: http://192.168.1.123:5173
- **Backend API**: http://192.168.1.123:8000
- **Database**: SQLite for local data persistence
- **Networking**: Local network access for editorial teams

## 🏗️ Architecture

### Three-Tier Architecture
- **Presentation Layer**: React/TypeScript SPA with Tailwind CSS
- **Application Layer**: Node.js/Express API with comprehensive validation
- **Data Layer**: SQLite database with structured schema

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Query, Zustand
- **Backend**: Node.js, Express, TypeScript, SQLite, Better-SQLite3, Knex
- **Spell Checking**: Typo.js with British English dictionary
- **Deployment**: Docker, Docker Compose
- **Development**: ESLint, TypeScript, Vitest

## 📦 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/campbellhealyRDG/book-master.git
cd book-master
```

2. **Deploy with Docker Compose**
```bash
cd deploy
docker-compose up -d
```

3. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Development Setup

#### Prerequisites
- Node.js 18+
- npm or yarn
- Git

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### Backend Setup
```bash
cd backend
npm install
npm run migrate  # Set up database
npm run dev
```

## 🐳 Docker Configuration

The application uses multi-stage Docker builds optimised for production:

- **Frontend Container**: Static files served with optimised builds
- **Backend Container**: TypeScript compilation with production dependencies
- **Simple Container Names**: `frontend` and `backend`
- **Persistent Data**: Database stored in Docker volumes
- **Health Checks**: Automatic container health monitoring

### Docker Commands
```bash
# Build and start
docker-compose up -d

# View logs
docker logs frontend
docker logs backend

# Stop services
docker-compose down
```

## 🗂️ Project Structure

```
book-master/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route components
│   │   ├── services/        # API and external services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand state management
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   ├── package.json
│   └── Dockerfile
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Data models
│   │   ├── routes/          # API route definitions
│   │   ├── database/        # Database setup and migrations
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── Dockerfile
├── deploy/                   # Deployment configurations
│   ├── docker-compose.yml   # Docker orchestration
│   └── USER_GUIDE.md        # User documentation
└── README.md
```

## 🔌 API Endpoints

### Books
- `GET /api/books` - List all books
- `POST /api/books` - Create new book
- `GET /api/books/:id` - Get book details
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book
- `POST /api/books/:id/export` - Export book

### Chapters
- `GET /api/chapters/books/:bookId/chapters` - Get book chapters
- `POST /api/chapters/books/:bookId/chapters` - Create chapter
- `GET /api/chapters/:id` - Get chapter content
- `PUT /api/chapters/:id` - Update chapter
- `DELETE /api/chapters/:id` - Delete chapter

### Dictionary
- `GET /api/dictionary/terms` - Get custom terms
- `POST /api/dictionary/terms` - Add custom term
- `PUT /api/dictionary/terms/:id` - Update term
- `DELETE /api/dictionary/terms/:id` - Delete term

### Preferences
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update preferences

### Scratchpad
- `GET /api/scratchpad` - Get scratchpad content
- `PUT /api/scratchpad` - Update scratchpad

## 🎨 User Interface

### Key Components
- **Dashboard**: Book overview and statistics
- **Editor**: Professional writing interface with spell checking
- **Sidebar**: Navigation and book/chapter management
- **Navigation Bar**: Save, autosave controls, and scratchpad access
- **Dictionary Manager**: Custom term management interface

### Design System
- **Colour Scheme**: Chrome green professional theme
- **Typography**: Curated font selection for readability
- **Layout**: Two-panel design with collapsible sidebar
- **Responsive**: Mobile, tablet, and desktop optimised

## 🔧 Configuration

### Environment Variables
- `NODE_ENV`: Development/production mode
- `PORT`: Server port (default: 8000)
- `DATABASE_PATH`: SQLite database location
- `CORS_ORIGIN`: Allowed frontend origins

### Database Schema
- **Books**: Title, author, metadata, statistics
- **Chapters**: Content, numbering, word counts
- **Dictionary Terms**: Custom words with categories
- **User Preferences**: Font, editor settings
- **Scratchpad**: Global persistent notes

## 🚀 Performance Features

### Frontend Optimisations
- **Lazy Loading**: Components loaded on demand
- **Caching**: API responses cached with React Query
- **Memory Management**: Automatic cleanup for large documents
- **Pagination**: Intelligent content splitting for performance
- **Debounced Operations**: Optimised search and spell checking

### Backend Optimisations
- **SQLite**: High-performance embedded database
- **Request Caching**: Intelligent response caching
- **Compression**: Gzip response compression
- **Rate Limiting**: API protection and performance
- **Connection Pooling**: Efficient database connections

## 📝 Development

### Available Scripts

**Frontend**
```bash
npm run dev          # Development server
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # Code linting
```

**Backend**
```bash
npm run dev          # Development server with hot reload
npm run build        # TypeScript compilation
npm run start        # Production server
npm run migrate      # Database migrations
npm run type-check   # TypeScript validation
npm run lint         # Code linting
```

### Code Quality
- **TypeScript**: Full type safety across frontend and backend
- **ESLint**: Consistent code style and error detection
- **Comprehensive Types**: Detailed interfaces for all data structures
- **Error Handling**: Robust error boundaries and API error handling

## 📋 Browser Support

### Supported Browsers
- **Chrome**: Version 88+
- **Firefox**: Version 85+
- **Safari**: Version 14+
- **Edge**: Version 88+

### Mobile Support
- **iOS Safari**: Version 14+
- **Chrome Mobile**: Version 88+
- **Samsung Internet**: Version 15+

## 🔒 Security Features

- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterised queries
- **XSS Prevention**: Content sanitisation
- **CORS Configuration**: Secure cross-origin requests
- **Helmet.js**: Security headers
- **Rate Limiting**: API abuse protection

## 🐛 Troubleshooting

### Common Issues

**Application won't start**
```bash
# Check Docker containers
docker ps
docker logs frontend
docker logs backend

# Restart services
docker-compose restart
```

**Database connection errors**
```bash
# Recreate database
docker-compose down -v
docker-compose up -d
```

**Performance issues**
- Clear browser cache
- Restart Docker containers
- Check available system memory

## 📖 Documentation

- **User Guide**: [deploy/USER_GUIDE.md](deploy/USER_GUIDE.md) - Complete user documentation
- **API Documentation**: Available in source code comments
- **Type Definitions**: [frontend/src/types/index.ts](frontend/src/types/index.ts)

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Test thoroughly
5. Submit a pull request

### Code Standards
- TypeScript for all new code
- ESLint configuration compliance
- Comprehensive error handling
- Performance considerations
- Security best practices

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏷️ Version

**Current Version**: 1.0.0

### Version History
- **1.0.0**: Initial release with complete British English editing suite
- Full spell checking and grammar support
- Multi-book management system
- Professional editor interface
- Docker deployment configuration
- Raspberry Pi optimisation

---

**Built with ❤️ for British English authors and publishers**

For support, please refer to the [User Guide](deploy/USER_GUIDE.md) or open an issue in the repository.