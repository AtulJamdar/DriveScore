# DriveScore - Safe Driving Telematics + Rewards 

- Smartphone based telematics without hardware dongle.

## Features
- Live GPS tracking with Leaflet (free)
- Harsh braking / accel / turn detection using physics: a=(v2-v1)/dt
- Live Score 100 to 0, Voice alerts (Web Speech API)
- Attento Miles: 1km = 10 miles, redeem for fuel vouchers
- PWA installable, works in real car
- Mock Drive Mode for demo without car

## Tech Stack
- Frontend: Next.js 14, Shadcn, Leaflet, Firebase Hosting + Vercel
- Backend: NestJS 10, MongoDB Atlas (GCP asia-south1), Cloud Run / Render
- Sensors: Geolocation API, DeviceMotionEvent (gyro)

## Live Demo
Frontend: https://drive-score-alpha.vercel.app
Backend: https://drivescore.onrender.com
Test: Open on mobile -> Start Trip -> Drive -> End -> Go to Wallet -> Redeem

## What I learned
- GPS glitch filtering (<1km segment)
- Haversine distance, not point count
- Cooldown logic to avoid toast spam
- Real sensor fusion is hard - Attento's team is doing great work

## Next Steps
- Add ML model for driver profiling
- Firebase Auth, leaderboards
- Real-time parent tracking

Built by Atul - MERN Developer applying for Full-stack Intern @ Attento Tech, Baner, Pune.
I know this MVP is not perfect, but I want to learn from your team and grow Attento with you.
