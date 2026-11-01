Goal: Replace atul_test_user with Firebase Auth
Backend: 
- users collection: firebaseUid (unique, index), email, displayName
- Guard: verify Bearer token via firebase-admin
- Endpoints: POST /auth/sync (create user if not exists), GET /users/me
- Trips must filter by req.user.uid, not query param
Frontend:
- firebase.ts config from env
- AuthContext with onAuthStateChanged
- login page with Google + email
- All fetch calls add Authorization header
Tests: Try login, start trip, check MongoDB has correct uid