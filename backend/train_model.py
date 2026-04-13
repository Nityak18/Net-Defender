import pandas as pd
import numpy as np
import urllib.request
import os
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

DATA_URL = "https://raw.githubusercontent.com/defcom17/NSL_KDD/master/KDDTrain%2B.txt"
DATA_FILE = "KDDTrain.txt"
MODEL_FILE = "nsl_kdd_rf_model.pkl"
ENCODER_FILE = "label_encoders.pkl"

# NSL-KDD Feature Names
columns = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes', 
    'land', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 'logged_in', 
    'num_compromised', 'root_shell', 'su_attempted', 'num_root', 'num_file_creations', 
    'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login', 
    'is_guest_login', 'count', 'srv_count', 'serror_rate', 'srv_serror_rate', 
    'rerror_rate', 'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate', 
    'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count', 
    'dst_host_same_srv_rate', 'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate', 
    'dst_host_srv_diff_host_rate', 'dst_host_serror_rate', 'dst_host_srv_serror_rate', 
    'dst_host_rerror_rate', 'dst_host_srv_rerror_rate', 'attack_type', 'difficulty_level'
]

# We are focusing on features provided by our frontend form:
FRONTEND_FEATURES = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes', 
    'land', 'wrong_fragment', 'urgent', 'logged_in', 'count', 'srv_count', 
    'same_srv_rate', 'diff_srv_rate', 'num_failed_logins', 'su_attempted'
]

CATEGORICAL_FEATURES = ['protocol_type', 'service', 'flag']

def download_data():
    if not os.path.exists(DATA_FILE):
        print(f"Downloading dataset from {DATA_URL}...")
        urllib.request.urlretrieve(DATA_URL, DATA_FILE)
        print("Download complete.")
    else:
        print("Dataset already exists locally.")

def prepare_data():
    df = pd.read_csv(DATA_FILE, names=columns)
    
    # Map attack types to categories
    dos_attacks = ['apache2', 'back', 'land', 'neptune', 'mailbomb', 'pod', 'processtable', 'smurf', 'teardrop', 'udpstorm', 'worm']
    probe_attacks = ['ipsweep', 'mscan', 'nmap', 'portsweep', 'saint', 'satan']
    r2l_attacks = ['dict', 'ftp_write', 'guess_passwd', 'httptunnel', 'imap', 'multihop', 'named', 'phf', 'sendmail', 'snmpgetattack', 'snmpguess', 'spy', 'warezclient', 'warezmaster', 'xlock', 'xsnoop']
    u2r_attacks = ['buffer_overflow', 'loadmodule', 'perl', 'ps', 'rootkit', 'sqlattack', 'xterm']
    
    def map_attack_class(attack):
        if attack == 'normal': return 'Normal'
        if attack in dos_attacks: return 'DoS'
        if attack in probe_attacks: return 'Probe'
        if attack in r2l_attacks: return 'R2L'
        if attack in u2r_attacks: return 'U2R'
        return 'Unknown Attack'

    df['attack_class'] = df['attack_type'].apply(map_attack_class)
    
    # Since our frontend form only collects a subset of 16 features for simplicity, 
    # we will train the model using ONLY those 16 features so we can predict correctly.
    X = df[FRONTEND_FEATURES].copy()
    y = df['attack_class']
    
    # Label encoding for categorical features
    encoders = {}
    for col in CATEGORICAL_FEATURES:
        le = LabelEncoder()
        # Ensure 'unknown' is handled gracefully if unseen category appears
        # By fitting on strings globally
        X[col] = X[col].astype(str)
        le.fit(X[col])
        X[col] = le.transform(X[col])
        encoders[col] = le
        
    return X, y, encoders

def train_model():
    print("Preparing data...")
    X, y, encoders = prepare_data()
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier on subset features...")
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('rf', RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1))
    ])
    
    pipeline.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Validation Accuracy: {acc * 100:.2f}%")
    
    print("Saving model and encoders...")
    joblib.dump(pipeline, MODEL_FILE)
    joblib.dump(encoders, ENCODER_FILE)
    
    print("Artifacts saved. Model is ready for serving!")

if __name__ == '__main__':
    download_data()
    train_model()
