import {env} from 'cloudflare:workers';
import {getDb} from '../db';
import {ownerEmails} from '../db/schema';
import {eq} from 'drizzle-orm';
import {z} from 'zod';
export const ownerEmailSchema=z.string().trim().max(254).email('Enter a valid email address.').transform(v=>v.toLowerCase());
export function configuredOwners(){return [...new Set((env.DTB_OWNER_EMAILS||'').split(',').map(s=>ownerEmailSchema.safeParse(s)).filter(p=>p.success).map(p=>p.data!))]}
export async function isAuthorizedOwner(email:string){const p=ownerEmailSchema.safeParse(email);if(!p.success)return false;if(configuredOwners().includes(p.data))return true;try{return !!(await getDb().select({email:ownerEmails.email}).from(ownerEmails).where(eq(ownerEmails.email,p.data)))[0]}catch{return false}}
export async function listOwnerEmails(){const baseline=configuredOwners();const added=await getDb().select().from(ownerEmails);return [...baseline.map(email=>({email,source:'Initial owner',createdBy:null,createdAt:null})),...added.filter(o=>!baseline.includes(o.email)).map(o=>({...o,source:'Added by owner'}))].sort((a,b)=>a.email.localeCompare(b.email));}
