import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class IPStatus(enum.Enum):
    ALLOCATED = "ALLOCATED"
    RESERVED = "RESERVED"
    AVAILABLE = "AVAILABLE"
    DHCP_POOL = "DHCP_POOL"
    DISCOVERED = "DISCOVERED"

class Subnet(Base):
    __tablename__ = "subnets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    network_address = Column(String, index=True)
    prefix_length = Column(Integer)
    gateway = Column(String, nullable=True)
    vlan_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    tags = Column(String, nullable=True)  # Stored as comma-separated or simple string for now
    last_scan = Column(DateTime(timezone=True), nullable=True)
    scan_status = Column(String, default="Idle")

    ip_addresses = relationship("IPAddress", back_populates="subnet", cascade="all, delete-orphan")
    ip_ranges = relationship("IPRange", back_populates="subnet", cascade="all, delete-orphan")

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    manufacturer = Column(String, nullable=True)
    model = Column(String, nullable=True)
    device_type = Column(String, nullable=True) # avoiding "type" keyword
    tags = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    ip_addresses = relationship("IPAddress", back_populates="device")

class IPAddress(Base):
    __tablename__ = "ip_addresses"

    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, index=True, unique=True)
    hostname = Column(String, nullable=True)
    status = Column(Enum(IPStatus), default=IPStatus.AVAILABLE)
    mac_address = Column(String, nullable=True)
    interface_name = Column(String, nullable=True)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    healthcheck_status = Column(String, nullable=True)

    subnet_id = Column(Integer, ForeignKey("subnets.id"))
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)

    subnet = relationship("Subnet", back_populates="ip_addresses")
    device = relationship("Device", back_populates="ip_addresses")

class IPRange(Base):
    __tablename__ = "ip_ranges"

    id = Column(Integer, primary_key=True, index=True)
    subnet_id = Column(Integer, ForeignKey("subnets.id"))
    name = Column(String, index=True)
    start_ip = Column(String, index=True)
    end_ip = Column(String, index=True)
    purpose = Column(String) # DHCP, STATIC, etc.
    description = Column(Text, nullable=True)

    subnet = relationship("Subnet", back_populates="ip_ranges")

class Setting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)
    description = Column(String, nullable=True)
