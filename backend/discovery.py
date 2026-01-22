import time
import logging
import socket
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from scapy.all import srp, Ether, ARP, conf, IP, ICMP, sr1, sr
import dns.resolver
import dns.reversename
import models
import schemas
from database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ping_ip(ip_address: str, timeout: int = 1):
    """
    Standard ICMP Ping using Scapy.
    """
    try:
        packet = IP(dst=ip_address)/ICMP()
        reply = sr1(packet, timeout=timeout, verbose=0)
        return reply is not None
    except Exception as e:
        logger.error(f"Error pinging {ip_address}: {e}")
        return False

def resolve_hostname(ip_address: str, dns_server: str = None):
    """
    Try to resolve hostname via Reverse DNS.
    Uses dnspython for custom server support and more reliable resolution.
    """
    try:
        addr = dns.reversename.from_address(ip_address)
        resolver = dns.resolver.Resolver()
        if dns_server:
            resolver.nameservers = [dns_server]
        
        # Set a short timeout for background scans
        resolver.lifetime = 1.0
        resolver.timeout = 1.0
        
        answer = resolver.resolve(addr, "PTR")
        if answer:
            # Get the hostname and strip trailing dot
            return str(answer[0]).rstrip('.')
        return None
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.Timeout, Exception) as e:
        # Fallback to system resolver if custom server isn't specified or fails
        if not dns_server:
            try:
                return socket.gethostbyaddr(ip_address)[0]
            except (socket.herror, socket.gaierror, IndexError):
                return None
        return None

def scan_subnet(network_prefix: str, arp_enabled: bool = True, icmp_enabled: bool = True):
    """
    Scan a subnet using both ARP (local) and ICMP (routed).
    network_prefix: e.g. "192.168.1.0/24"
    """
    discovered_hosts = {} # ip -> mac

    # 1. ARP Scan (very fast and reliable for local segment)
    if arp_enabled:
        try:
            logger.info(f"Starting ARP scan for {network_prefix}")
            ans, _ = srp(Ether(dst="ff:ff:ff:ff:ff:ff")/ARP(pdst=network_prefix), timeout=2, verbose=0)
            for _, received in ans:
                discovered_hosts[received.psrc] = received.hwsrc
        except Exception as e:
            logger.error(f"Error during ARP scan for {network_prefix}: {e}")

    # 2. ICMP Scan (works across routers/gateways)
    if icmp_enabled:
        try:
            logger.info(f"Starting ICMP scan for {network_prefix}")
            ans_icmp, _ = sr(IP(dst=network_prefix)/ICMP(), timeout=2, verbose=0)
            for _, received in ans_icmp:
                ip_addr = received.src
                if ip_addr not in discovered_hosts:
                    discovered_hosts[ip_addr] = None # MAC not visible via Layer 3
        except Exception as e:
            logger.error(f"Error during ICMP scan for {network_prefix}: {e}")

    return [{"ip": ip, "mac": mac} for ip, mac in discovered_hosts.items()]

def run_health_checks():
    """
    Iterates through all registered IP addresses and pings them.
    Updates the healthcheck_status and last_seen in the database.
    """
    db = SessionLocal()
    try:
        ips = db.query(models.IPAddress).all()
        logger.info(f"Running health checks on {len(ips)} IPs")
        for ip_record in ips:
            is_alive = ping_ip(ip_record.address)
            ip_record.healthcheck_status = "Online" if is_alive else "Offline"
            if is_alive:
                ip_record.last_seen = datetime.now(timezone.utc)
            db.commit()
    except Exception as e:
        logger.error(f"Health check task failed: {e}")
    finally:
        db.close()

def scan_subnet_range(subnet_id: int, arp_enabled: bool = True, icmp_enabled: bool = True, dns_enabled: bool = False, dns_server: str = None):
    """
    Scans a single subnet and updates its metadata.
    """
    db = SessionLocal()
    try:
        subnet = db.query(models.Subnet).filter(models.Subnet.id == subnet_id).first()
        if not subnet:
            return

        subnet.scan_status = "Scanning"
        db.commit()

        network = f"{subnet.network_address}/{subnet.prefix_length}"
        results = scan_subnet(network, arp_enabled, icmp_enabled)
        
        for res in results:
            ip_addr = res["ip"]
            mac_addr = res["mac"]
            
            # Resolve hostname if enabled
            hostname = None
            if dns_enabled:
                hostname = resolve_hostname(ip_addr, dns_server)

            ip_record = db.query(models.IPAddress).filter(models.IPAddress.address == ip_addr).first()
            
            if ip_record:
                ip_record.last_seen = datetime.now(timezone.utc)
                if mac_addr:
                    ip_record.mac_address = mac_addr
                if hostname:
                    ip_record.hostname = hostname
                ip_record.healthcheck_status = "Online"
            else:
                new_ip = models.IPAddress(
                    address=ip_addr,
                    hostname=hostname,
                    mac_address=mac_addr,
                    status=models.IPStatus.DISCOVERED,
                    healthcheck_status="Online",
                    last_seen=datetime.now(timezone.utc),
                    subnet_id=subnet.id
                )
                db.add(new_ip)
        
        subnet.last_scan = datetime.now(timezone.utc)
        subnet.scan_status = "Idle"
        db.commit()
    except Exception as e:
        logger.error(f"Scan failed for subnet {subnet_id}: {e}")
        if subnet:
            subnet.scan_status = f"Error: {str(e)[:50]}"
            db.commit()
    finally:
        db.close()

def run_discovery(arp_enabled: bool = True, icmp_enabled: bool = True, dns_enabled: bool = False, dns_server: str = None):
    """
    Iterates through all subnets and performs discovery.
    """
    db = SessionLocal()
    subnet_ids = []
    try:
        subnets = db.query(models.Subnet).all()
        subnet_ids = [s.id for s in subnets]
    except Exception as e:
        logger.error(f"Failed to fetch subnets for discovery: {e}")
    finally:
        db.close()
    
    for sid in subnet_ids:
        scan_subnet_range(sid, arp_enabled, icmp_enabled, dns_enabled, dns_server)

def start_brain_loop():
    """
    Main loop for background tasks. 
    Runs discovery based on interval setting.
    """
    logger.info("The Brain is starting...")
    while True:
        db = SessionLocal()
        interval = 15 # default
        try:
            from crud import get_settings
            settings = get_settings(db)
            interval = settings.get("discovery_interval", 15)
            arp_enabled = settings.get("arp_enabled", True)
            icmp_enabled = settings.get("icmp_enabled", True)
            dns_enabled = settings.get("dns_enabled", False)
            dns_server = settings.get("dns_server")
            
            logger.info(f"The Brain is starting a new cycle (ARP: {arp_enabled}, ICMP: {icmp_enabled}, DNS: {dns_enabled})")
            run_health_checks()
            run_discovery(arp_enabled, icmp_enabled, dns_enabled, dns_server)
        except Exception as e:
            logger.error(f"Error in brain loop: {e}")
        finally:
            db.close()
        
        logger.info(f"Scan complete. The Brain will sleep for {interval} minutes.")
        time.sleep(interval * 60)
