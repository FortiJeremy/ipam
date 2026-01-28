# API Endpoints Documentation

This document outlines the RESTful API endpoints implemented in the IPAM backend.

## Base URL
- **Direct Backend**: `http://localhost:8000`
- **Frontend Proxy**: `/api/` (when accessing via the frontend port 8080)

## Documentation & Interactive Testing
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Subnets
Manage network ranges.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/subnets/` | List all subnets (supports `skip` and `limit` pagination). |
| `POST` | `/subnets/` | Create a new subnet record. |
| `GET` | `/subnets/{id}` | Retrieve details for a specific subnet. |
| `PUT` | `/subnets/{id}` | Update an existing subnet. |
| `DELETE` | `/subnets/{id}` | Remove a subnet (and its associated IP records). |

### Subnet Schema (Simplified)
- `name`: (string) e.g., "Main LAN"
- `network_address`: (string) e.g., "192.168.1.0"
- `prefix_length`: (int) e.g., 24
- `gateway`: (string, optional)
- `vlan_id`: (int, optional)
- `description`: (string, optional)
- `tags`: (string, optional)

---

## Devices
Manage physical or virtual hosts.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/devices/` | List all devices. |
| `POST` | `/devices/` | Register a new device. |
| `GET` | `/devices/{id}` | Retrieve specific device details. |
| `PUT` | `/devices/{id}` | Update a device record. |
| `DELETE` | `/devices/{id}` | Remove a device record. |
| `POST` | `/devices/{id}/assign` | Assign an IP address to a device with optional `interface_name`. |

### Device Schema (Simplified)
- `hostname`: (string) e.g., "nas-01"
- `manufacturer`: (string, optional)
- `model`: (string, optional)
- `device_type`: (string, optional) e.g., "Server", "IoT"
- `tags`: (string, optional)
- `notes`: (string, optional)

---

## IP Addresses
Manage individual IP assignments and status.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/ips/` | List IP addresses. Supports `subnet_id` filtering and pagination. |
| `POST` | `/ips/` | Assign an IP address to a subnet and/or device. |
| `GET` | `/ips/{id}` | Retrieve specific IP details. |
| `PUT` | `/ips/{id}` | Update an IP status, MAC address, device assignment, or interface name. |
| `DELETE` | `/ips/{id}` | Unregister an IP record. |

### IP Address Schema (Simplified)
- `address`: (string) e.g., "192.168.1.50"
- `status`: (string) "Allocated", "Reserved", "Available", "DHCP Pool"
- `mac_address`: (string, optional)
- `interface_name`: (string, optional) e.g., "eth0"
- `subnet_id`: (int) Reference to the parent Subnet.
- `device_id`: (int, optional) Reference to the assigned Device.

---

## IP Ranges (Pools)
Manage logical groupings of IP addresses within a subnet (e.g., DHCP scopes).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/ranges/` | List all IP ranges. Supports `subnet_id` filtering. |
| `POST` | `/ranges/` | Create a new IP range. |
| `GET` | `/ranges/{id}` | Retrieve details for a specific range. |
| `PUT` | `/ranges/{id}` | Update an existing range. |
| `DELETE` | `/ranges/{id}` | Remove a range. |

### IP Range Schema (Simplified)
- `name`: (string) e.g., "Guest WiFi Scope"
- `start_ip`: (string) e.g., "192.168.1.100"
- `end_ip`: (string) e.g., "192.168.1.200"
- `purpose`: (string) e.g., "DHCP", "STATIC"
- `description`: (string, optional)
- `subnet_id`: (int) Reference to the parent Subnet.

---

## Provisioning & Maintenance
Advanced automation and system health.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/subnets/{id}/next-available` | Find the first free numeric hole in a CIDR block or logical Pool. |
| `POST` | `/maintenance/validate` | Re-align all IPs to their correct subnets based on CIDR boundaries. |
| `DELETE` | `/maintenance/purge-discovered` | Clean up "Discovered" IPs that have fallen out of the last-seen window. |

---

## Technical Details
- **Database**: SQLite (`ipam.db`)
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Auto-Update**: Migrations are applied automatically on container startup via `docker-compose`.
