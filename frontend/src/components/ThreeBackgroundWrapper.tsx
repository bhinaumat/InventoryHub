"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const ThreeBackgroundImpl = dynamic(() => import('@/components/ThreeBackground'), { ssr: false });

export default function ThreeBackgroundWrapper() {
  return <ThreeBackgroundImpl />;
}
