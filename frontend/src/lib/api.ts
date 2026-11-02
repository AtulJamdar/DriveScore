export function getAuthHeaders() {
  const token = localStorage.getItem('firebaseToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}