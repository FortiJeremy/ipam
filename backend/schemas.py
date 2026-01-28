from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import ipaddress

class IPStatus(str, Enum):
    ALLOCATED = "ALLOCATED"
    RESERVED = "RESERVED"
    AVAILABLE = "AVAILABLE"
    DHCP_POOL = "DHCP_POOL"
    DISCOVERED = "DISCOVERED"

# Base schemas
class SubnetBase(BaseModel):
    name: str = Field(..., min_length=1)
    network_address: str
    prefix_length: int = Field(..., ge=0, le=32)
    gateway: Optional[str] = None
    vlan_id: Optional[int] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    last_scan: Optional[datetime] = None
    scan_status: Optional[str] = "Idle"

    @field_validator('network_address')
    @classmethod
    def validate_network(cls, v: str) -> str:
        try:
            ipaddress.ip_address(v)
            return v
        except ValueError:
            raise ValueError('Invalid network address')

class SubnetCreate(SubnetBase):
    pass

class SubnetUpdate(BaseModel):
    name: Optional[str] = None
    network_address: Optional[str] = None
    prefix_length: Optional[int] = Field(None, ge=0, le=32)
    gateway: Optional[str] = None
    vlan_id: Optional[int] = None
    description: Optional[str] = None
    tags: Optional[str] = None

    @field_validator('network_address')
    @classmethod
    def validate_network(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            ipaddress.ip_address(v)
            return v
        except ValueError:
            raise ValueError('Invalid network address')

class SubnetStats(BaseModel):
    total: int
    assigned: int
    discovered: int
    free: int

class Subnet(SubnetBase):
    id: int
    stats: Optional[SubnetStats] = None
    ip_ranges: List["IPRange"] = []
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

class IPRangeBase(BaseModel):
    subnet_id: int
    name: str
    start_ip: str
    end_ip: str
    purpose: str
    description: Optional[str] = None

class IPRangeCreate(IPRangeBase):
    pass

class IPRangeUpdate(BaseModel):
    name: Optional[str] = None
    start_ip: Optional[str] = None
    end_ip: Optional[str] = None
    purpose: Optional[str] = None
    description: Optional[str] = None

class IPRange(IPRangeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DeviceWithIPs(Device):
    ip_addresses: List[IPAddress] = []

class IPAssignment(BaseModel):
    ip_address: str
    interface_name: Optional[str] = None
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

Subnet.model_rebuild()
IPAddress.model_rebuild()
DeviceWithIPs.model_rebuild()
