import {getActor} from '../../../lib/owner';
import {getDb} from '../../../db';
import {registrations,trialRequests,assignments,inbox,rewardMembers,rewardClaims} from '../../../db/schema';
import {and,eq,desc,inArray} from 'drizzle-orm';
import {workspaceSchema,sameOrigin,rewardsEligible,cities} from '../../../lib/validation';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){const a=await getActor();if(!a)return reply({error:'Please sign in.'},401);const db=getDb();try{
 const regs=await db.select().from(registrations).where(a.isOwner?undefined:eq(registrations.userId,a.userId));
 const parsed=regs.map(r=>({...r,payload:undefined,data:JSON.parse(r.payload)}));
 let requests=await db.select().from(trialRequests).where(a.isOwner?undefined:eq(trialRequests.userId,a.userId)).orderBy(desc(trialRequests.createdAt));
 const ownAssignments=await db.select().from(assignments).where(a.isOwner?undefined:eq(assignments.tutorUserId,a.userId));
 const approved=regs.some(r=>r.role==='tutor'&&r.status==='Approved');
 const tutorAssignments=[];
 if(!a.isOwner&&approved)for(const assignment of ownAssignments){
  const r=(await db.select().from(trialRequests).where(eq(trialRequests.id,assignment.requestId)))[0];if(!r)continue;
  const p=(await db.select().from(registrations).where(eq(registrations.id,r.userId+':learner')))[0];const data=p?JSON.parse(p.payload):{};
  tutorAssignments.push({id:r.id,subject:r.subject,mode:r.mode,availability:r.availability,notes:r.notes,status:r.status,schedule:assignment.schedule,ownerNote:assignment.ownerNote,learner:{studentName:data.studentName,grade:data.grade,goal:data.goal,city:data.city,locality:data.locality}});
 }
 const requestIds=requests.map(r=>r.id);const matches=requestIds.length?await db.select().from(assignments).where(inArray(assignments.requestId,requestIds)):[];
 const safeRequests=requests.map(r=>{const m=matches.find(x=>x.requestId===r.id);return {...r,assignment:a.isOwner?m:m?{stage:m.stage,ownerNote:m.ownerNote,schedule:m.schedule,assigned:true}:null}});
 const messages=await db.select().from(inbox).where(a.isOwner?undefined:eq(inbox.threadUserId,a.userId)).orderBy(inbox.createdAt);
 const claims=await db.select().from(rewardClaims).where(a.isOwner?undefined:eq(rewardClaims.userId,a.userId)).orderBy(desc(rewardClaims.createdAt));
 const safeClaims=claims.map(c=>{const d=JSON.parse(c.details);if(!a.isOwner&&c.kind==='Referral')delete d.referredUserId;return {...c,details:d}});
 const member=(await db.select().from(rewardMembers).where(eq(rewardMembers.userId,a.userId)))[0];
 return reply({isOwner:a.isOwner,userId:a.userId,registrations:parsed,requests:safeRequests,tutorAssignments,messages,claims:safeClaims,referralCode:member?.code||null});
 }catch{return reply({error:'Your workspace could not be loaded. Please retry.'},503)}}
