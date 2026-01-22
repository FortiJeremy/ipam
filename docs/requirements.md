# Requirements

## Functional Requirements
1. **Subnet Management**: Ability to create, edit, and delete IPv4 subnets (CIDR notation).
2. **IP Allocation**:
   - Manually assign an IP address to a device.
   - Designate IPs as Static, Reserved, or DHCP Pool.
   - Track MAC addresses for each assigned IP.
3. **Device Inventory**:
   - Store device names, manufacturers, and types (e.g., Server, Desktop, IoT, Camera). Should contain a list of active ports, and provide access links to any hosted applications. (User defined).
   - Link multiple IPs to a single device (e.g., WiFi and Ethernet).
   - Optionally enable healthchecks for a given device - frequency of check should be globally defined.
4. **Visualisation**:
   - A dashboard showing an overview of all subnets and their occupancy status.
   - A list view of all devices.
   - An 'unclaimed and in use' section that needs identifying
5. **Search & Filter**:
   - Search by IP, MAC, Name, or Tag.
   - Filter by subnet or device type.

## Non-Functional Requirements
1. **Lightweight**: Should run comfortably on a Raspberry Pi or small VM.
2. **Responsive UI**: Accessible via desktop and mobile browsers.
3. **Data Integrity**: Ensure no duplicate IP assignments within the same subnet.
4. **Security**: Local-only access by default, but should support basic authentication.
5. **Healthcheck**: Should be able to check the health of a device with a simple ping
