import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';
export const { handlers, auth, signIn, signOut } = NextAuth({
 adapter: PrismaAdapter(prisma), trustHost: true, session:{strategy:'jwt',maxAge:30*24*60*60},
 providers:[GitHub,Google,Credentials({credentials:{email:{type:'email'},password:{type:'password'}},async authorize(credentials){
  const email=String(credentials?.email??'').trim().toLowerCase(),password=String(credentials?.password??'');
  if(!email||!password)return null;const user=await prisma.user.findUnique({where:{email}});
  if(!user?.passwordHash||!user.emailVerified||!(await bcrypt.compare(password,user.passwordHash)))return null;
  return {id:user.id,email:user.email,name:user.name,image:user.image,createdAt:user.createdAt.toISOString(),emailVerified:user.emailVerified.toISOString()};
 }})],
 callbacks:{async jwt({token,user}){if(user){const u=user as {createdAt?:string;emailVerified?:string};token.createdAt=u.createdAt;token.emailVerified=u.emailVerified;}return token;},async session({session,token}){if(session.user&&token.sub){session.user.id=token.sub;session.user.createdAt=typeof token.createdAt==='string'?token.createdAt:null;session.user.emailVerified=typeof token.emailVerified==='string'?token.emailVerified:undefined;}return session;}},
 pages:{signIn:'/'},
});
