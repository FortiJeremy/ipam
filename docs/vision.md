# Project IPAM - Vision

## Purpose
The goal is to create a lightweight, self-hosted IP Address Management (IPAM) tool specifically designed for home labs and small home networks (maximum total ip's of 4096). It should provide a clear overview of IP allocations, subnets, and device assignments, as well as have an easy way to allocate IP's on-demand.

## Core Values
- **Simplicity**: Easy to install and use without complex enterprise overhead. (self contained in a single container)
- **Clarity**: Visual representation of IP ranges and usage.
- **Portability**: Data should be easy to back up and migrate.
- **Human-Centric**: Use human-readable labels and descriptions for all technical entities.
- **Discoverability**: This system should have a way to discover and ingest new devices that aren't manually added - passively listening and active scans of networks.

## Future Goals
- Integration with local DNS/DHCP servers (technitium dns).
- Automatic scanning for rogue or new devices.
- API access for automation scripts.
- Advanced network scanning to check tcp/udp ports the device is listening on.
- IPv6 support
- Special DHCP Scope Handling
- Firewall Connector (Push device as firewall object with 1 click)
