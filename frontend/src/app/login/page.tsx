'use client';
import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    localStorage.setItem('firebaseToken', token);
    localStorage.setItem('userId', result.user.uid);
    // Sync with backend
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: result.user.displayName })
    });
    router.push('/');
  };

  const handleEmail = async (e: any) => {
    e.preventDefault();
    const result = await signInWithEmailAndPassword(auth, email, password);
    const token = await result.user.getIdToken();
    localStorage.setItem('firebaseToken', token);
    localStorage.setItem('userId', result.user.uid);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-black mb-6">DriveScore Login</h1>
        <button onClick={handleGoogle} className="w-full bg-black text-white py-3 rounded-xl mb-4">Continue with Google</button>
        <form onSubmit={handleEmail} className="space-y-3">
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full border p-3 rounded-xl text-black" />
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full border p-3 rounded-xl text-black" />
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl">Login with Email</button>
        </form>
      </div>
    </div>
  );
}