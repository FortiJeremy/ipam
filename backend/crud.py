from sqlalchemy.orm import Session, joinedload
import models
import schemas
import threading
import ipaddress
from discovery import scan_subnet_range

def _get_subnet_stats(db_subnet: models.Subnet):
    total_ips = 2 ** (32 - db_subnet.prefix_length)
    
    # Simple count of records in DB for this subnet
    assigned_count = 0
    discovered_count = 0
    
    for ip in db_subnet.ip_addresses:
        if ip.status == models.IPStatus.DISCOVERED:
            discovered_count += 1
        else:
            # ALLOCATED, RESERVED, DHCP_POOL are all "assigned" in this context
            assigned_count += 1
            
    return {
        "total": total_ips,
        "assigned": assigned_count,
        "discovered": discovered_count,
        "free": max(0, total_ips - assigned_count - discovered_count)
    }

def get_subnet(db: Session, subnet_id: int):
    db_subnet = db.query(models.Subnet).filter(models.Subnet.id == subnet_id).first()
    if db_subnet:
        db_subnet.stats = _get_subnet_stats(db_subnet)
    return db_subnet

def get_subnets(db: Session, skip: int = 0, limit: int = 100):
    subnets = db.query(models.Subnet).offset(skip).limit(limit).all()
    for s in subnets:
        s.stats = _get_subnet_stats(s)
    return subnets

def create_subnet(db: Session, subnet: schemas.SubnetCreate):
    db_subnet = models.Subnet(**subnet.model_dump())
    db.add(db_subnet)
    db.commit()
    db.refresh(db_subnet)
    
    # Trigger an immediate scan in the background
    threading.Thread(target=scan_subnet_range, args=(db_subnet.id,), daemon=True).start()
    
    return db_subnet

def update_subnet(db: Session, subnet_id: int, subnet: schemas.SubnetUpdate):
    db_subnet = get_subnet(db, subnet_id)
    if db_subnet:
        update_data = subnet.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_subnet, key, value)
        db.commit()
        db.refresh(db_subnet)
    return db_subnet

def delete_subnet(db: Session, subnet_id: int):
    db_subnet = get_subnet(db, subnet_id)
    if db_subnet:
        db.delete(db_subnet)
        db.commit()
    return db_subnet

# Device CRUD
def get_device(db: Session, device_id: int):
    return db.query(models.Device).options(
        joinedload(models.Device.ip_addresses).joinedload(models.IPAddress.subnet)
    ).filter(models.Device.id == device_id).first()

def get_devices(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Device).options(
        joinedload(models.Device.ip_addresses).joinedload(models.IPAddress.subnet)
    ).offset(skip).limit(limit).all()

def link_ip_to_device(db: Session, db_device: models.Device, ip_addr: str):
    if not ip_addr:
        return None
        
    # Link existing IP to the device
    db_ip = db.query(models.IPAddress).filter(models.IPAddress.address == ip_addr).first()
    
    if not db_ip:
        # Try to find the correct subnet for this new IP
        subnets = db.query(models.Subnet).all()
        target_subnet = None
        for s in subnets:
            network = ipaddress.ip_network(f"{s.network_address}/{s.prefix_length}")
            if ipaddress.ip_address(ip_addr) in network:
                target_subnet = s
                break
        
        if target_subnet:
            db_ip = models.IPAddress(
                address=ip_addr,
                status=models.IPStatus.ALLOCATED,
                subnet_id=target_subnet.id,
                device_id=db_device.id
            )
            db.add(db_ip)
    else:
        db_ip.device_id = db_device.id
        db_ip.status = models.IPStatus.ALLOCATED
    
    db.commit()
    if db_ip:
        db.refresh(db_ip)
    return db_ip

def create_device(db: Session, device: schemas.DeviceCreate):
    device_data = device.model_dump()
    ip_addr = device_data.pop("ip_address", None)
    
    db_device = models.Device(**device_data)
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    
    if ip_addr:
        link_ip_to_device(db, db_device, ip_addr)
            
    return db_device

