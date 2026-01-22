# Architecture & Tech Stack

## System Design
The application will follow a simple Client-Server architecture, built in an entirely containerized fashion. 

1. **Frontend**: A Single Page Application (SPA) using client-side routing. This allows for nearly instantaneous switching between different "views" (Subnets, Devices, Health) without a full page reload, providing a desktop-app feel.
2. **Backend API**: A RESTful or GraphQL API that handles business logic, device scanning, and database interactions.
3. **Database**: A relational database to ensure data integrity, especially for unique IP assignments.

## Tech Stack
- **Frontend**: React with Tailwind CSS, React Router, and Lucide Icons.
- **Backend**: Python FastAPI with SQLAlchemy and `uv` for dependency management.
- **Network Scanning**: Nmap, Scapy, and standard ping utilities.
- **Database**: SQLite with Alembic for migrations.
- **Containerization**: Docker & Docker Compose (Multi-stage builds for production optimization).

## Architecture Details
- **Frontend**: A Single Page Application (SPA) served by Nginx. It proxies API requests to the backend.
- **Backend API**: Stateless FastAPI application with a background discovery thread.
- **Background Worker**: A standard Python thread within the FastAPI process (The "Brain") handles network discovery and health checks.

## User Interface Flow & Views
The SPA will provide several distinct views to visualize the network differently:
1. **Dashboard**: High-level stats (Total IPs, Subnets, Available capacity, Health Summary).
2. **Subnet View**: A network-centric view showing a grid or list of every IP in a specific subnet and its occupancy.
3. **Device View**: A device-centric view listing all registered hardware, regardless of subnet.
4. **Online/Live View**: A real-time (or near real-time) view focusing on currently discovered/active devices, highlighting "unclaimed" IPs that are responding to pings.
5. **Settings**: Backup/Restore, User preferences, Scan frequency configuration.