export async function POST(request:Request){const a=await getActor();if(!a)return reply({error:'Please sign in.'},401);if(!sameOrigin(request))return reply({error:'Invalid request origin.'},403);const raw=await request.text();if(raw.length>16000)return reply({error:'Request is too large.'},413);let body;try{body=JSON.parse(raw)}catch{return reply({error:'Invalid request.'},400)}const p=workspaceSchema.safeParse(body);if(!p.success)return reply({error:p.error.issues[0].message},400);const d=p.data;const db=getDb(),now=new Date().toISOString();try{
 if(['assign','tutorReview','reviewReward'].includes(d.action)&&!a.isOwner)return reply({error:'Only G can perform this action.'},403);
 if(d.action==='request'){
  const profile=(await db.select().from(registrations).where(eq(registrations.id,a.userId+':learner')))[0];if(!profile)return reply({error:'Complete parent/student registration first.'},409);const data=JSON.parse(profile.payload);if(!cities.includes(data.city))return reply({error:'Update your profile to a supported Delhi NCR city before sending a request.'},400);
  const pending=(await db.select().from(trialRequests).where(eq(trialRequests.userId,a.userId))).filter(r=>!['Completed','Closed'].includes(r.status));if(pending.length>=5)return reply({error:'You already have five active requests. Message G about an existing request.'},409);
  await db.insert(trialRequests).values({id:crypto.randomUUID(),userId:a.userId,subject:d.subject,mode:d.mode,availability:d.availability,notes:d.notes,status:'Requested',createdAt:now});return reply({ok:true});
 }
 if(d.action==='message'){
  if(!a.isOwner&&d.threadUserId!==a.userId)return reply({error:'You can only access your own conversation.'},403);
  const target=await db.select().from(registrations).where(eq(registrations.userId,d.threadUserId));if(!target.length)return reply({error:'Complete registration before messaging.'},409);
  await db.insert(inbox).values({id:crypto.randomUUID(),threadUserId:d.threadUserId,fromOwner:a.isOwner?'yes':'no',body:d.body,createdAt:now});return reply({ok:true});
 }
 if(d.action==='tutorReview'){const target=(await db.select().from(registrations).where(eq(registrations.id,d.userId+':tutor')))[0];if(!target)return reply({error:'Tutor application not found.'},404);await db.update(registrations).set({status:d.status,updatedAt:now}).where(eq(registrations.id,target.id));return reply({ok:true});}
 if(d.action==='assign'){
  const r=(await db.select().from(trialRequests).where(eq(trialRequests.id,d.requestId)))[0];if(!r)return reply({error:'Request not found.'},404);
  if(['Assigned','Scheduled','Completed'].includes(d.stage)&&!d.tutorUserId)return reply({error:'Select yourself or an approved tutor.'},400);
  if(d.stage==='Scheduled'&&!d.schedule)return reply({error:'Add a confirmed schedule for a scheduled request.'},400);
  const tutorId=d.tutorUserId==='owner'?a.userId:d.tutorUserId;
  if(tutorId&&tutorId!==a.userId){const t=(await db.select().from(registrations).where(eq(registrations.id,tutorId+':tutor')))[0];if(t?.status!=='Approved')return reply({error:'The selected tutor must be approved first.'},400);}
  const row={requestId:r.id,tutorUserId:tutorId,stage:d.stage,ownerNote:d.ownerNote,schedule:d.schedule,updatedAt:now};
  await db.batch([db.insert(assignments).values(row).onConflictDoUpdate({target:assignments.requestId,set:row}),db.update(trialRequests).set({status:d.stage}).where(eq(trialRequests.id,r.id))]);return reply({ok:true});
 }
 if(d.action==='achievement'){
  const l=(await db.select().from(registrations).where(eq(registrations.id,a.userId+':learner')))[0];if(!l||!rewardsEligible(JSON.parse(l.payload)))return reply({error:'Rewards are for Class 10, Class 12 and entrance-exam learners only.'},403);
  if(d.score!==d.total)return reply({error:'This reward celebrates full marks. Obtained marks must equal total marks.'},400);
  const key=a.userId+':'+d.exam.toLowerCase().replace(/\s+/g,' ')+':'+d.subject+':'+d.year;
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)))).map(n=>n.toString(16).padStart(2,'0')).join('');
  if((await db.select().from(rewardClaims).where(eq(rewardClaims.id,hash))).length)return reply({error:'A claim for this exam, subject and year already exists.'},409);
  await db.insert(rewardClaims).values({id:hash,userId:a.userId,kind:'Full marks',details:JSON.stringify(d),status:'Pending',points:'0',ownerNote:'',createdAt:now});return reply({ok:true});
 }
 if(d.action==='reviewReward'){
  const c=(await db.select().from(rewardClaims).where(eq(rewardClaims.id,d.claimId)))[0];if(!c)return reply({error:'Claim not found.'},404);if(c.status!=='Pending')return reply({error:'This claim has already been reviewed.'},409);
  const l=(await db.select().from(registrations).where(eq(registrations.id,c.userId+':learner')))[0];if(d.decision==='Approved'&&(!l||!rewardsEligible(JSON.parse(l.payload))))return reply({error:'This learner is not currently eligible for rewards.'},400);
  if(d.decision==='Approved'&&d.points<1)return reply({error:'Enter at least one point to approve.'},400);
  const changed=await db.update(rewardClaims).set({status:d.decision,points:d.decision==='Approved'?String(d.points):'0',ownerNote:d.ownerNote,reviewedAt:now}).where(and(eq(rewardClaims.id,c.id),eq(rewardClaims.status,'Pending'))).returning({id:rewardClaims.id});if(!changed.length)return reply({error:'This claim was already reviewed.'},409);return reply({ok:true});
 }
 return reply({error:'Unsupported action.'},400);
 }catch{return reply({error:'The change could not be saved. Please retry.'},503)}}
