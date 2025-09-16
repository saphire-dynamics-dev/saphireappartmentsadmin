'use client';
import { useState } from 'react';
import Image from "next/image";
import AccessCodeForm from '@/components/auth/AccessCodeForm';
import LoginForm from '@/components/auth/LoginForm';

export default function Home() {
  const [accessGranted, setAccessGranted] = useState(false);

  const handleAccessGranted = () => {
    setAccessGranted(true);
  };

  if (!accessGranted) {
    return <AccessCodeForm onAccessGranted={handleAccessGranted} />;
  }

  return <LoginForm />;
}
