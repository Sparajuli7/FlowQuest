# FlowQuest - Quick Start Guide 🚀

Choose the approach that works best for your setup:

## 🐳 **Option 1: Docker Approach (Recommended)**

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)

### Steps
```bash
# 1. Start Docker Desktop, then run:
cd /Users/shreyashparajuli/Downloads/FlowQuest

# 2. Start infrastructure services
cd app/infra
docker-compose up -d postgres redis minio

# 3. Wait for services to be ready (about 30 seconds)
docker-compose logs

# 4. Set up Python backend
cd ../server
pip install -r requirements.txt
python -m alembic upgrade head

# 5. Start FastAPI backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 6. In a new terminal, set up frontend
cd /Users/shreyashparajuli/Downloads/FlowQuest/app/packages/common-schemas
npm install && npm run build

cd ../../../web
npm install
npm run dev
```

### Access Points
- 🎥 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000/docs
- 📊 **MinIO Console**: http://localhost:9001 (minio/minio123)

## 💻 **Option 2: Local Development (No Docker)**

If you prefer to run everything locally:

### Prerequisites
- PostgreSQL 15+ running locally
- Redis running locally
- Node.js 18+
- Python 3.11+

### Setup
```bash
# 1. Update .env file with local database URLs:
# DATABASE_URL=postgresql://username:password@localhost:5432/flowquest
# REDIS_URL=redis://localhost:6379

# 2. Create database
createdb flowquest

# 3. Follow steps 4-6 from Docker approach above
```

## 🚀 **Option 3: Quick Demo (Frontend Only)**

To just see the FlowQuest UI without backend:

```bash
cd /Users/shreyashparajuli/Downloads/FlowQuest/app/web
npm install
npm run dev
```

Visit http://localhost:3000 to see the templates page and UI components.

## 🔍 **Verification**

Once running, test the system:

1. **Frontend**: Go to http://localhost:3000
2. **Templates Page**: Click "Sales Quote Explainer" 
3. **Quest Generation**: Fill out the form and click "Generate Quest"
4. **API Health**: Check http://localhost:8000/health
5. **Interactive Docs**: Explore http://localhost:8000/docs

## 🐛 **Common Issues**

### Docker Issues
- **"Docker daemon not running"**: Start Docker Desktop
- **Port conflicts**: Stop other services on ports 3000, 8000, 5432, 6379, 9000

### NPM Issues
- **Workspace errors**: Run `npm install` in each package directory individually
- **Permission errors**: Try `sudo npm install -g npm@latest`

### Python Issues
- **Module not found**: Ensure you're in `/app/server` directory when running Python commands
- **Database connection**: Check PostgreSQL is running and credentials in `.env`

## 📚 **Next Steps**

- **Try the demo**: Create a sales quote and export PDF
- **Explore the code**: Check `/app/web/src/components` for UI components
- **API testing**: Use the Swagger UI at `/docs`
- **Customize templates**: Edit `/app/server/templates/sales_quote_v1.yaml`

## 🆘 **Get Help**

- Check the main `README.md` for detailed documentation
- View `IMPLEMENTATION_STATUS.md` for technical details
- All logs are available with `make logs` (if Docker is running)

---

**FlowQuest**: Where video content creation meets form simplicity! 🎥✨
