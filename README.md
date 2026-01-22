# IPAM - Network Discovery & IP Management

A modern, fast, and automated IP Address Management (IPAM) tool with network discovery capabilities. Designed for small to medium networks where knowing "what is on my network" is as important as "what should be on my network."

## Features
- **Network Discovery**: Automatic scanning of subnets using Nmap and Scapy.
- **Inventory Management**: Track subnets, IP assignments, and devices.
- **Health Monitoring**: Background ping checks to keep device status updated.
- **Modern UI**: Clean, responsive dashboard built with React and Tailwind CSS.
- **Dockerized**: Easy deployment with Docker Compose.

---

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ipam.git
cd ipam
```

### 2. Launch with Docker Compose
```bash
docker compose up -d --build
```
This will:
- Build the optimized **Python/FastAPI** backend using multi-stage `uv` builds.
- Build the **React** frontend and serve it via an **Nginx Alpine** container.
- Initialize the SQLite database and run migrations.

### 3. Access the Application
- **Frontend Dashboard**: [http://localhost:8080](http://localhost:8080)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs) (Direct access)
- **API Proxy**: Frontend communicates with the backend via the `/api/` proxy on port 8080.

---

## Documentation
The `docs/` folder contains detailed information about the project:
- [Architecture](docs/architecture.md) - System design and technical stack.
- [Data Model](docs/data-model.md) - Database schema and entity relationships.
- [API Endpoints](docs/endpoints.md) - List of available FastAPI endpoints.
- [Project Vision](docs/vision.md) - The "Why" behind this tool.
- [Roadmap](docs/roadmap.md) - Current progress and future plans.

## Development Status
We are currently in **Phase 6: Refinement & Deployment**.
- [x] Optimized Docker images for size.
- [x] Production-ready Nginx frontend serving.
- [x] Automated backend discovery background worker.

## License
MIT
