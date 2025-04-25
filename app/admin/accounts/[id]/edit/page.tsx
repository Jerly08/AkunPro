'use client';

import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { useState, useEffect } from 'react';

import AdminHeader from '@/components/admin/AdminHeader';
import EditAccountForm from './EditAccountForm';
import prisma from '@/lib/prisma';
import EditAccountPageClient from './EditAccountClient';

interface PageParams {
  id: string;
}

interface EditAccountPageProps {
  params: PageParams;
  searchParams?: Record<string, string | string[] | undefined>;
}

async function getAccountById(id: string) {
  try {
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        profiles: {
          select: {
            id: true,
            name: true,
            pin: true,
            isKids: true,
            orderId: true,
            userId: true,
          }
        }
      }
    });
    
    // Tambahkan log lebih detail
    console.log("========= DATA ACCOUNT LOADED =========");
    console.log(JSON.stringify(account, null, 2));
    console.log("======================================");
    
    return account;
  } catch (error) {
    console.error('Error fetching account:', error);
    return null;
  }
}

// Server component for data fetching 
export default async function EditAccountPage({ params }: EditAccountPageProps) {
  // Akses id langsung dari params
  const id = params.id;
  
  // Periksa sesi pengguna (auth)
  const session = await getServerSession();
  
  // Jika pengguna tidak login atau bukan admin, redirect ke halaman login
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/auth/login');
  }
  
  const account = await getAccountById(id);
  
  if (!account) {
    return notFound();
  }

  // Pass data as props to client component
  return <EditAccountPageClient account={account} id={id} />;
} 