"use client"

import { useEffect } from 'react';
import { BusinessProfileForm } from './businessProfileForm'
import { useBusinessProfileStore } from '@/store/business-profile/business-profile.store';

export default function BusinessProfilePage() {
  const {fetchBusinessProfile, loading, profile} = useBusinessProfileStore();

  useEffect(() => { 
    fetchBusinessProfile();
  }, [fetchBusinessProfile]);

  return (
    <div>
      <BusinessProfileForm
        initialData={profile}
        loading={loading}
        onSuccess={()=> {
          fetchBusinessProfile();
        }}
      />
    </div>
  )
}
