import { z } from 'zod';
const short = z.string().trim().min(1).max(100);
const common = { name: short, phone: z.string().trim().regex(/^([6-9]\d{9})?$/, 'Enter a valid 10-digit Indian mobile number or leave blank'), city: short, consent: z.literal(true) };
export const registrationSchema = z.discriminatedUnion('role', [
 z.object({ ...common, role: z.literal('learner'), accountType: z.enum(['Parent / guardian','Student']), studentName: short, grade: z.enum(['Primary (1–5)','Middle (6–8)','Class 9','Class 10','Class 11','Class 12']), board: z.enum(['CBSE','ICSE / ISC','State Board','IB','Cambridge','Other']), subjects: z.array(z.enum(['Mathematics','Science','Languages','Commerce'])).min(1).max(4), mode: z.enum(['Home tuition','Online','Either']), goals: z.string().trim().max(1500) }),
 z.object({ ...common, role: z.literal('tutor'), qualifications: z.string().trim().min(2).max(300), experience: z.coerce.number().int().min(0).max(60), subjects: z.array(z.enum(['Mathematics','Science','Languages','Commerce'])).min(1).max(4), levels: z.array(z.enum(['Primary','Middle','High School'])).min(1).max(3), availability: z.enum(['Weekdays','Weekends','Both']), mode: z.enum(['Home tuition','Online','Either']), rate: z.coerce.number().min(100).max(20000), bio: z.string().trim().min(30).max(1500) })
]);
export const trialSchema = z.object({ subject: z.enum(['Mathematics','Science','Languages','Commerce']), mode: z.enum(['Home tuition','Online','Either']), availability: z.enum(['Weekdays','Weekends','Either']), notes: z.string().trim().max(1000) });
export function sameOrigin(request: Request) { const origin = request.headers.get('origin'); return !!origin && origin === new URL(request.url).origin; }
