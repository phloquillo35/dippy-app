import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useBusinessStore } from '@/store/businessStore';

export default function TabLayoutRedirect() {
  const router = useRouter();
  const { activeBusiness } = useBusinessStore();

  useEffect(() => {
    if (activeBusiness === 'kiosko') {
      router.replace('/(kiosko)');
    } else if (activeBusiness === 'delivery') {
      router.replace('/(delivery)');
    } else {
      router.replace('/');
    }
  }, [activeBusiness]);

  return null;
}
