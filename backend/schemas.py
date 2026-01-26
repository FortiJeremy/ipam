from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

class IPStatus(str, Enum):
    ALLOCATED = "ALLOCATED"
    RESERVED = "RESERVED"
    AVAILABLE = "AVAILABLE"
    DHCP_POOL = "DHCP_POOL"
    DISCOVERED = "DISCOVERED"

# Base schemas
class SubnetBase(BaseModel):
    name: str
    network_address: str
    prefix_length: int
    gateway: Optional[str] = None
    vlan_id: Optional[int] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    last_scan: Optional[datetime] = None
    scan_status: Optional[str] = "Idle"

class SubnetCreate(SubnetBase):
    pass

class SubnetUpdate(BaseModel):
    name: Optional[str] = None
    network_address: Optional[str] = None
    prefix_length: Optional[int] = None
    gateway: Optional[str] = None
    vlan_id: Optional[int] = None
    description: Optional[str] = None
    tags: Optional[str] = None

class SubnetStats(BaseModel):
    total: int
    assigned: int
    discovered: int
    free: int

class Subnet(SubnetBase):
    id: int
    stats: Optional[SubnetStats] = None
    model_config = ConfigDict(from_attributes=True)

class DeviceBase(BaseModel):
    hostname: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    device_type: Optional[str] = None
    tags: Optional[str] = None
    notes: Optional[str] = None

class DeviceCreate(DeviceBase):
    ip_address: Optional[str] = None

class DeviceUpdate(BaseModel):
    hostname: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    device_type: Optional[str] = None
    tags: Optional[str] = None
    notes: Optional[str] = None
    ip_address: Optional[str] = None

class Device(DeviceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class IPAddressBase(BaseModel):
    address: str
    hostname: Optional[str] = None
    status: IPStatus = IPStatus.AVAILABLE
    mac_address: Optional[str] = None
    interface_name: Optional[str] = None
    healthcheck_status: Optional[str] = None
    subnet_id: int
    device_id: Optional[int] = None

class IPAddressCreate(IPAddressBase):
    pass

class IPAddressUpdate(BaseModel):
    hostname: Optional[str] = None
    status: Optional[IPStatus] = None
    mac_address: Optional[str] = None
    interface_name: Optional[str] = None
    healthcheck_status: Optional[str] = None
    device_id: Optional[int] = None

class IPAddress(IPAddressBase):
    id: int
    last_seen: Optional[datetime] = None
    subnet: Optional[Subnet] = None
    model_config = ConfigDict(from_attributes=True)

class DeviceWithIPs(Device):
    ip_addresses: List[IPAddress] = []

class IPAssignment(BaseModel):
    ip_address: str
    model_config = ConfigDict(from_attributes=True)

class SettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class Setting(SettingBase):
    model_config = ConfigDict(from_attributes=True)

class SettingsUpdate(BaseModel):
    discovery_interval: int = 15
    arp_enabled: bool = True
    icmp_enabled: bool = True
    dns_enabled: bool = False
    dns_server: Optional[str] = None
    dns_search_domains: Optional[str] = None
