from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
import bcrypt
import jwt
import logging
from bson.objectid import ObjectId, InvalidId

app = Flask(__name__)
CORS(app, origins=["https://digital-diary-eta.vercel.app"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
MONGO_URI = os.getenv('MONGO_URI')
# SECRET_KEY = os.getenv('SECRET_KEY')
JWT_SECRET = os.getenv('JWT_SECRET')

# Validate environment variables
if not MONGO_URI:
    logger.error("MONGO_URI not set in .env")
    raise ValueError("MONGO_URI environment variable is required")
# if not SECRET_KEY:
#     logger.error("SECRET_KEY not set in .env")
#     raise ValueError("SECRET_KEY environment variable is required")
if not JWT_SECRET:
    logger.error("JWT_SECRET not set in .env")
    raise ValueError("JWT_SECRET environment variable is required")

# MongoDB connection
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    db = client['digital_diary']
    users_collection = db['users']
    notes_collection = db['notes']
    logger.info("MongoDB Atlas connection successful")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB Atlas: {e}")
    raise

# Routes
@app.route('/api/health', methods=['GET'])
def health():
    try:
        client.admin.command('ping')
        return jsonify({"status": "ok", "database": "connected"})
    except Exception:
        return jsonify({"status": "error", "database": "disconnected"}), 500

@app.route('/api/users/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    if users_collection.find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    users_collection.insert_one({"username": username, "password": hashed_password})
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/users/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = users_collection.find_one({"username": username})
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode({
        'username': username,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, JWT_SECRET, algorithm='HS256')

    return jsonify({"token": token})

@app.route('/api/notes', methods=['GET', 'POST'])
def notes():
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401

    try:
        payload = jwt.decode(token.replace('Bearer ', ''), JWT_SECRET, algorithms=['HS256'])
        username = payload['username']
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    if request.method == 'GET':
        user_notes = list(notes_collection.find({"username": username}))
        # Convert ObjectId to string for JSON serialization
        for note in user_notes:
            note['_id'] = str(note['_id'])
        return jsonify(user_notes)

    elif request.method == 'POST':
        data = request.get_json()
        title = data.get('title')
        content = data.get('content')

        if not title or not content:
            return jsonify({"error": "Title and content are required"}), 400

        note = {
            "username": username,
            "title": title,
            "content": content,
            "created_at": datetime.utcnow()
        }
        notes_collection.insert_one(note)
        return jsonify({"message": "Note created successfully"}), 201

@app.route('/api/notes/<note_id>', methods=['PUT', 'DELETE'])
def note(note_id):
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return jsonify({"error": "Unauthorized"}), 401

    try:
        payload = jwt.decode(token.replace('Bearer ', ''), JWT_SECRET, algorithms=['HS256'])
        username = payload['username']
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    # Validate note_id
    try:
        obj_id = ObjectId(note_id)
    except InvalidId:
        return jsonify({"error": "Invalid note ID"}), 400

    if request.method == 'PUT':
        data = request.get_json()
        title = data.get('title')
        content = data.get('content')

        if not title or not content:
            return jsonify({"error": "Title and content are required"}), 400

        result = notes_collection.update_one(
            {"_id": obj_id, "username": username},
            {"$set": {"title": title, "content": content}}
        )
        if result.modified_count == 0:
            return jsonify({"error": "Note not found or not authorized"}), 404
        return jsonify({"message": "Note updated successfully"})

    elif request.method == 'DELETE':
        result = notes_collection.delete_one({"_id": obj_id, "username": username})
        if result.deleted_count == 0:
            return jsonify({"error": "Note not found or not authorized"}), 404
        return jsonify({"message": "Note deleted successfully"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)