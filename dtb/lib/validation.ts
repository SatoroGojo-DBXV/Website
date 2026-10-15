import { z } from 'zod';
export const cities=['Delhi','Noida','Greater Noida','Ghaziabad','Gurugram','Faridabad'] as const;
export const subjects=['Mathematics','Science','Social Studies','English','Physics','Chemistry','Biology','Commerce','Other'] as const;
export const goals=['School learning','Class 10 boards','Class 12 boards','JEE','NEET','CAT','Bank PO','CUET','Other entrance exam','Other'] as const;
export const grades=['Primary (1–5)','Middle (6–8)','Class 9','Class 10','Class 11','Class 12','Exam aspirant'] as const;
const short=z.string().trim().min(1).max(100);
const common={name:short,phone:z.string().trim().regex(/^([6-9]\d{9})?$/,'Enter a 10-digit Indian mobile number or leave blank.'),city:z.enum(cities),locality:z.string().trim().min(2).max(100),consent:z.literal(true)};
export const registrationSchema=z.discriminatedUnion('role',[
 z.object({...common,role:z.literal('learner'),accountType:z.enum(['Parent / guardian','Student']),studentName:short,grade:z.enum(grades),board:z.enum(['CBSE','ICSE / ISC','State Board','IB','Cambridge','Other','Not applicable']),subjects:z.array(z.enum(subjects)).min(1).max(9),mode:z.enum(['Home tuition','Online','Either']),goal:z.enum(goals),goalDetail:z.string().trim().max(300),goals:z.string().trim().max(1500),referralCode:z.string().trim().toUpperCase().regex(/^(DTB-[A-F0-9]{12})?$/,'Please enter a valid DTB referral code.').default('')}),
 z.object({...common,role:z.literal('tutor'),qualifications:z.string().trim().min(2).max(300),experience:z.coerce.number().int().min(0).max(60),subjects:z.array(z.enum(subjects)).min(1).max(9),levels:z.array(z.enum(['Primary','Middle','High School','Entrance exams'])).min(1).max(4),availability:z.enum(['Weekdays','Weekends','Both']),mode:z.enum(['Home tuition','Online','Either']),rate:z.coerce.number().min(100).max(20000),bio:z.string().trim().min(30).max(1500)})
]);
export const requestSchema=z.object({subject:z.enum(subjects),mode:z.enum(['Home tuition','Online','Either']),availability:z.enum(['Weekdays','Weekends','Either']),notes:z.string().trim().min(10).max(1500)});
export const trialSchema=requestSchema;
export const workspaceSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('request'),...requestSchema.shape}),
 z.object({action:z.literal('message'),threadUserId:z.string().min(1).max(200),body:z.string().trim().min(1).max(3000)}),
 z.object({action:z.literal('assign'),requestId:z.string().min(1).max(200),tutorUserId:z.string().max(200),stage:z.enum(['Under review','Assigned','Scheduled','Completed','Closed']),ownerNote:z.string().trim().max(1000),schedule:z.string().trim().max(200)}),
 z.object({action:z.literal('tutorReview'),userId:z.string().min(1).max(200),status:z.enum(['Approved','Pending review','Declined'])}),
 z.object({action:z.literal('achievement'),exam:z.string().trim().min(2).max(100),subject:z.enum(subjects),year:z.coerce.number().int().min(2020).max(2100),score:z.coerce.number().positive().max(10000),total:z.coerce.number().positive().max(10000),evidence:z.string().trim().min(15).max(1500)}),
 z.object({action:z.literal('reviewReward'),claimId:z.string().min(1).max(200),decision:z.enum(['Approved','Declined']),points:z.coerce.number().int().min(0).max(10000),ownerNote:z.string().trim().min(3).max(1000),verified:z.literal(true)})
]);
export function rewardsEligible(data:{grade?:string;goal?:string}){return ['Class 10','Class 12'].includes(data.grade||'')||['JEE','NEET','CAT','Bank PO','CUET','Other entrance exam'].includes(data.goal||'');}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !!origin&&origin===new URL(request.url).origin;}
export function isOwnerIdentity(email:string,configuredEmail:string|undefined){return !!configuredEmail&&email.toLowerCase()===configuredEmail.trim().toLowerCase();}
