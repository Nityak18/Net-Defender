import time
from threading import Lock

class FlowTracker:
    def __init__(self):
        self.flows = {}
        self.lock = Lock()
        self.packet_history = []
        
    def _get_flow_id(self, pkt):
        if pkt.haslayer('IP'):
            src = pkt['IP'].src
            dst = pkt['IP'].dst
            proto = pkt['IP'].proto
            
            sport, dport = 0, 0
            if pkt.haslayer('TCP'):
                sport = pkt['TCP'].sport
                dport = pkt['TCP'].dport
            elif pkt.haslayer('UDP'):
                sport = pkt['UDP'].sport
                dport = pkt['UDP'].dport
                
            # Create a bidirectional key so both directions match the same flow
            return tuple(sorted([f"{src}:{sport}", f"{dst}:{dport}"]) + [proto])
        return None

    def process_packet(self, pkt):
        # We must import scapy inside function if we want to delay load, but here is fine.
        flow_id = self._get_flow_id(pkt)
        if not flow_id:
            return None
            
        current_time = time.time()
        
        with self.lock:
            if flow_id not in self.flows:
                self.flows[flow_id] = {
                    'start_time': current_time,
                    'src_bytes': 0,
                    'dst_bytes': 0,
                    'flags': set(),
                    'last_seen': current_time,
                    'is_land': 1 if (pkt.haslayer('IP') and pkt['IP'].src == pkt['IP'].dst) else 0,
                    'wrong_fragment': pkt['IP'].frag if pkt.haslayer('IP') else 0,
                    'urgent': 1 if (pkt.haslayer('TCP') and pkt['TCP'].urgptr > 0) else 0
                }
                
            flow = self.flows[flow_id]
            flow['last_seen'] = current_time
            
            # Add payload bytes (approximate for ML)
            packet_size = len(pkt)
            if pkt.haslayer('TCP'):
                flow['flags'].add(pkt['TCP'].flags)
                flow['src_bytes'] += len(pkt['TCP'].payload)
            elif pkt.haslayer('UDP'):
                flow['src_bytes'] += len(pkt['UDP'].payload)
            else:
                flow['src_bytes'] += packet_size
                
            # Time window for 'count' and 'srv_count' (last 2 seconds rule from KDD)
            self.packet_history.append({'time': current_time, 'flow_id': flow_id})
            
            # Clean up old history (> 2 seconds) to keep memory tiny
            self.packet_history = [p for p in self.packet_history if current_time - p['time'] <= 2.0]
            
            count = len(self.packet_history)
            srv_count = len([p for p in self.packet_history if p['flow_id'] == flow_id])
            
            same_srv_rate = srv_count / max(1, count)
            diff_srv_rate = 1.0 - same_srv_rate
            
            # Protocol mapping
            protocol_type = 'tcp'
            service = 'private'
            
            if pkt.haslayer('TCP'):
                protocol_type = 'tcp'
                if pkt['TCP'].dport in [80, 8080]: service = 'http'
                elif pkt['TCP'].dport == 443: service = 'https'
                elif pkt['TCP'].dport == 21: service = 'ftp'
                elif pkt['TCP'].dport == 22: service = 'ssh'
                elif pkt['TCP'].dport == 53: service = 'dns'
                elif pkt['TCP'].dport == 25: service = 'smtp'
            elif pkt.haslayer('UDP'):
                protocol_type = 'udp'
                if pkt['UDP'].dport == 53: service = 'dns'
            elif pkt.haslayer('ICMP'):
                protocol_type = 'icmp'
                service = 'eco_i'
                
            # Flag mapping (approximation of TCP flags)
            flag = 'SF'
            if pkt.haslayer('TCP'):
                f = pkt['TCP'].flags
                if 'R' in f: flag = 'REJ'
                elif 'S' in f and 'A' not in f: flag = 'S0'
            
            # Construct final 16-feature dictionary mapped exactly to frontend/ML inputs
            features = {
                'duration': current_time - flow['start_time'],
                'protocol_type': protocol_type,
                'service': service,
                'flag': flag,
                'src_bytes': flow['src_bytes'],
                'dst_bytes': flow['dst_bytes'], 
                'land': flow['is_land'],
                'wrong_fragment': flow['wrong_fragment'],
                'urgent': flow['urgent'],
                'logged_in': 1 if service in ['http', 'https', 'ftp', 'ssh'] else 0,
                'count': count,
                'srv_count': srv_count,
                'same_srv_rate': same_srv_rate,
                'diff_srv_rate': diff_srv_rate,
                'num_failed_logins': 0, # Auto-zeroed due to encryption
                'su_attempted': 0 # Auto-zeroed due to encryption
            }
            
            # Attach IPs strictly for UI display purposes (not ML)
            if pkt.haslayer('IP'):
                features['srcIP'] = pkt['IP'].src
                features['dstIP'] = pkt['IP'].dst
            else:
                features['srcIP'] = '0.0.0.0'
                features['dstIP'] = '0.0.0.0'
                
            return features
