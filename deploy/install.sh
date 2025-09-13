#!/bin/bash

# Book Master Installation Script for Raspberry Pi 5
# This script sets up the complete Book Master application

set -e

# Colour output for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Colour

# Configuration
APP_NAME="Book Master"
APP_VERSION="1.0.0"
INSTALL_DIR="/opt/book-master"
DATA_DIR="/var/lib/book-master"
LOG_DIR="/var/log/book-master"
SERVICE_USER="bookmaster"
FRONTEND_PORT="5173"
BACKEND_PORT="8000"
PI_IP=$(hostname -I | awk '{print $1}')

# Functions
print_header() {
    echo -e "${PURPLE}"
    echo "=================================================="
    echo "       $APP_NAME v$APP_VERSION"
    echo "    Professional British English Book Editor"
    echo "        Raspberry Pi 5 Installation"
    echo "=================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

check_requirements() {
    print_step "Checking system requirements..."

    # Check if running on Raspberry Pi
    if ! grep -q "Raspberry Pi" /proc/cpuinfo; then
        print_warning "This script is optimised for Raspberry Pi. Continuing anyway..."
    fi

    # Check available memory (minimum 4GB recommended)
    TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_MEM" -lt 4 ]; then
        print_warning "Less than 4GB RAM detected. Performance may be limited."
    fi

    # Check available disk space (minimum 2GB required)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 2097152 ]; then # 2GB in KB
        print_error "Insufficient disk space. At least 2GB free space required."
        exit 1
    fi

    print_success "System requirements check completed"
}

install_dependencies() {
    print_step "Installing system dependencies..."

    # Update package list
    sudo apt update

    # Install required packages
    sudo apt install -y curl wget git sqlite3 nginx certbot python3-certbot-nginx

    # Install Node.js 18.x
    if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 18 ]; then
        print_info "Installing Node.js 18.x..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    fi

    # Install Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        print_info "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_info "Installing Docker Compose..."
        sudo apt install -y docker-compose
    fi

    print_success "Dependencies installed successfully"
}

create_directories() {
    print_step "Creating application directories..."

    sudo mkdir -p "$INSTALL_DIR"
    sudo mkdir -p "$DATA_DIR"
    sudo mkdir -p "$LOG_DIR"

    # Create service user
    if ! id "$SERVICE_USER" &>/dev/null; then
        sudo useradd -r -s /bin/false -d "$INSTALL_DIR" "$SERVICE_USER"
    fi

    # Set permissions
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$DATA_DIR"
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$LOG_DIR"
    sudo chmod 755 "$INSTALL_DIR"
    sudo chmod 755 "$DATA_DIR"
    sudo chmod 755 "$LOG_DIR"

    print_success "Directories created successfully"
}

deploy_application() {
    print_step "Deploying application files..."

    # Copy application files
    sudo cp -r ../frontend "$INSTALL_DIR/"
    sudo cp -r ../backend "$INSTALL_DIR/"
    sudo cp docker-compose.yml "$INSTALL_DIR/"

    # Set ownership
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

    print_success "Application files deployed"
}

setup_database() {
    print_step "Setting up production database..."

    # Create database directory
    sudo mkdir -p "$DATA_DIR/database"

    # Initialize database
    cd "$INSTALL_DIR/backend"
    sudo -u "$SERVICE_USER" npm install
    sudo -u "$SERVICE_USER" DATABASE_PATH="$DATA_DIR/database/book-master.db" npm run migrate

    # Set database permissions
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$DATA_DIR/database"
    sudo chmod 644 "$DATA_DIR/database/book-master.db"

    print_success "Database setup completed"
}

configure_nginx() {
    print_step "Configuring Nginx reverse proxy..."

    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/book-master > /dev/null <<EOF
server {
    listen 80;
    server_name $PI_IP localhost;

    # Frontend
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # API specific headers
        proxy_set_header Content-Type application/json;

        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";

        # Handle preflight requests
        if (\$request_method = OPTIONS) {
            return 204;
        }
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:$FRONTEND_PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/book-master /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default

    # Test and reload Nginx
    sudo nginx -t
    sudo systemctl reload nginx
    sudo systemctl enable nginx

    print_success "Nginx configuration completed"
}

create_systemd_services() {
    print_step "Creating systemd services..."

    # Create backend service
    sudo tee /etc/systemd/system/book-master-backend.service > /dev/null <<EOF
[Unit]
Description=Book Master Backend API
Documentation=https://github.com/campbellhealyRDG/book-master
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR/backend
Environment=NODE_ENV=production
Environment=PORT=$BACKEND_PORT
Environment=DATABASE_PATH=$DATA_DIR/database/book-master.db
Environment=LOG_LEVEL=info
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
KillMode=process
StandardOutput=journal
StandardError=journal
SyslogIdentifier=book-master-backend

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DATA_DIR $LOG_DIR

[Install]
WantedBy=multi-user.target
EOF

    # Create frontend service
    sudo tee /etc/systemd/system/book-master-frontend.service > /dev/null <<EOF
[Unit]
Description=Book Master Frontend
Documentation=https://github.com/campbellhealyRDG/book-master
After=network.target book-master-backend.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR/frontend
Environment=NODE_ENV=production
Environment=PORT=$FRONTEND_PORT
Environment=VITE_API_BASE_URL=http://localhost:$BACKEND_PORT
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
KillMode=process
StandardOutput=journal
StandardError=journal
SyslogIdentifier=book-master-frontend

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable services
    sudo systemctl daemon-reload
    sudo systemctl enable book-master-backend
    sudo systemctl enable book-master-frontend

    print_success "Systemd services created"
}

setup_logging() {
    print_step "Setting up application logging..."

    # Create log rotation configuration
    sudo tee /etc/logrotate.d/book-master > /dev/null <<EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    su $SERVICE_USER $SERVICE_USER
}
EOF

    # Create rsyslog configuration
    sudo tee /etc/rsyslog.d/50-book-master.conf > /dev/null <<EOF
# Book Master application logs
if \$programname == 'book-master-backend' then $LOG_DIR/backend.log
if \$programname == 'book-master-frontend' then $LOG_DIR/frontend.log
& stop
EOF

    sudo systemctl restart rsyslog

    print_success "Logging configuration completed"
}

