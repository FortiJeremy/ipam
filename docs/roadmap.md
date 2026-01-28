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
- [x] **Allocation Engine**: Integrated "Find Next Available IP" workflow across all entry points.
- [x] **Data Integrity**: Automated validation tools for recurring IP/Subnet reconciliation.

## Phase 6: Resilience & Automation (Active)
- [x] **IP Pool Awareness**: Backend logic for subnet/pool specific allocation.
- [x] **Interface Meta**: Tracking physical interface names per IP assignment.
- [x] **Maintenance Hub**: Data validation and orphan-purge tools in Settings.
- [x] **Unified UI**: Consistent assignment experience across all views.
- [ ] **Enhanced Scanning**: Visual progress bars and more granular scanner feedback.

## Phase 7: Refinement & Security
- [ ] **Authentication**: Add basic JWT-based login layer.
- [ ] **Export Engine**: CSV/JSON export for reporting and backups.

## Phase 8: Scaling & Integration
- [ ] **Seeding Tools**: Bulk CSV/JSON import for initial subnet and device data.
- [ ] **Proactive Brain**: TCP/UDP port scanning to identify services on hosts.
- [ ] **Scheduled Scans**: UI-configurable scan frequencies per network.
- [ ] **External Connectors**: (Future) Technitium DNS or Firewall API integrations.

## Ongoing Maintenance (Per-Release Tasks)
- [ ] **Docker Optimization**: Maintain multi-stage builds and monitor image size.
- [ ] **Documentation Audit**: Ensure README, API docs, and architecture diagrams match latest code.
- [ ] **Dependency Management**: Regular updates of Python (`uv`) and Node package dependencies.
- [ ] **UI/UX Consistency**: Frequent audits of fonts, colors, and responsive behaviors.
- [ ] **Database Migrations**: Proper handling of schema changes via Alembic.
