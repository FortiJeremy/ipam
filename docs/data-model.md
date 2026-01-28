# Data Model

This document defines the core entities and their relationships.

## Entities

### Subnet
Represents a network range.
- **Name**: Human-readable name (e.g., "Main LAN", "IoT VLAN").
- **Network Address**: e.g., `192.168.1.0`.
- **Prefix Length**: e.g., `24`.
- **Gateway**: Optional gateway IP.
- **VLAN ID**: Optional integer.
- **Description**: Notes about the subnet.
- **Tags**: Customizable labels (e.g., "Critical", "External-Facing").

### IP Address
A specific address within a Subnet.
- **Address**: The actual IP (e.g., `192.168.1.50`).
- **Status**: Enumeration (Allocated, Reserved, Available, DHCP Pool).
- **MAC Address**: Hardware identifier for this specific interface.
- **Device ID**: Link to the device using this IP.
- **Interface Name**: e.g., `eth0`, `wlan0`.
- **Last Seen**: Optional timestamp.
- **Healthcheck Status**: Up / Down / Disabled

### IP Range (Pool)
A logical grouping of addresses within a Subnet.
- **Name**: e.g. "DHCP Scope", "Reserved for Printers".
- **Start IP**: Beginning of the range.
- **End IP**: End of the range.
- **Purpose**: e.g. `DHCP`, `STATIC`.
- **Description**: Optional notes.

### Device
A physical or virtual host.
- **Hostname**: e.g., `nas-01`.
- **Manufacturer**: e.g., `Dell`, `Raspberry Pi Foundation`.
- **Model**: e.g., `Optiplex 7040`.
- **Type**: e.g., `Server`, `Switch`, `IoT`.
- **Tags**: Customizable labels (e.g., "Critical", "External-Facing").
- **Notes**: General information.

## Relationships
- A **Subnet** contains many **IP Addresses**.
- An **IP Address** belongs to exactly one **Subnet**.
- A **Device** can have many **IP Addresses**.
- An **IP Address** can optionally be assigned to one **Device**.
- A **Device** belongs to a **Subnet** through its IP assignments.
- A **Device** may belong to multiple subnets simultaneously.
