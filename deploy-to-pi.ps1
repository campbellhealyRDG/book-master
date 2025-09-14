# Book Master Deployment Script for Raspberry Pi (Windows PowerShell)
# This script deploys the application to the Pi using the credentials in .env

param(
    [switch]$SkipDocker = $false,
    [switch]$ForceRebuild = $false
)

$ErrorActionPreference = "Stop"

# Load environment variables from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

$PI_USER = "campbell"
$PI_HOST = "192.168.1.123"
$PI_PASSWORD = "1234qwe"
$REPO_URL = "https://github.com/campbellhealyRDG/book-master.git"

Write-Host "🚀 Starting Book Master deployment to Raspberry Pi..." -ForegroundColor Green
Write-Host "📡 Target: $PI_USER@$PI_HOST" -ForegroundColor Cyan

# Function to run commands on Pi via SSH
function Invoke-PiCommand {
    param([string]$Command)
    Write-Host "🔧 Running on Pi: $Command" -ForegroundColor Yellow

    # Use putty's plink if available, otherwise use OpenSSH
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        echo y | plink -ssh -l $PI_USER -pw $PI_PASSWORD $PI_HOST $Command
    } else {
        # Try with OpenSSH (may prompt for password)
        ssh -o StrictHostKeyChecking=no $PI_USER@$PI_HOST $Command
    }
}

# Function to test Pi connectivity
function Test-PiConnection {
    Write-Host "🔍 Testing connection to Raspberry Pi..." -ForegroundColor Cyan
    $ping = Test-Connection -ComputerName $PI_HOST -Count 2 -Quiet
    if ($ping) {
        Write-Host "✅ Pi is reachable" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Pi is not reachable" -ForegroundColor Red
        return $false
    }
}

try {
    # Step 1: Test connectivity
    if (-not (Test-PiConnection)) {
        throw "Cannot reach Raspberry Pi at $PI_HOST"
    }

    # Step 2: Check system status
    Write-Host "🔍 Step 1: Checking Pi system status..." -ForegroundColor Cyan
    Invoke-PiCommand "uname -a"

    # Step 3: Update system packages
    Write-Host "📦 Step 2: Updating system packages..." -ForegroundColor Cyan
    Invoke-PiCommand "sudo apt-get update -y"

    # Step 4: Install Docker if not present
    if (-not $SkipDocker) {
        Write-Host "🐳 Step 3: Installing Docker..." -ForegroundColor Cyan
        Invoke-PiCommand @"
            if ! command -v docker &> /dev/null; then
                curl -fsSL https://get.docker.com -o get-docker.sh &&
                sudo sh get-docker.sh &&
                sudo usermod -aG docker $PI_USER &&
                sudo systemctl enable docker &&
                sudo systemctl start docker &&
                echo 'Docker installed successfully'
            else
                echo 'Docker already installed'
            fi
"@
    }

    # Step 5: Install Docker Compose
    Write-Host "📦 Step 4: Installing Docker Compose..." -ForegroundColor Cyan
    Invoke-PiCommand @"
        if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
            sudo apt-get install -y docker-compose-plugin ||
            (sudo apt-get install -y python3-pip && sudo pip3 install docker-compose) &&
            echo 'Docker Compose installed successfully'
        else
            echo 'Docker Compose already installed'
        fi
"@

    # Step 6: Clone/update repository
    Write-Host "📥 Step 5: Setting up repository..." -ForegroundColor Cyan
    Invoke-PiCommand @"
        cd ~ &&
        if [ -d book-master/.git ]; then
            echo 'Updating existing repository...' &&
            cd book-master &&
            git fetch origin &&
            git reset --hard origin/main &&
            git pull origin main
        else
            echo 'Cloning fresh repository...' &&
            rm -rf book-master &&
            git clone $REPO_URL book-master
        fi &&
        echo 'Repository ready'
"@

    # Step 7: Build and deploy
    Write-Host "🏗️ Step 6: Building and starting containers..." -ForegroundColor Cyan
    $buildFlag = if ($ForceRebuild) { "--no-cache" } else { "" }

    Invoke-PiCommand @"
        cd ~/book-master/deploy &&
        echo 'Stopping existing containers...' &&
        docker-compose down || true &&
        echo 'Building containers...' &&
        docker-compose build $buildFlag &&
        echo 'Starting containers...' &&
        docker-compose up -d &&
        echo 'Containers started'
"@

    # Step 8: Wait for services
    Write-Host "⏳ Step 7: Waiting for services to initialize..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30

    # Step 9: Verify deployment
    Write-Host "🔍 Step 8: Verifying deployment..." -ForegroundColor Cyan
    Invoke-PiCommand "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

    Write-Host "🧪 Testing application endpoints..." -ForegroundColor Cyan
    try {
        Invoke-PiCommand "curl -f -s http://localhost:5173 > /dev/null && echo 'Frontend: ✅ Running on port 5173' || echo 'Frontend: ❌ Not responding'"
        Invoke-PiCommand "curl -f -s http://localhost:8000 > /dev/null && echo 'Backend: ✅ Running on port 8000' || echo 'Backend: ❌ Not responding'"
    } catch {
        Write-Host "⚠️ Endpoint tests may require curl installation on Pi" -ForegroundColor Yellow
    }

    # Success message
    Write-Host ""
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Access your application at:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://192.168.1.123:5173" -ForegroundColor White
    Write-Host "   Backend API: http://192.168.1.123:8000" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Management commands:" -ForegroundColor Cyan
    Write-Host "   View logs: ssh $PI_USER@$PI_HOST 'cd ~/book-master/deploy && docker-compose logs'" -ForegroundColor Gray
    Write-Host "   Restart: ssh $PI_USER@$PI_HOST 'cd ~/book-master/deploy && docker-compose restart'" -ForegroundColor Gray
    Write-Host "   Stop: ssh $PI_USER@$PI_HOST 'cd ~/book-master/deploy && docker-compose down'" -ForegroundColor Gray
    Write-Host "   Update: ./deploy-to-pi.ps1 -ForceRebuild" -ForegroundColor Gray

} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Verify Pi is powered on and connected to network"
    Write-Host "2. Test SSH: ssh $PI_USER@$PI_HOST"
    Write-Host "3. Check Pi system status manually"
    Write-Host "4. Retry with -SkipDocker if Docker is already installed"
    exit 1
}