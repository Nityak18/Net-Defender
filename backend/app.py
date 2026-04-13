from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
import joblib
import pandas as pd
import numpy as np
import os

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
        # Allow requests with valid token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid token. You must be logged in."}), 401
        
        token = auth_header.split(" ")[1]
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
