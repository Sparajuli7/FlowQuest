#!/bin/bash

echo "🔍 FlowQuest System Diagnostic"
echo "=============================="

# Check if Docker services are running
echo -e "\n📦 Docker Services Status:"
docker-compose -f app/infra/docker-compose.yml ps

# Check if database is accessible
echo -e "\n🗄️ Database Connection:"
docker exec -it $(docker ps -qf "name=postgres") psql -U flowquest -d flowquest -c "\dt" 2>/dev/null || echo "❌ Database not accessible"

# Check if Redis is running
echo -e "\n💾 Redis Status:"
docker exec -it $(docker ps -qf "name=redis") redis-cli ping 2>/dev/null || echo "❌ Redis not running"

# Check for .env file
echo -e "\n🔐 Environment Configuration:"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "Checking for required keys:"
    grep -q "OPENAI_API_KEY\|ANTHROPIC_API_KEY" .env && echo "✅ LLM keys found" || echo "❌ LLM keys missing"
    grep -q "DATABASE_URL" .env && echo "✅ Database URL found" || echo "❌ Database URL missing"
else
    echo "❌ .env file missing - creating from template..."
    cp env.example .env
fi

# Check if frontend can build
echo -e "\n🎨 Frontend Build Check:"
cd app/web && npm list 2>/dev/null | head -5 || echo "❌ Frontend dependencies not installed"

# Check if backend requirements are installed
echo -e "\n🐍 Backend Dependencies:"
cd ../server && python -c "import fastapi, sqlalchemy" 2>/dev/null && echo "✅ Core Python packages installed" || echo "❌ Python dependencies missing"

# Check for test files
echo -e "\n🧪 Test Infrastructure:"
find . -name "*.test.*" -o -name "*.spec.*" | wc -l | xargs -I {} echo "Found {} test files"

echo -e "\n📊 Diagnostic Complete!"