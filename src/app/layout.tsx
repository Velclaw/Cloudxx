import type { Metadata } from 'next';
import './globals.css';
import { AuthSessionProvider } from './session-provider';
export const metadata:Metadata={title:'Cloudxx — DNS Manager',description:'Cloudxx domain and DNS management.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body><AuthSessionProvider>{children}</AuthSessionProvider></body></html>;}