setup_firewall() {
    print_step "Configuring firewall..."

    # Install and configure UFW if not already installed
    if ! command -v ufw &> /dev/null; then
        sudo apt install -y ufw
    fi

    # Configure firewall rules
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80/tcp comment 'HTTP for Book Master'
    sudo ufw allow 443/tcp comment 'HTTPS for Book Master'
    sudo ufw --force enable

    print_success "Firewall configured"
}

install_application() {
    print_step "Installing application dependencies..."

    # Install frontend dependencies and build
    cd "$INSTALL_DIR/frontend"
    sudo -u "$SERVICE_USER" npm install
    sudo -u "$SERVICE_USER" npm run build

    # Install backend dependencies
    cd "$INSTALL_DIR/backend"
    sudo -u "$SERVICE_USER" npm install

    print_success "Application dependencies installed"
}

start_services() {
    print_step "Starting Book Master services..."

    # Start backend first
    sudo systemctl start book-master-backend
    sleep 5

    # Start frontend
    sudo systemctl start book-master-frontend
    sleep 5

    # Check service status
    if systemctl is-active --quiet book-master-backend && systemctl is-active --quiet book-master-frontend; then
        print_success "All services started successfully"
    else
        print_error "Some services failed to start. Check logs with: sudo journalctl -u book-master-backend -u book-master-frontend"
        exit 1
    fi
}

create_backup_script() {
    print_step "Creating backup script..."

    sudo tee /usr/local/bin/book-master-backup > /dev/null <<'EOF'
#!/bin/bash
# Book Master Backup Script

BACKUP_DIR="/var/backups/book-master"
DATE=$(date +%Y%m%d_%H%M%S)
DATA_DIR="/var/lib/book-master"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
echo "Backing up database..."
sqlite3 "$DATA_DIR/database/book-master.db" ".backup $BACKUP_DIR/book-master_$DATE.db"

# Compress old backups
find "$BACKUP_DIR" -name "*.db" -mtime +7 -exec gzip {} \;

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/book-master_$DATE.db"
EOF

    sudo chmod +x /usr/local/bin/book-master-backup

    # Create daily backup cron job
    echo "0 2 * * * root /usr/local/bin/book-master-backup" | sudo tee -a /etc/crontab

    print_success "Backup script created"
}

print_completion_info() {
    echo -e "${GREEN}"
    echo "=================================================="
    echo "       Installation Completed Successfully!"
    echo "=================================================="
    echo -e "${NC}"

    echo -e "${BLUE}Access Information:${NC}"
    echo "  🌐 Web Interface: http://$PI_IP"
    echo "  📱 Local Access:  http://localhost"
    echo "  🔧 API Endpoint:  http://$PI_IP/api"

    echo ""
    echo -e "${BLUE}Service Management:${NC}"
    echo "  📊 Check Status:  sudo systemctl status book-master-backend book-master-frontend"
    echo "  🔄 Restart:       sudo systemctl restart book-master-backend book-master-frontend"
    echo "  📋 View Logs:     sudo journalctl -u book-master-backend -f"
    echo "  💾 Backup Data:   sudo /usr/local/bin/book-master-backup"

    echo ""
    echo -e "${BLUE}File Locations:${NC}"
    echo "  📁 Application:   $INSTALL_DIR"
    echo "  💾 Data:          $DATA_DIR"
    echo "  📄 Logs:          $LOG_DIR"
    echo "  ⚙️  Configuration: /etc/nginx/sites-available/book-master"

    echo ""
    echo -e "${YELLOW}Security Notes:${NC}"
    echo "  🔐 Consider setting up HTTPS with: sudo certbot --nginx"
    echo "  🛡️  Firewall is enabled with minimal required ports"
    echo "  👤 Application runs as non-root user: $SERVICE_USER"

    echo ""
    echo -e "${GREEN}Enjoy using Book Master!${NC}"
}

# Main installation process
main() {
    print_header

    # Check if running as root or with sudo
    if [ "$EUID" -eq 0 ] && [ -z "$SUDO_USER" ]; then
        print_error "Please run this script with sudo, not as root directly"
        exit 1
    fi

    if [ "$EUID" -ne 0 ]; then
        print_error "This script requires sudo privileges"
        exit 1
    fi

    check_requirements
    install_dependencies
    create_directories
    deploy_application
    setup_database
    install_application
    configure_nginx
    create_systemd_services
    setup_logging
    setup_firewall
    start_services
    create_backup_script

    print_completion_info
}

# Run main function
main "$@"