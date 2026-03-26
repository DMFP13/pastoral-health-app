#!/usr/bin/env bash
set -e

echo "==> Installing frontend dependencies"
cd frontend
npm install --legacy-peer-deps

echo "==> Building frontend"
VITE_API_URL="" npm run build   # empty = same-origin, no env var needed

echo "==> Copying frontend build into backend/static"
cd ..
rm -rf backend/static
cp -r frontend/dist backend/static

echo "==> Installing backend dependencies"
cd backend
pip install -r requirements.txt

echo "==> Build complete"