def update_device(db: Session, device_id: int, device: schemas.DeviceUpdate):
    db_device = get_device(db, device_id)
    if db_device:
        update_data = device.model_dump(exclude_unset=True)
        ip_addr = update_data.pop("ip_address", None)
        
        for key, value in update_data.items():
            setattr(db_device, key, value)
        db.commit()
        
        if ip_addr:
            # First, check if this IP is already assigned to THIS device
            existing_ip = db.query(models.IPAddress).filter(
                models.IPAddress.address == ip_addr,
                models.IPAddress.device_id == db_device.id
            ).first()
            
            if not existing_ip:
                link_ip_to_device(db, db_device, ip_addr)
        
        db.refresh(db_device)
    return db_device

def delete_device(db: Session, device_id: int):
    db_device = get_device(db, device_id)
    if db_device:
        # Before deleting device, we should probably unassign its IPs or let FK handle it
        db.delete(db_device)
        db.commit()
    return db_device

# IPAddress CRUD
def get_ip_address(db: Session, ip_id: int):
    return db.query(models.IPAddress).filter(models.IPAddress.id == ip_id).first()

def get_ip_addresses(db: Session, subnet_id: int = None, skip: int = 0, limit: int = 100):
    query = db.query(models.IPAddress)
    if subnet_id:
        query = query.filter(models.IPAddress.subnet_id == subnet_id)
    return query.offset(skip).limit(limit).all()

def create_ip_address(db: Session, ip: schemas.IPAddressCreate):
    # Check if IP already exists (could have been discovered)
    db_ip = db.query(models.IPAddress).filter(models.IPAddress.address == ip.address).first()
    
    if db_ip:
        # Update existing record
        update_data = ip.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_ip, key, value)
        db.commit()
        db.refresh(db_ip)
        return db_ip
    
    # Create new record
    db_ip = models.IPAddress(**ip.model_dump())
    db.add(db_ip)
    db.commit()
    db.refresh(db_ip)
    return db_ip

def update_ip_address(db: Session, ip_id: int, ip: schemas.IPAddressUpdate):
    db_ip = get_ip_address(db, ip_id)
    if db_ip:
        update_data = ip.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_ip, key, value)
        db.commit()
        db.refresh(db_ip)
    return db_ip

def delete_ip_address(db: Session, ip_id: int):
    db_ip = get_ip_address(db, ip_id)
    if db_ip:
        db.delete(db_ip)
        db.commit()
    return db_ip

# Settings CRUD
def get_settings(db: Session):
    settings = db.query(models.Setting).all()
    # Map to useful dict
    result = {
        "discovery_interval": 5,
        "arp_enabled": True,
        "icmp_enabled": True,
        "dns_enabled": False,
        "dns_server": "",
        "dns_search_domains": ""
    }
    for s in settings:
        if s.key == "discovery_interval":
            result["discovery_interval"] = int(s.value)
        elif s.key == "arp_enabled":
            result["arp_enabled"] = s.value.lower() == "true"
        elif s.key == "icmp_enabled":
            result["icmp_enabled"] = s.value.lower() == "true"
        elif s.key == "dns_enabled":
            result["dns_enabled"] = s.value.lower() == "true"
        elif s.key == "dns_server":
            result["dns_server"] = s.value
        elif s.key == "dns_search_domains":
            result["dns_search_domains"] = s.value
    return result

def update_settings(db: Session, settings: schemas.SettingsUpdate):
    data = settings.model_dump()
    for key, value in data.items():
        db_setting = db.query(models.Setting).filter(models.Setting.key == key).first()
        if db_setting:
            db_setting.value = str(value)
        else:
            db_setting = models.Setting(key=key, value=str(value))
            db.add(db_setting)
    db.commit()
    return get_settings(db)

def purge_discovered_ips(db: Session, days: int = 30):
    from datetime import datetime, timedelta, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Only delete DISCOVERED ones that haven't been seen recently
    deleted_count = db.query(models.IPAddress).filter(
        models.IPAddress.status == models.IPStatus.DISCOVERED,
        models.IPAddress.last_seen < cutoff
    ).delete()
    
    db.commit()
    return deleted_count
