# FlowQuest - Video as a Primitive

> **North Star**: A user plays a 45–60s video preview of a "Sales Quote Explainer," tweaks 2–3 checkpoints (budget/scope/timeline), and exports a Proof Pack (PDF + ICS + MD). When a checkpoint changes, only the affected shot re-renders in seconds and exports always match the video via a signed Outcome Receipt.

**Performance Targets**: TVO < 120s, VLT P50 ≤ 3s, delta ≤ 3s/shot P95.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Make (optional but recommended)

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd FlowQuest
make setup  # Installs deps, creates env, starts services, runs migrations
```

### 2. Start Development

```bash
make dev    # Starts frontend + backend with hot reload
```

Visit:
- 🎥 **Frontend**: http://localhost:3000
- 🔧 **API Docs**: http://localhost:8000/docs
- 📊 **MinIO Console**: http://localhost:9001 (minio/minio123)

### 3. Try the Demo

1. Go to http://localhost:3000
2. Click "Sales Quote Explainer" template
3. Fill in company details → Generate preview
4. Tweak budget/timeline → Watch delta rendering
5. Export PDF + Calendar → Verify content matches video

## 🏗️ Architecture

```
┌─ app/web (Next.js 14)          # React frontend with Tailwind + shadcn/ui
├─ app/server (FastAPI)          # Python backend with video processing
├─ app/packages/
│  ├─ common-schemas             # Shared TypeScript + Pydantic schemas
│  └─ renderer-tier0             # Canvas/WebGL video compositor
├─ app/infra/                    # Docker compose + deployment
└─ docs/                         # API docs + design specs
```

### Tech Stack

**Frontend**: Next.js 14, TypeScript (strict), Tailwind, shadcn/ui, Zustand, HLS.js, Zod  
**Backend**: FastAPI, Python 3.11, Pydantic v2, SQLAlchemy, Alembic  
**Video**: Canvas/WebGL compositor → HLS with ffmpeg  
**LLM**: OpenAI GPT-4 / Anthropic Claude (with Safe Mode fallback)  
**Storage**: PostgreSQL + Redis + S3/MinIO  
**Infra**: Docker Compose, GitHub Actions, OpenTelemetry

## 🎯 Core Features

### 1. **Video-as-a-Primitive**
- Templates generate interactive video previews in ~3s
- Edit video content like filling out a form
- Real-time preview updates with sub-3s delta rendering

### 2. **Delta Rendering Engine**
- Only affected shots re-render when values change
- Deterministic caching via `{seed, bindingsHash, style}`
- Crossfade stitching maintains smooth playback

### 3. **Export Ecosystem**  
- PDF, ICS (calendar), Markdown, CSV exports
- **Outcome Receipt** cryptographically links video ↔ files
- Verifier ensures content consistency

### 4. **Template System**
- YAML-based template definitions
- Checkpoint-driven interactivity
- Built-in validation rules

## 📋 Available Commands

```bash
make help           # Show all commands
make dev            # Start development environment
make test           # Run all tests
make acceptance     # Run acceptance test suite
make build          # Build for production
make clean          # Clean up containers and artifacts
```

## 🎨 Design System

**Aesthetic**: Futuristic, elegant, minimalist, cinematic - "Apple keynote meets sci-fi HUD"

**Colors**:
- Background: `#0B0F14` with aurora gradients
- Primary: `#7EA6FF` → `#21D4FD`
- Accent: `#9BFFCE`, Success: `#3FE081`

**Typography**: Inter, tabular numerics for overlays  
**Glass panels**: backdrop-blur + subtle borders + shadow  
**Motion**: Hover glows, press depress, success ripples

## 🧪 Testing & Quality

### Acceptance Criteria (Must Pass)

1. **Delta Test**: Change budget 16000→14000 ⇒ only shot s2 re-renders; P95 ≤ 3s
2. **Sync Test**: PDF price equals on-video figure; Receipt hashes match
3. **Latency**: Generate → first playable P50 ≤ 3s
4. **TVO**: Template start → exported pack < 120s median
5. **A11y**: axe passes; keyboard nav; captions; reduced motion

```bash
make acceptance     # Run all acceptance tests
make test-delta     # Test delta rendering performance  
make test-sync      # Test content synchronization
make test-a11y      # Test accessibility compliance
```

## 🔐 Security & Auth

- **MLP**: JWT with email magic links + anonymous demo mode
- Private by default with signed S3 URLs
- CORS allowlist + CSP headers + rate limiting
- Outcome Receipt signing (future capability)

## ⚙️ Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Core
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=very-long-random-string

# LLM (choose one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Feature Flags
SAFE_MODE=true              # Use templated heuristics (no external LLM)
HQ_RENDER_ENABLED=false     # Enable high-quality rendering
```

### Performance Tuning

- `MAX_CONCURRENT_RENDERS=4` - Parallel rendering limit
- `RATE_LIMIT_PER_MINUTE=60` - API rate limiting
- `LLM_TIMEOUT=30` - LLM request timeout

## 🚢 Deployment

### Development
```bash
make dev            # Local development with hot reload
make dev-services   # Just infrastructure (DB, Redis, MinIO)
```

### Production
```bash
make build-docker   # Build production images
# Deploy with your orchestrator (K8s, ECS, etc.)
```

## 📊 Monitoring & Observability

- **Metrics**: OpenTelemetry traces + metrics
- **SLOs**: VLT, TVO, delta rerender time, cost per quest
- **Health**: `/health` endpoint + Docker health checks
- **Logs**: Structured logging with PII redaction

## 🔧 Development

### Project Structure

```
app/
├── web/src/
│   ├── app/                 # Next.js 13 app router
│   ├── components/ui/       # shadcn/ui components
│   ├── stores/             # Zustand state management
│   └── lib/                # Utilities, API client
├── server/app/
│   ├── api/                # FastAPI routes
│   ├── engines/            # Core processing engines
│   ├── models/             # SQLAlchemy models
│   └── templates/          # YAML template definitions
└── packages/common-schemas/ # Shared TypeScript + Pydantic schemas
```

### Adding New Templates

1. Create YAML template in `app/server/templates/`
2. Define shots, checkpoints, and validation rules
3. Add to template registry
4. Test with `make test-template TEMPLATE=your_template`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test: `make test`
4. Ensure acceptance tests pass: `make acceptance`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push and create Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: GitHub Issues for bugs and feature requests
- **Docs**: `/docs` folder for detailed technical documentation
- **API**: http://localhost:8000/docs for interactive API documentation

---

**FlowQuest** - Where video content creation meets form simplicity. 🎥✨
