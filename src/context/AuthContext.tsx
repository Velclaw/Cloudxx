"use client";
import React, { createContext, useContext } from 'react';
import { signOut as authSignOut, useSession } from 'next-auth/react';
type User = { id:string; email:string; created_at:string; email_confirmed_at:string|null; user_metadata:{full_name:string}; name?:string|null; image?:string|null };
interface AuthContextValue { user:User|null; session:unknown; loading:boolean; configured:boolean; passwordRecovery:boolean; signOut:()=>Promise<void> }
const AuthContext=createContext<AuthContextValue|undefined>(undefined);
export const AuthProvider:React.FC<{children:React.ReactNode}>=({children})=>{
 const {data,status}=useSession(); const raw=data?.user as ({id?:string;email?:string|null;name?:string|null;image?:string|null;createdAt?:string;emailVerifiedAt?:string})|undefined;
 const user:User|null=raw?.id?{id:raw.id,email:raw.email??'',created_at:raw.createdAt??new Date().toISOString(),email_confirmed_at:raw.emailVerified??null,user_metadata:{full_name:raw.name??''},name:raw.name,image:raw.image}:null;
 const signOut=async()=>{await authSignOut({callbackUrl:'/'});};
 return <AuthContext.Provider value={{user,session:data,loading:status==='loading',configured:true,passwordRecovery:false,signOut}}>{children}</AuthContext.Provider>;
};
export const useAuth=()=>{const value=useContext(AuthContext);if(!value)throw new Error('useAuth must be used within AuthProvider');return value;};
