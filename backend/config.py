import os

class Config:
    # SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/digital_diary'
    JWT_SECRET = os.environ.get('JWT_SECRET') or 'your-jwt-secret'