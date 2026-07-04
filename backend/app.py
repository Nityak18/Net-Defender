from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
import joblib
import pandas as pd
import numpy as np
import os
import json
import queue
import threading

try:
    from scapy.all import sniff
except ImportError:
    sniff = None

from feature_extractor import FlowTracker

app = Flask(__name__)
CORS(app)

# --- DATABASE / AUTHENTICATION SETUP ---
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'nids.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    token = db.Column(db.String(128), unique=True, nullable=True) # Simple token-based auth

# Define database creation to run inside application context
with app.app_context():
    db.create_all()
    # Seed Demo User
    if not User.query.filter_by(username='admin').first():
        hashed_pw = generate_password_hash('admin123')
        demo_user = User(username='admin', password_hash=hashed_pw)
        db.session.add(demo_user)
        db.session.commit()
        print("Seeded demo user: admin / admin123")

# Decorator to protect routes
def require_auth(f):
    def decorator(*args, **kwargs):
        # Allow requests with valid token in header or query parameter
        auth_header = request.headers.get('Authorization')
        token = None
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
        elif request.args.get('token'):
            token = request.args.get('token')
            
        if not token:
            return jsonify({"error": "Missing or invalid token. You must be logged in."}), 401
        
        user = User.query.filter_by(token=token).first()
        if not user:
            return jsonify({"error": "Unauthorized access. Invalid session."}), 401
            
        return f(*args, **kwargs)
    decorator.__name__ = f.__name__
    return decorator


# --- AUTHENTICATION ROUTES ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data.get('username')).first()
    
    if user and check_password_hash(user.password_hash, data.get('password')):
        # Generate entirely new session token
        token = secrets.token_hex(32)
        user.token = token
        db.session.commit()
        return jsonify({"username": user.username, "token": token, "message": "Login successful!"})
    
    return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists."}), 400
        
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    hashed_pw = generate_password_hash(password)
    new_user = User(username=username, password_hash=hashed_pw)
    
    # Generate initial token
    token = secrets.token_hex(32)
    new_user.token = token
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"username": new_user.username, "token": token, "message": "Registration successful!"})

@app.route('/api/logout', methods=['POST'])
@require_auth
def logout():
    auth_header = request.headers.get('Authorization')
    token = auth_header.split(" ")[1]
    user = User.query.filter_by(token=token).first()
    if user:
        user.token = None # Invalidate token
        db.session.commit()
    return jsonify({"message": "Successfully logged out."})


# --- ML MODEL SETUP ---
project_dir = os.path.dirname(basedir) # go one level up to Major pro/
MODEL_FILE = os.path.join(project_dir, "nsl_kdd_rf_model.pkl")
ENCODER_FILE = os.path.join(project_dir, "label_encoders.pkl")

try:
    model = joblib.load(MODEL_FILE)
    encoders = joblib.load(ENCODER_FILE)
    print("Successfully loaded pre-trained model and encoders.")
except Exception as e:
    print(f"Warning: Could not load model. Error: {e}")
    model = None
    encoders = None

FRONTEND_FEATURES = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes', 
    'land', 'wrong_fragment', 'urgent', 'logged_in', 'count', 'srv_count', 
    'same_srv_rate', 'diff_srv_rate', 'num_failed_logins', 'su_attempted'
]
CATEGORICAL_FEATURES = ['protocol_type', 'service', 'flag']

# --- CORE APP ROUTES ---
@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({"status": "active", "model_loaded": model is not None})

