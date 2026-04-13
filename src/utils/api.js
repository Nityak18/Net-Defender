// Interacts with our real Python Flask Backend API

const API_URL = 'http://127.0.0.1:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('nids_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const simulateMLPrediction = async (features) => {
  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(features)
    });
    
    // Check if unauthorized (token expired/invalid)
    if (response.status === 401) {
      localStorage.removeItem('nids_token');
      window.location.reload(); // Force kick back to login
    }
    
    if (!response.ok) {
        throw new Error("API returned an error");
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Backend Error:", err);
    throw err;
  }
};

// Dummy generators for the frontend UI logic
export const generateRandomIP = () => {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

export const generateRandomPacketFeatures = () => {
  const isNormal = Math.random() < 0.70; // 70% normal traffic
  
  const protocols = ['tcp', 'udp', 'icmp'];
  const services = ['http', 'https', 'ftp', 'ssh', 'dns', 'smtp'];
  
  let features = {};
  
  if (isNormal) {
    features = {
      duration: Math.random() < 0.8 ? 0 : Math.floor(Math.random() * 60),
      protocol_type: protocols[Math.floor(Math.random() * 2)],
      service: services[Math.floor(Math.random() * services.length)],
      flag: 'SF',
      src_bytes: Math.floor(Math.random() * 5000) + 100,
      dst_bytes: Math.floor(Math.random() * 10000) + 100,
      land: 0,
      wrong_fragment: 0,
      urgent: 0,
      logged_in: Math.random() > 0.3 ? 1 : 0,
      count: Math.floor(Math.random() * 10) + 1,
      srv_count: Math.floor(Math.random() * 10) + 1,
      same_srv_rate: 1.0,
      diff_srv_rate: 0.0,
      num_failed_logins: 0,
      su_attempted: 0,
    };
  } else {
    const attackCat = Math.random();
    if (attackCat < 0.4) {
      features = {
        duration: 0,
        protocol_type: 'tcp',
        service: 'http',
        flag: 'S0',
        src_bytes: Math.floor(Math.random() * 100000) + 60000,
        dst_bytes: 0,
        land: 0,
        wrong_fragment: 0,
        urgent: 0,
        logged_in: 0,
        count: Math.floor(Math.random() * 200) + 50,
        srv_count: Math.floor(Math.random() * 20) + 1,
        same_srv_rate: 0.1,
        diff_srv_rate: 0.9,
        num_failed_logins: 0,
        su_attempted: 0,
      };
    } else if (attackCat < 0.7) {
      features = {
        duration: 0,
        protocol_type: 'icmp',
        service: 'eco_i',
        flag: 'SF',
        src_bytes: 8,
        dst_bytes: 0,
        land: 0,
        wrong_fragment: 0,
        urgent: 0,
        logged_in: 0,
        count: Math.floor(Math.random() * 100) + 60,
        srv_count: Math.floor(Math.random() * 100) + 60,
        same_srv_rate: 1.0,
        diff_srv_rate: 0.0,
        num_failed_logins: 0,
        su_attempted: 0,
      };
    } else {
      features = {
        duration: Math.floor(Math.random() * 100) + 10,
        protocol_type: 'tcp',
        service: 'ftp',
        flag: 'REJ',
        src_bytes: Math.floor(Math.random() * 500),
        dst_bytes: 0,
        land: 0,
        wrong_fragment: 0,
        urgent: 0,
        logged_in: 0,
        count: 2,
        srv_count: 2,
        same_srv_rate: 1.0,
        diff_srv_rate: 0.0,
        num_failed_logins: Math.floor(Math.random() * 5) + 4,
        su_attempted: 1,
      };
    }
  }
  return features;
};
