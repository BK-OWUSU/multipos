"use client" 

import { useAuthStore } from '@/store/useAuthStore';
import UserProfile from './UserProfilePage';

export default function ProfilePage() {
  const {user, logout} = useAuthStore();
  return (
    <div>
      {user && (
        <UserProfile
          user={user}
          onLogout={logout}
      />
      )}
    </div>
  )
}
