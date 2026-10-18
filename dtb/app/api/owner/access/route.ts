import {env} from 'cloudflare:workers';
import {getActor} from '../../../../lib/owner';
import {sameOrigin} from '../../../../lib/validation';
import {gateConfigured,safeEqual,issueOwnerSession} from '../../../../lib/owner-security';
import {isAuthorizedOwner} from '../../../../lib/owner-directory';
import {getDb} from '../../../../db';
import {ownerAttempts} from '../../../../db/schema';
import {sql} from 'drizzle-orm';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200,extra:Record<string,string>={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...extra}});
export async function POST(request:Request){if(!sameOrigin(request))return reply({error:'Invalid request origin.'},403);if(!gateConfigured(env.DTB_OWNER_CODE,env.DTB_OWNER_SESSION_SECRET))return reply({error:'Not found.'},404);const a=await getActor();if(!a||!await isAuthorizedOwner(a.email))return reply({error:'Owner sign-in required.'},403);const raw=await request.text();if(raw.length>1000)return reply({error:'Invalid request.'},400);let d;try{d=JSON.parse(raw)}catch{return reply({error:'Invalid request.'},400)}if(typeof d.code!=='string')return reply({error:'Invalid request.'},400);
 try{const now=Date.now(),cutoff=String(now-15*60*1000);const result=await getDb().insert(ownerAttempts).values({userId:a.userId,count:'1',windowStart:String(now)}).onConflictDoUpdate({target:ownerAttempts.userId,set:{count:sql`CASE WHEN CAST(${ownerAttempts.windowStart} AS INTEGER) < ${cutoff} THEN '1' ELSE CAST(CAST(${ownerAttempts.count} AS INTEGER) + 1 AS TEXT) END`,windowStart:sql`CASE WHEN CAST(${ownerAttempts.windowStart} AS INTEGER) < ${cutoff} THEN ${String(now)} ELSE ${ownerAttempts.windowStart} END`}}).returning();if(Number(result[0].count)>5)return reply({error:'Too many attempts. Try again in 15 minutes.'},429,{'Retry-After':'900'});
 if(!(await safeEqual(d.code,env.DTB_OWNER_CODE!)))return reply({error:'The access code is incorrect.'},403);
 const token=await issueOwnerSession(a.userId,env.DTB_OWNER_CODE!,env.DTB_OWNER_SESSION_SECRET!);return reply({ok:true},200,{'Set-Cookie':`__Host-dtb-owner=${token}; Path=/; Max-Age=1800; HttpOnly; Secure; SameSite=Strict`});
 }catch{return reply({error:'Owner access could not be checked. Please retry.'},503)}}
export async function DELETE(request:Request){if(!sameOrigin(request))return reply({error:'Invalid request origin.'},403);return reply({ok:true},200,{'Set-Cookie':'__Host-dtb-owner=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict'});}
