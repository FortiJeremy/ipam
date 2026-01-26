from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import threading
import models
import schemas
import crud
from database import SessionLocal, engine, get_db
from discovery import start_brain_loop

# Create tables (Alembic should handle this in production, but good for quick dev)
# models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="IPAM API", version="0.1.0")

# Start discovery background thread
@app.on_event("startup")
def startup_event():
    thread = threading.Thread(target=start_brain_loop, daemon=True)
    thread.start()

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "IPAM API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    subnet_count = db.query(models.Subnet).count()
    device_count = db.query(models.Device).count()
    ip_count = db.query(models.IPAddress).count()
    online_count = db.query(models.IPAddress).filter(models.IPAddress.healthcheck_status == "Online").count()
    return {
        "subnets": subnet_count,
        "devices": device_count,
        "total_ips": ip_count,
        "discovery_queue": online_count, # Showing online IPs for now
    }

# Subnet Endpoints
@app.post("/subnets/", response_model=schemas.Subnet)
def create_subnet(subnet: schemas.SubnetCreate, db: Session = Depends(get_db)):
    return crud.create_subnet(db=db, subnet=subnet)

@app.get("/subnets/", response_model=List[schemas.Subnet])
def read_subnets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    subnets = crud.get_subnets(db, skip=skip, limit=limit)
    return subnets

@app.get("/subnets/{subnet_id}", response_model=schemas.Subnet)
def read_subnet(subnet_id: int, db: Session = Depends(get_db)):
    db_subnet = crud.get_subnet(db, subnet_id=subnet_id)
    if db_subnet is None:
        raise HTTPException(status_code=404, detail="Subnet not found")
    return db_subnet

@app.put("/subnets/{subnet_id}", response_model=schemas.Subnet)
def update_subnet(subnet_id: int, subnet: schemas.SubnetUpdate, db: Session = Depends(get_db)):
    db_subnet = crud.update_subnet(db, subnet_id=subnet_id, subnet=subnet)
    if db_subnet is None:
        raise HTTPException(status_code=404, detail="Subnet not found")
    return db_subnet

@app.delete("/subnets/{subnet_id}")
def delete_subnet(subnet_id: int, db: Session = Depends(get_db)):
    db_subnet = crud.delete_subnet(db, subnet_id=subnet_id)
    if db_subnet is None:
        raise HTTPException(status_code=404, detail="Subnet not found")
    return {"message": "Subnet deleted"}

# Device Endpoints
@app.post("/devices/", response_model=schemas.Device)
def create_device(device: schemas.DeviceCreate, db: Session = Depends(get_db)):
    return crud.create_device(db=db, device=device)

@app.get("/devices/", response_model=List[schemas.DeviceWithIPs])
def read_devices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    devices = crud.get_devices(db, skip=skip, limit=limit)
    return devices

@app.get("/devices/{device_id}", response_model=schemas.DeviceWithIPs)
def read_device(device_id: int, db: Session = Depends(get_db)):
    db_device = crud.get_device(db, device_id=device_id)
    if db_device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return db_device
@app.put("/devices/{device_id}", response_model=schemas.Device)
def update_device(device_id: int, device: schemas.DeviceUpdate, db: Session = Depends(get_db)):
    db_device = crud.update_device(db, device_id=device_id, device=device)
    if db_device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return db_device
@app.delete("/devices/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db)):
    db_device = crud.delete_device(db, device_id=device_id)
    if db_device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"message": "Device deleted"}

@app.post("/devices/{device_id}/assign", response_model=schemas.IPAddress)
def assign_ip_to_device(device_id: int, assignment: schemas.IPAssignment, db: Session = Depends(get_db)):
    db_device = crud.get_device(db, device_id=device_id)
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    db_ip = crud.link_ip_to_device(db, db_device, assignment.ip_address)
    if not db_ip:
        raise HTTPException(status_code=400, detail="Could not assign IP. Ensure it belongs to a known subnet.")
    
    return db_ip

# IP Address Endpoints
@app.post("/ips/", response_model=schemas.IPAddress)
def create_ip_address(ip: schemas.IPAddressCreate, db: Session = Depends(get_db)):
    return crud.create_ip_address(db=db, ip=ip)

@app.get("/ips/", response_model=List[schemas.IPAddress])
def read_ips(subnet_id: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    ips = crud.get_ip_addresses(db, subnet_id=subnet_id, skip=skip, limit=limit)
    return ips

@app.get("/ips/{ip_id}", response_model=schemas.IPAddress)
def read_ip(ip_id: int, db: Session = Depends(get_db)):
    db_ip = crud.get_ip_address(db, ip_id=ip_id)
    if db_ip is None:
        raise HTTPException(status_code=404, detail="IP address not found")
    return db_ip

@app.put("/ips/{ip_id}", response_model=schemas.IPAddress)
def update_ip(ip_id: int, ip: schemas.IPAddressUpdate, db: Session = Depends(get_db)):
    db_ip = crud.update_ip_address(db, ip_id=ip_id, ip=ip)
    if db_ip is None:
        raise HTTPException(status_code=404, detail="IP address not found")
    return db_ip

@app.delete("/ips/{ip_id}")
def delete_ip(ip_id: int, db: Session = Depends(get_db)):
    db_ip = crud.delete_ip_address(db, ip_id=ip_id)
    if db_ip is None:
        raise HTTPException(status_code=404, detail="IP address not found")
    return {"message": "IP address deleted"}

# Settings Endpoints
@app.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    return crud.get_settings(db)

@app.put("/settings")
def update_settings(settings: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    return crud.update_settings(db, settings)

@app.post("/settings/purge")
def purge_ips(days: int = 30, db: Session = Depends(get_db)):
    count = crud.purge_discovered_ips(db, days)
    return {"message": f"Successfully purged {count} old discovered IPs"}
