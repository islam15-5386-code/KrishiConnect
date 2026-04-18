# KrishiConnect

KrishiConnect is a full-stack agriculture platform with three clients and one backend:

- Backend API: Laravel (PHP)
- Web dashboard: Next.js 14
- Mobile app: Expo React Native
- Infrastructure: Docker Compose (optional)

## Project Structure

- backend: Laravel API and business logic
- web: Next.js company and admin dashboard
- mobile: Expo React Native farmer app
- docker: Nginx, PHP, Postgres configuration

## Local Run

### Backend

1. Go to backend:

	cd backend

2. Install dependencies:

	composer install

3. Start API server:

	php artisan serve --host=127.0.0.1 --port=8001

### Web

1. Go to web:

	cd web

2. Install dependencies:

	npm install

3. Start dev server:

	npm run dev -- --port 3002

### Mobile

1. Go to mobile:

	cd mobile

2. Install dependencies:

	npm install

3. Start Expo:

	npx expo start --port 8090

## Environment

- Web API base URL should point to backend, for example:
  NEXT_PUBLIC_API_URL=http://127.0.0.1:8001/api

## License

Private project.
