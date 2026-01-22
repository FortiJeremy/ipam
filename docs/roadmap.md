# Development Roadmap

This roadmap breaks the IPAM project into logical phases, ensuring a stable foundation before adding complexity.

## Phase 1: Environment & Project Scaffolding
- [x] Set up project structure (Backend and Frontend folders).
- [x] Initialize Python environment using `uv` and FastAPI skeleton.
- [x] Initialize React project with Tailwind CSS and React Router.
- [x] Create `docker-compose.yml` for local development.

## Phase 2: Core Data Engine (Backend)
- [x] Define SQLAlchemy (or SQLModel) models for Subnets, IPs, and Devices.
- [x] Set up migrations (Alembic) for the SQLite database.
- [x] Implement basic CRUD APIs (Create, Read, Update, Delete) for Subnets.
- [x] Implement basic CRUD APIs for Devices and IP Assignments.

## Phase 3: The "Brain" (Network Discovery & Health)
- [x] Implement background task for Ping-based health checks.
- [x] Implement "Discovery" service to scan network ranges (Nmap/Scapy).
- [x] Implement logic to identify "Unclaimed and In Use" IPs.
- [x] Store scan results in the database (updating "Last Seen").

## Phase 4: Foundational Frontend
- [x] Create basic layout (Sidebar navigation, Header).
- [x] Implement Dashboard view with summary statistics from the API.
- [x] Build reusable UI components (Table, Status Badge, Modal).

## Phase 5: Functional Views (Frontend)
- [x] **Subnet View**: Interactive grid/list of a subnet's IP range.
- [x] **Device View**: Filterable table of all devices.
- [x] **Online/Live View**: List of currently active/discovered hosts.
- [x] **Edit Forms**: Modals for adding subnets and assigning IPs.

## Phase 6: Refinement & Deployment
- [ ] Add basic authentication layer.
- [x] Optimize Docker image for size (Multi-stage builds).
- [x] Finalize documentation (README, setup guide).
- [ ] (Future) Integration with Technitium DNS or Firewall connectors.
