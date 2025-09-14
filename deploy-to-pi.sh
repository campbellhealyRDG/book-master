#!/bin/bash

# Book Master Deployment Script for Raspberry Pi
# This script deploys the application to the Pi using the credentials in .env

set -e  # Exit on any error

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

PI_USER="campbell"
PI_HOST="192.168.1.123"
PI_PASSWORD="1234qwe"
REPO_URL="https://github.com/campbellhealyRDG/book-master.git"

echo "🚀 Starting Book Master deployment to Raspberry Pi..."
echo "📡 Target: $PI_USER@$PI_HOST"

# Function to run commands on Pi via SSH
run_on_pi() {
    local cmd="$1"
    echo "🔧 Running on Pi: $cmd"
    sshpass -p "$PI_PASSWORD" ssh -o StrictHostKeyChecking=no "$PI_USER@$PI_HOST" "$cmd"
}

# Function to copy files to Pi
copy_to_pi() {
    local src="$1"
    local dest="$2"
    echo "📂 Copying $src to Pi:$dest"
    sshpass -p "$PI_PASSWORD" scp -r -o StrictHostKeyChecking=no "$src" "$PI_USER@$PI_HOST:$dest"
}

echo "🔍 Step 1: Checking Pi system status..."
run_on_pi "uname -a"

echo "📦 Step 2: Installing Docker if needed..."
run_on_pi "if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh &&
    sudo sh get-docker.sh &&
    sudo usermod -aG docker $PI_USER &&
    sudo systemctl enable docker &&
    sudo systemctl start docker
fi"

echo "📦 Step 3: Installing Docker Compose if needed..."
run_on_pi "if ! command -v docker-compose &> /dev/null; then
    sudo apt-get update &&
    sudo apt-get install -y docker-compose-plugin ||
    sudo pip3 install docker-compose
fi"

echo "🗂️ Step 4: Preparing project directory..."
run_on_pi "mkdir -p ~/book-master && cd ~/book-master"

echo "📥 Step 5: Cloning/updating repository..."
run_on_pi "cd ~ && if [ -d book-master/.git ]; then
    cd book-master && git pull origin main;
else
    rm -rf book-master && git clone $REPO_URL book-master;
fi"

echo "🐳 Step 6: Building and starting Docker containers..."
run_on_pi "cd ~/book-master/deploy &&
    docker-compose down || true &&
    docker-compose build --no-cache &&
    docker-compose up -d"

echo "⏳ Step 7: Waiting for services to start..."
sleep 30

echo "🔍 Step 8: Verifying deployment..."
run_on_pi "docker ps"
run_on_pi "curl -f http://localhost:5173 > /dev/null && echo 'Frontend: ✅ Running' || echo 'Frontend: ❌ Failed'"
run_on_pi "curl -f http://localhost:8000/health > /dev/null && echo 'Backend: ✅ Running' || echo 'Backend: ❌ Failed'"

echo ""
echo "🎉 Deployment completed!"
echo "📱 Access your application at:"
echo "   Frontend: http://192.168.1.123:5173"
echo "   Backend API: http://192.168.1.123:8000"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: ssh $PI_USER@$PI_HOST 'cd ~/book-master/deploy && docker-compose logs'"
echo "   Restart: ssh $PI_USER@$PI_HOST 'cd ~/book-master/deploy && docker-compose restart'"
echo "   Stop: ssh $PI_USER@$PI_HOST 'cd ~/book-master/deploy && docker-compose down'"