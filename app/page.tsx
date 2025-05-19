import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/home');
  
  // This code will not be executed due to the redirect
  return null;
}
