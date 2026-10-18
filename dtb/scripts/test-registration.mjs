import {sql} from './test-workspace.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const dir='.sites-runtime/tests';
for(const [file,out] of [['lib/owner-directory.ts','directory'],['app/api/owner/members/route.ts','members'],['lib/owner-security.ts','security'],['lib/owner.ts','owner'],['app/api/documents/route.ts','documents'],['app/api/account/route.ts','account'],['app/api/owner/access/route.ts','access'],['app/api/owner/workspace/route.ts','owner-workspace']]){
 let src=readFileSync(file,'utf8')
 .replace("import {env} from 'cloudflare:workers';","const env=globalThis.testEnv;")
 .replace("import {cookies} from 'next/headers';","const cookies=async()=>({get:()=>({value:globalThis.testCookie||''})});")
 .replace("import {getChatGPTUser} from '../app/chatgpt-auth';","const getChatGPTUser=async()=>globalThis.testActor;")
 .replace(/import \{getActor\} from '[.\/]+lib\/owner';/g,"import {getActor} from './owner.mjs';")
 .replace(/import \{getActor,getOwnerActor\} from '[.\/]+lib\/owner';/g,"import {getActor,getOwnerActor} from './owner.mjs';")
 .replace(/import \{getOwnerActor\} from '[.\/]+lib\/owner';/g,"import {getOwnerActor} from './owner.mjs';")
 .replace("import {getDb} from '../db';","const getDb=()=>globalThis.testDb;")
 .replace(/'[.\/]+lib\/owner-directory'/g,"'./directory.mjs'")
 .replace("'./owner-directory'","'./directory.mjs'")
 .replace(/import \{getDb\} from '[.\/]+db';/g,"const getDb=()=>globalThis.testDb;")
 .replace(/'[.\/]+db\/schema'/g,"'./schema.mjs'")
 .replace(/'[.\/]+lib\/validation'/g,"'./validation.mjs'")
 .replace("'./validation'","'./validation.mjs'")
 .replace(/'[.\/]+lib\/owner-security'/g,"'./security.mjs'")
 .replace("'./owner-security'","'./security.mjs'")
 .replace("'../../workspace/route'","'./workspace.mjs'");
 writeFileSync(`${dir}/${out}.mjs`,ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
const objects=new Map();globalThis.testEnv={DTB_OWNER_EMAILS:'g@test.invalid,second@test.invalid,THIRD@test.invalid',BUCKET:{async put(k,v){objects.set(k,v)},async get(k){return objects.has(k)?{body:objects.get(k)}:null},async delete(k){objects.delete(k)}}};
const sec=await import('../.sites-runtime/tests/security.mjs'),owner=await import('../.sites-runtime/tests/owner.mjs'),docs=await import('../.sites-runtime/tests/documents.mjs'),account=await import('../.sites-runtime/tests/account.mjs'),access=await import('../.sites-runtime/tests/access.mjs'),workspace=await import('../.sites-runtime/tests/owner-workspace.mjs');
const actor=(id)=>globalThis.testActor={userId:id,email:id+'@test.invalid',fullName:id};
const req=(data,path='/api/account')=>new Request('https://dtb.test'+path,{method:'POST',headers:{origin:'https://dtb.test'},body:JSON.stringify(data)});
actor('g');assert.equal((await owner.getActor()).isOwner,false);assert.equal(await owner.getOwnerActor(),null);assert.equal((await access.POST(req({code:'test'}))).status,404);assert.equal((await workspace.GET()).status,403);
Object.assign(globalThis.testEnv,{DTB_OWNER_CODE:'test',DTB_OWNER_SESSION_SECRET:'test-signing-key-not-for-production-123456'});
actor('a');assert.equal((await access.POST(req({code:'test'}))).status,403);
actor('g');assert.equal((await access.POST(req({code:'wrong'}))).status,403);
let res=await access.POST(req({code:'test'}));assert.equal(res.status,200);const cookie=res.headers.get('set-cookie');assert.match(cookie,/HttpOnly; Secure; SameSite=Strict/);globalThis.testCookie=cookie.split(';')[0].split('=')[1];assert.equal((await owner.getOwnerActor()).isOwner,true);assert.equal((await owner.getActor()).isOwner,false);assert.equal((await workspace.GET()).status,200);
actor('a');assert.equal(await owner.getOwnerActor(),null);actor('g');globalThis.testCookie+='x';assert.equal(await owner.getOwnerActor(),null);globalThis.testCookie='';
for(let i=0;i<3;i++)await access.POST(req({code:'wrong'}));assert.equal((await access.POST(req({code:'test'}))).status,429);
const token=await sec.issueOwnerSession('g','test-private-path','test-only-long-code',1000);assert.equal(await sec.verifyOwnerSession(token,'g','test-private-path','test-only-long-code',1801001),false);assert.equal(await sec.verifyOwnerSession(token,'g','changed-private-path','test-only-long-code',1001),false);
actor('newtutor');const application={role:'tutor',name:'New Tutor',phone:'',city:'Delhi',locality:'Rohini',consent:true,qualifications:'BSc Mathematics',experience:2,subjects:['Mathematics'],levels:['High School'],availability:'Both',mode:'Either',rate:500,bio:'I explain concepts step by step and help students practice.'};
assert.equal((await account.POST(req(application))).status,400);
async function upload(kind,content,type){const f=new FormData();f.set('kind',kind);f.set('file',new File([content],'proof.pdf',{type}));return docs.POST(new Request('https://dtb.test/api/documents',{method:'POST',headers:{origin:'https://dtb.test'},body:f}));}
assert.equal((await upload('identity','<script>invalid</script>','application/pdf')).status,400);
assert.equal((await upload('identity','%PDF-1.7 test document','application/pdf')).status,200);assert.equal((await account.POST(req(application))).status,400);
assert.equal((await upload('qualification','%PDF-1.7 test document','application/pdf')).status,200);assert.equal((await account.POST(req(application))).status,200);
res=await docs.GET(new Request('https://dtb.test/api/documents?id=newtutor%3Aidentity'));assert.equal(res.status,200);assert.match(res.headers.get('content-disposition'),/attachment/);
actor('a');assert.equal((await docs.GET(new Request('https://dtb.test/api/documents?id=newtutor%3Aidentity'))).status,404);
actor('g');assert.equal((await docs.GET(new Request('https://dtb.test/api/documents?id=newtutor%3Aidentity'))).status,404);globalThis.testCookie=await sec.issueOwnerSession('g',globalThis.testEnv.DTB_OWNER_CODE,globalThis.testEnv.DTB_OWNER_SESSION_SECRET);assert.equal((await docs.GET(new Request('https://dtb.test/api/documents?id=newtutor%3Aidentity'))).status,200);
actor('newtutor');sql.prepare("UPDATE registrations SET status='Approved' WHERE id='newtutor:tutor'").run();assert.equal((await upload('qualification','%PDF-1.7 replacement','application/pdf')).status,200);assert.equal(sql.prepare("SELECT status FROM registrations WHERE id='newtutor:tutor'").get().status,'Pending review');assert.equal(objects.size,2);
console.log('Passed: mandatory tutor documents, file validation, private downloads, replacement review, owner gate disabled without secrets, identity + code, secure session, expiry/tampering and attempt limits.');

const members=await import('../.sites-runtime/tests/members.mjs');
const directory=await import('../.sites-runtime/tests/directory.mjs');
actor('a');assert.equal((await members.GET()).status,403);assert.equal((await members.POST(req({email:'intruder@test.invalid',confirm:true}))).status,403);
for(const id of ['g','second','third']){
 actor(id);globalThis.testCookie='';assert.equal((await members.GET()).status,403);
 globalThis.testCookie=await sec.issueOwnerSession(id,globalThis.testEnv.DTB_OWNER_CODE,globalThis.testEnv.DTB_OWNER_SESSION_SECRET);
 assert.equal((await owner.getOwnerActor()).isOwner,true);
 assert.equal((await members.POST(req({email:id+'-added@test.invalid',confirm:true}))).status,200);
}
assert.equal((await members.POST(req({email:'THIRD-ADDED@TEST.INVALID',confirm:true}))).status,409);
assert.equal((await members.POST(req({email:'not-an-email',confirm:true}))).status,400);
assert.equal((await members.POST(req({email:'unconfirmed@test.invalid'}))).status,400);
assert.equal((await members.POST(new Request('https://dtb.test/api/owner/members',{method:'POST',headers:{origin:'https://attacker.test'},body:JSON.stringify({email:'attacker@test.invalid',confirm:true})}))).status,403);
actor('g-added');globalThis.testCookie=await sec.issueOwnerSession('g-added',globalThis.testEnv.DTB_OWNER_CODE,globalThis.testEnv.DTB_OWNER_SESSION_SECRET);
assert.equal((await owner.getOwnerActor()).isOwner,true);
assert.equal((await members.POST(req({email:'next-owner@test.invalid',confirm:true}))).status,200);
assert.equal(await directory.isAuthorizedOwner(' Next-Owner@Test.Invalid '),true);
assert.equal(await directory.isAuthorizedOwner('unconfirmed@test.invalid'),false);
const all=await (await members.GET()).json();assert.equal(all.owners.length,7);
assert.equal(sql.prepare("SELECT created_by FROM owner_emails WHERE email='next-owner@test.invalid'").get().created_by,'g-added@test.invalid');
console.log('Passed: all three initial owners can add owners; added owners inherit permission; access is session-gated, case-normalized, duplicate-safe and audited.');
