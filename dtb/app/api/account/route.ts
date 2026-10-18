import {getActor} from '../../../lib/owner';
import {getDb} from '../../../db';
import {registrations,rewardMembers,rewardClaims,tutorDocuments} from '../../../db/schema';
import {eq,and} from 'drizzle-orm';
import {registrationSchema,sameOrigin,rewardsEligible} from '../../../lib/validation';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){const actor=await getActor();if(!actor)return reply({error:'Sign in to continue.'},401);try{const rows=await getDb().select().from(registrations).where(eq(registrations.userId,actor.userId));return reply({user:{name:actor.fullName,email:actor.email},isOwner:actor.isOwner,registrations:rows.map(r=>({...r,data:JSON.parse(r.payload),payload:undefined}))});}catch{return reply({error:'Your account could not be loaded. Please try again.'},503)}}
export async function POST(request:Request){const actor=await getActor();if(!actor)return reply({error:'Sign in to register.'},401);if(!sameOrigin(request))return reply({error:'Invalid request origin.'},403);const raw=await request.text();if(raw.length>16000)return reply({error:'Form is too large.'},413);let body;try{body=JSON.parse(raw)}catch{return reply({error:'Invalid form.'},400)}const parsed=registrationSchema.safeParse(body);if(!parsed.success)return reply({error:parsed.error.issues[0].message},400);const data=parsed.data,now=new Date().toISOString(),db=getDb();try{
 if(data.role==='tutor'){const docs=await db.select().from(tutorDocuments).where(eq(tutorDocuments.userId,actor.userId));if(!['identity','qualification'].every(k=>docs.some(d=>d.kind===k)))return reply({error:'Upload identity proof and qualification proof before submitting your tutor application.'},400);}
 const previous=await db.select().from(registrations).where(eq(registrations.id,actor.userId+':'+data.role));
 const member=(await db.select().from(rewardMembers).where(eq(rewardMembers.userId,actor.userId)))[0];
 let referrer:string|null=null;
 if(data.role==='learner'&&data.referralCode){
  const ref=(await db.select().from(rewardMembers).where(eq(rewardMembers.code,data.referralCode)))[0];
  if(!ref||ref.userId===actor.userId)return reply({error:'Use a valid referral code from another learner.'},400);
  if((previous.length||member)&&member?.referredBy!==ref.userId)return reply({error:'A referral code can only be added when the learner first registers.'},409);
  referrer=ref.userId;
 }
 const status=data.role==='tutor'?'Pending review':'Registered';
 const row={id:actor.userId+':'+data.role,userId:actor.userId,role:data.role,payload:JSON.stringify({...data,accountEmail:actor.email}),status,updatedAt:now};
 const writes:any[]=[db.insert(registrations).values(row).onConflictDoUpdate({target:registrations.id,set:{payload:row.payload,status,updatedAt:now}})];
 if(data.role==='learner'&&!member){
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(actor.userId)))).map(n=>n.toString(16).padStart(2,'0')).join('').slice(0,12).toUpperCase();
  writes.push(db.insert(rewardMembers).values({userId:actor.userId,code:'DTB-'+hash,referredBy:referrer,createdAt:now}).onConflictDoNothing());
  if(referrer){const refProfile=(await db.select().from(registrations).where(and(eq(registrations.userId,referrer),eq(registrations.role,'learner'))))[0];if(refProfile&&rewardsEligible(JSON.parse(refProfile.payload)))writes.push(db.insert(rewardClaims).values({id:'referral:'+actor.userId,userId:referrer,kind:'Referral',details:JSON.stringify({referredUserId:actor.userId,description:'A new learner registered using your code. G must confirm genuine enrolment.'}),status:'Pending',points:'0',ownerNote:'',createdAt:now}).onConflictDoNothing());}
 }
 await db.batch(writes as any);return reply({ok:true,status});
 }catch{return reply({error:'Registration was not saved. Please try again.'},503)}}
