import type { DefaultSession } from 'next-auth';
declare module 'next-auth' { interface Session { user:{id:string;createdAt?:string|null;emailVerified?:string|null}&DefaultSession['user'] } interface User { createdAt?:string; emailVerified?:string | null } }
declare module 'next-auth/jwt' { interface JWT { createdAt?:string; emailVerified?:string } }
