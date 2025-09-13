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
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, SQLite
- **Development**: ESLint, Prettier, Jest, Playwright
- **Deployment**: Docker, Docker Compose, Nginx, systemd

## 📦 Installation

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd booker
   ```

2. **Install dependencies**:
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

3. **Setup database**:
   ```bash
   cd backend
   npm run migrate
   ```

4. **Start development servers**:
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

### Production Deployment (Raspberry Pi 5)

For production deployment on Raspberry Pi 5, use the automated installation script:

```bash
cd deploy
chmod +x install.sh
sudo ./install.sh
```

The installation script will:
- Install all system dependencies (Node.js, Docker, Nginx)
- Set up systemd services for automatic startup
- Configure firewall and security settings
- Create backup scripts and log rotation
- Set up SSL certificates (optional)

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
```env
NODE_ENV=production
PORT=8000
DATABASE_PATH=/var/lib/book-master/database/book-master.db
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env)**:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Database Schema

- **Books**: Title, author, description, chapter count, word count
- **Chapters**: Content, chapter number, word/character counts
- **Dictionary Terms**: Custom words with categories
- **User Preferences**: Font, editor settings, autosave interval
- **Scratchpad**: Global notes with persistence

## 🧪 Testing

### Running Tests

```bash
# Unit Tests
npm test

# Integration Tests
npm run test:integration

# End-to-End Tests
npm run test:e2e

# Performance Tests
npm run test:performance
```

### Test Coverage
- Unit tests for all components and API endpoints
- Integration tests for frontend-backend communication
- End-to-end tests for complete user workflows
- Performance tests for large documents
- Accessibility tests for WCAG 2.1 AA compliance

## 📊 Performance

### Benchmarks
- Page load time: < 3 seconds
- API response time: < 500ms
- Spell checking latency: < 100ms
- Memory usage: Efficient handling of 100,000+ word documents
- Export generation: < 10 seconds for typical books

### Optimisation Features
- Lazy loading for chapter content
- LRU caching for frequently accessed data
- Debounced spell checking
- Memory leak detection and cleanup
- Browser storage optimisation

## 🔒 Security

### Security Measures
- Input validation and sanitisation
- SQL injection prevention via parameterised queries
- XSS protection
- CORS configuration
- Rate limiting for API endpoints
- Non-root user execution
- Firewall configuration

## 📱 User Interface

### Design Principles
- **Professional Chrome Green Theme**: High contrast, easy on the eyes
- **Two-Panel Layout**: Sidebar for navigation, main area for editing
- **Responsive Design**: Adapts to desktop, tablet, and mobile
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: Smooth interactions even with large documents

## 🛠️ API Documentation

### Core Endpoints

**Books Management**:
- `GET /api/books` - List all books
- `POST /api/books` - Create new book
- `GET /api/books/:id` - Get specific book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book
- `POST /api/books/:id/export` - Export book

**Chapter Management**:
- `GET /api/chapters/books/:bookId/chapters` - Get chapters
- `POST /api/chapters/books/:bookId/chapters` - Create chapter
- `GET /api/chapters/:id` - Get specific chapter
- `PUT /api/chapters/:id` - Update chapter
- `DELETE /api/chapters/:id` - Delete chapter

**Dictionary Management**:
- `GET /api/dictionary/terms` - List terms
- `POST /api/dictionary/terms` - Add term
- `PUT /api/dictionary/terms/:id` - Update term
- `DELETE /api/dictionary/terms/:id` - Delete term

**User Preferences**:
- `GET /api/preferences` - Get all preferences
- `PUT /api/preferences/:key` - Set preference

**Scratchpad**:
- `GET /api/scratchpad` - Get scratchpad content
- `PUT /api/scratchpad` - Update scratchpad

## 🚀 Deployment Management

### Service Management (Raspberry Pi)

```bash
# Check service status
sudo systemctl status book-master-backend book-master-frontend

# Restart services
sudo systemctl restart book-master-backend book-master-frontend

# View logs
sudo journalctl -u book-master-backend -f
sudo journalctl -u book-master-frontend -f

# Backup database
sudo /usr/local/bin/book-master-backup
```

### Docker Management

```bash
# Start services
cd deploy
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d
```

## 📚 User Guide

### Getting Started
1. **Create a Book**: Click "New Book" and enter title and author
2. **Add Chapters**: Select book and click "New Chapter"
3. **Start Writing**: Use the large text editor with real-time spell checking
4. **Use Shortcuts**: Ctrl+S to save, Ctrl+M for markdown preview
5. **Export**: When ready, use the export feature for TXT or Markdown

### Advanced Features
- **Custom Dictionary**: Add industry-specific terms and proper nouns
- **Scratchpad**: Keep global notes accessible from any book
- **Font Selection**: Choose from professional fonts for comfortable editing
- **Pagination**: Large documents automatically split for performance

## 🤝 Contributing

### Development Workflow
1. Create feature branch from main
2. Follow coding conventions and British English documentation
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit pull request

### Code Standards
- TypeScript with strict mode
- ESLint and Prettier configuration
- Comprehensive test coverage
- British English documentation
- Accessible UI components

## 📄 License

This project is proprietary software designed for professional editorial use.

## 📞 Support

For installation assistance or technical support:
- Check the installation logs in `/var/log/book-master/`
- Review systemd service status
- Consult the API documentation at `http://localhost:8000/api`
- Verify firewall settings with `sudo ufw status`

---

**Book Master v1.0.0** - Professional British English Book Editing Application
Designed for Raspberry Pi 5 deployment | Built with modern web technologies