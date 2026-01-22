# The Brain: Network Discovery & Health Engine

"The Brain" is the background service responsible for keeping the IPAM data synchronized with the actual state of the network.

## Core Functions

### 1. Health Monitoring (Pinging)
- **What**: Performs an ICMP Echo Request (Ping) to every IP address registered in the database.
- **When**: Runs continuously as part of the main brain loop.
- **Impact**: Updates the `healthcheck_status` (Online/Offline) and `last_seen` timestamp for each record.

### 2. Network Discovery (ARP & ICMP Scanning)
- **What**: Scans entire subnet ranges using two methods:
    - **ARP Scanning**: Sends ARP requests to all addresses in the range. Fast and reliable for discovering MAC addresses on the local network segment.
    - **ICMP Scanning**: Performs a parallel ping sweep of the entire range. This allows the Brain to "see" hosts on routed subnets (Layer 3) that are not directly on the same physical wire as the container.
- **When**: 
    - **Initial Scan**: Triggered immediately when a new Subnet is added to the system.
    - **Periodic Scan**: Runs for all subnets every **15 minutes**.
- **Impact**:
    - Updates `last_seen` and `mac_address` for known IPs.
    - Automatically creates new records for previously unknown hosts, marking them with the `DISCOVERED` status.

### 3. Scan Status Tracking
- Each subnet tracks its own discovery state:
    - **Last Scan**: Timestamp of the most recently completed discovery.
    - **Scan Status**: Current state (e.g., "Idle", "Scanning", "Error").

## Technical Architecture
- **Raw Sockets**: Uses Scapy with `NET_ADMIN` capabilities to send and receive raw network packets.
- **Threading**: Runs as a daemonized background thread within the FastAPI application process.
- **Database Synchronization**: Uses SQLAlchemy to atomicly update IP records based on scan results.

## Limitations
- **Layer 2 Requirement**: ARP scanning only works for subnets that are directly reachable at Layer 2 (the same broadcast domain) from the IPAM container.
- **Firewalls**: Hosts blocking ICMP will appear as "Offline" even if they are active, though ARP scanning will still detect their presence on the local segment.
