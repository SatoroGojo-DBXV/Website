import {getOwnerActor} from '../../../../lib/owner';
import {listOwnerEmails,isAuthorizedOwner,ownerEmailSchema} from '../../../../lib/owner-directory';
import {sameOrigin} from '../../../../lib/validation';
import {getDb} from '../../../../db';
import {ownerEmails} from '../../../../db/schema';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){const a=await getOwnerActor();if(!a)return reply({error:'Unlock the owner desk to manage access.'},403);try{return reply({owners:await listOwnerEmails()})}catch{return reply({error:'Owner access list could not be loaded.'},503)}}
export async function POST(request:Request){const a=await getOwnerActor();if(!a)return reply({error:'Unlock the owner desk to manage access.'},403);if(!sameOrigin(request))return reply({error:'Invalid request origin.'},403);const raw=await request.text();if(raw.length>1000)return reply({error:'Invalid request.'},400);let body;try{body=JSON.parse(raw)}catch{return reply({error:'Invalid request.'},400)}const p=ownerEmailSchema.safeParse(body.email);if(!p.success||body.confirm!==true)return reply({error:'Enter a valid email and confirm full owner access.'},400);try{if(await isAuthorizedOwner(p.data))return reply({error:'This email already has owner access.'},409);const added=await getDb().insert(ownerEmails).values({email:p.data,createdBy:a.email.trim().toLowerCase(),createdAt:new Date().toISOString()}).onConflictDoNothing().returning();if(!added.length)return reply({error:'This email already has owner access.'},409);return reply({ok:true,email:p.data})}catch{return reply({error:'Owner access could not be saved.'},503)}}