@app.route('/api/predict', methods=['POST'])
@require_auth
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded on backend."}), 503
        
    data = request.json
    
    try:
        input_data = {}
        for feature in FRONTEND_FEATURES:
            val = data.get(feature, 0)
            if feature in CATEGORICAL_FEATURES:
                input_data[feature] = [str(val).lower() if str(val) != '0' else 'tcp']
            elif feature in ['duration', 'same_srv_rate', 'diff_srv_rate']:
                input_data[feature] = [float(val)]
            else:
                input_data[feature] = [int(val)]
                
        df = pd.DataFrame(input_data)
        
        try:
            for col in CATEGORICAL_FEATURES:
                val = df[col].iloc[0]
                le = encoders[col]
                df[col] = le.transform([val])[0] if val in le.classes_ else 0
        except Exception as e:
            return jsonify({"error": f"Categorical encoding error: {e}"}), 400

        probabilities = model.predict_proba(df)[0]
        max_idx = np.argmax(probabilities)
        prediction_class = model.classes_[max_idx]
        confidence = float(probabilities[max_idx] * 100)
        
        is_attack = prediction_class != 'Normal'
        
        rf_core = model.named_steps['rf']
        importances = rf_core.feature_importances_
        indices = np.argsort(importances)[::-1]
        
        top_features = [{"name": FRONTEND_FEATURES[idx], "weight": int(importances[idx] * 100)} for idx in indices[:3]]
            
        return jsonify({
            "prediction": "ATTACK" if is_attack else "NORMAL",
            "attackType": prediction_class if is_attack else "Normal",
            "confidence": f"{confidence:.2f}",
            "featureImportance": top_features
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- SCAPY DAEMON & SSE ---
sse_listeners = []
flow_tracker = FlowTracker()
sniffer_active = False
sniffer_error = ""

def process_scapy_packet(pkt):
    if not model or not encoders: 
        print("[DEBUG] Model not loaded.")
        return
        
    try:
        features = flow_tracker.process_packet(pkt)
    except Exception as e:
        print(f"[DEBUG] Feature extractor crashed: {e}")
        return
        
    if not features: return
    
    input_data = {}
    for feature in FRONTEND_FEATURES:
        val = features.get(feature, 0)
        if feature in CATEGORICAL_FEATURES:
            input_data[feature] = [str(val).lower() if str(val) != '0' else 'tcp']
        elif feature in ['duration', 'same_srv_rate', 'diff_srv_rate']:
            input_data[feature] = [float(val)]
        else:
            input_data[feature] = [int(val)]
            
    df = pd.DataFrame(input_data)
    try:
        for col in CATEGORICAL_FEATURES:
            val = df[col].iloc[0]
            le = encoders[col]
            df[col] = le.transform([val])[0] if val in le.classes_ else 0
            
        probabilities = model.predict_proba(df)[0]
        max_idx = np.argmax(probabilities)
        prediction_class = model.classes_[max_idx]
        confidence = float(probabilities[max_idx] * 100)
        is_attack = prediction_class != 'Normal'
        
        payload = {
            "prediction": "ATTACK" if is_attack else "NORMAL",
            "attackType": prediction_class if is_attack else "Normal",
            "confidence": f"{confidence:.2f}",
            "srcIP": features.get("srcIP"),
            "dstIP": features.get("dstIP"),
            "protocol": features.get("protocol_type").upper(),
            "bytes": features.get("src_bytes") + features.get("dst_bytes"),
            "duration": features.get("duration")
        }
        
        msg = f"data: {json.dumps(payload)}\n\n"
        print(f"[DEBUG] Packet processed and queued: {features.get('protocol_type')} from {features.get('srcIP')}")
        for q in sse_listeners:
            try:
                q.put_nowait(msg)
            except queue.Full:
                pass
    except Exception as e:
        print(f"[DEBUG] ML Evaluation crashed: {e}")

def start_sniffer():
    global sniffer_active, sniffer_error
    if sniff:
        try:
            from scapy.all import conf
            # Dynamically find the active internet interface (Wi-Fi or Ethernet)
            active_iface = conf.route.route("8.8.8.8")[0]
            print(f"Starting Scapy Sniffer on active interface: {active_iface.name}...")
            sniffer_active = True
            sniffer_error = ""
            sniff(iface=active_iface, prn=process_scapy_packet, store=False)
        except Exception as e:
            print(f"Failed to start sniffer on specific interface. Falling back to default. Error: {e}")
            try:
                sniffer_active = True
                sniffer_error = ""
                sniff(prn=process_scapy_packet, store=False)
            except Exception as e2:
                sniffer_active = False
                sniffer_error = f"Sniffer error: {e2}"
                print(f"Sniffer failed completely: {e2}")
    else:
        sniffer_active = False
        sniffer_error = "Scapy not installed"
        print("Scapy not installed. Sniffer disabled.")

@app.route('/api/sniffer_status', methods=['GET'])
@require_auth
def sniffer_status():
    global sniffer_active, sniffer_error
    import ctypes
    try:
        is_admin = ctypes.windll.shell32.IsUserAnAdmin()
    except Exception:
        is_admin = False
    npcap_installed = os.path.exists("C:\\Program Files\\Npcap")
    return jsonify({
        "active": sniffer_active,
        "error": sniffer_error,
        "is_admin": is_admin,
        "npcap_installed": npcap_installed,
        "scapy_installed": sniff is not None
    })

@app.route('/api/live_stream')
@require_auth
def live_stream():
    def event_stream():
        q = queue.Queue(maxsize=100)
        sse_listeners.append(q)
        try:
            while True:
                msg = q.get()
                yield msg
        except GeneratorExit:
            if q in sse_listeners:
                sse_listeners.remove(q)
    return Response(event_stream(), mimetype="text/event-stream")

if __name__ == '__main__':
    import ctypes
    import sys
    
    # Check if running as Administrator (required for Scapy)
    try:
        is_admin = ctypes.windll.shell32.IsUserAnAdmin()
    except Exception:
        is_admin = False
    
    print("=" * 60)
    print("  NIDS Backend Server - Startup Diagnostics")
    print("=" * 60)
    print(f"  Model Loaded:     {'YES' if model else 'NO'}")
    print(f"  Scapy Available:  {'YES' if sniff else 'NO'}")
    print(f"  Admin Privileges: {'YES' if is_admin else 'NO (REQUIRED for packet capture!)'}")
    
    # Check Npcap
    npcap_installed = os.path.exists("C:\\Program Files\\Npcap")
    print(f"  Npcap Driver:     {'FOUND' if npcap_installed else 'NOT FOUND (REQUIRED!)'}")
    print("=" * 60)
    
    if not is_admin:
        print("\n  WARNING: You MUST run this as Administrator!")
        print("  Right-click VS Code -> 'Run as Administrator'\n")
        sniffer_error = "Administrator privileges required. Right-click VS Code and choose 'Run as Administrator'."
    
    if not npcap_installed:
        print("\n  WARNING: Npcap is not installed!")
        print("  Download it from: https://npcap.com/#download\n")
        sniffer_error = "Npcap driver not installed. Download it from https://npcap.com/#download."
    
    # Start sniffer thread ONLY here (not at module level)
    if sniff and is_admin and npcap_installed:
        sniffer_thread = threading.Thread(target=start_sniffer, daemon=True)
        sniffer_thread.start()
        print("  Sniffer thread launched successfully!")
    elif sniff and not is_admin:
        print("  Sniffer SKIPPED - no admin privileges.")
    
    # use_reloader=False prevents Flask from running the code twice
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True, use_reloader=False)
