import {sql} from './test-workspace.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const dir='.sites-runtime/tests';
for(const [file,out] of [['lib/owner-security.ts','security'],['lib/owner.ts','owner'],['app/api/documents/route.ts','documents'],['app/api/account/route.ts','account'],['app/api/owner/access/route.ts','access'],['app/api/owner/workspace/route.ts','owner-workspace']]){
 let src=readFileSync(file,'utf8')
 .replace("import {env} from 'cloudflare:workers';","const env=globalThis.testEnv;")
 .replace("import {cookies} from 'next/headers';","const cookies=async()=>({get:()=>({value:globalThis.testCookie||''})});")
 .replace("import {getChatGPTUser} from '../app/chatgpt-auth';","const getChatGPTUser=async()=>globalThis.testActor;")
 .replace(/import \{getActor\} from '[.\/]+lib\/owner';/g,"import {getActor} from './owner.mjs';")
 .replace(/import \{getActor,getOwnerActor\} from '[.\/]+lib\/owner';/g,"import {getActor,getOwnerActor} from './owner.mjs';")
 .replace(/import \{getOwnerActor\} from '[.\/]+lib\/owner';/g,"import {getOwnerActor} from './owner.mjs';")
 .replace(/import \{getDb\} from '[.\/]+db';/g,"const getDb=()=>globalThis.testDb;")
 .replace(/'[.\/]+db\/schema'/g,"'./schema.mjs'")
 .replace(/'[.\/]+lib\/validation'/g,"'./validation.mjs'")
 .replace("'./validation'","'./validation.mjs'")
 .replace(/'[.\/]+lib\/owner-security'/g,"'./security.mjs'")
 .replace("'./owner-security'","'./security.mjs'")
 .replace("'../../workspace/route'","'./workspace.mjs'");
 writeFileSync(`${dir}/${out}.mjs`,ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
const objects=new Map();globalThis.testEnv={DTB_OWNER_EMAIL:'g@test.invalid',BUCKET:{async put(k,v){objects.set(k,v)},async get(k){return objects.has(k)?{body:objects.get(k)}:null},async delete(k){objects.delete(k)}}};
const sec=await import('../.sites-runtime/tests/security.mjs'),owner=await import('../.sites-runtime/tests/owner.mjs'),docs=await import('../.sites-runtime/tests/documents.mjs'),account=await import('../.sites-runtime/tests/account.mjs'),access=await import('../.sites-runtime/tests/access.mjs'),workspace=await import('../.sites-runtime/tests/owner-workspace.mjs');
const actor=(id)=>globalThis.testActor={userId:id,email:id+'@test.invalid',fullName:id};
const req=(data,path='/api/account')=>new Request('https://dtb.test'+path,{method:'POST',headers:{origin:'https://dtb.test'},body:JSON.stringify(data)});
actor('g');assert.equal((await owner.getActor()).isOwner,false);assert.equal(await owner.getOwnerActor(),null);assert.equal((await access.POST(req({key:'test-private-path',code:'test-only-long-code'}))).status,404);assert.equal((await workspace.GET()).status,403);
Object.assign(globalThis.testEnv,{DTB_OWNER_PATH_KEY:'test-private-path',DTB_OWNER_CODE:'test-only-long-code'});
actor('a');assert.equal((await access.POST(req({key:'test-private-path',code:'test-only-long-code'}))).status,403);
actor('g');assert.equal((await access.POST(req({key:'wrong-path',code:'test-only-long-code'}))).status,403);
let res=await access.POST(req({key:'test-private-path',code:'test-only-long-code'}));assert.equal(res.status,200);const cookie=res.headers.get('set-cookie');assert.match(cookie,/HttpOnly; Secure; SameSite=Strict/);globalThis.testCookie=cookie.split(';')[0].split('=')[1];assert.equal((await owner.getOwnerActor()).isOwner,true);assert.equal((await owner.getActor()).isOwner,false);assert.equal((await workspace.GET()).status,200);
actor('a');assert.equal(await owner.getOwnerActor(),null);actor('g');globalThis.testCookie+='x';assert.equal(await owner.getOwnerActor(),null);globalThis.testCookie='';
for(let i=0;i<3;i++)await access.POST(req({key:'test-private-path',code:'wrong'}));assert.equal((await access.POST(req({key:'test-private-path',code:'test-only-long-code'}))).status,429);
const token=await sec.issueOwnerSession('g','test-private-path','test-only-long-code',1000);assert.equal(await sec.verifyOwnerSession(token,'g','test-private-path','test-only-long-code',1801001),false);assert.equal(await sec.verifyOwnerSession(token,'g','changed-private-path','test-only-long-code',1001),false);
actor('newtutor');const application={role:'tutor',name:'New Tutor',phone:'',city:'Delhi',locality:'Rohini',consent:true,qualifications:'BSc Mathematics',experience:2,subjects:['Mathematics'],levels:['High School'],availability:'Both',mode:'Either',rate:500,bio:'I explain concepts step by step and help students practice.'};
assert.equal((await account.POST(req(application))).status,400);
async function upload(kind,content,type){const f=new FormData();f.set('kind',kind);f.set('file',new File([content],'proof.pdf',{type}));return docs.POST(new Request('https://dtb.test/api/documents',{method:'POST',headers:{origin:'https://dtb.test'},body:f}));}
assert.equal((await upload('identity','<script>invalid</script>','application/pdf')).status,400);
assert.equal((await upload('identity','%PDF-1.7 test document','application/pdf')).status,200);assert.equal((await account.POST(req(application))).status,400);
assert.equal((await upload('qualification','%PDF-1.7 test document','application/pdf')).status,200);assert.equal((await account.POST(req(application))).status,200);
res=await docs.GET(new Request('https://dtb.test/api/documents?id=newtutor%3Aidentity'));assert.equal(res.status,200);assert.match(res.headers.get('content-disposition'),/attachment/);
actor('a');assert.equal((await docs.GET(new Request('https://dtb.test/api/documents?id=newtutor%3Aidentity'))).status,404);
actor('g');assert.equal((await docs.GET(new Request('https://dtb.test/api/documents?id=newtutor%3Aidentity'))).status,404);globalThis.testCookie=await sec.issueOwnerSession('g',globalThis.testEnv.DTB_OWNER_PATH_KEY,globalThis.testEnv.DTB_OWNER_CODE);assert.equal((await docs.GET(new Request('https://dtb.test/api/documents?id=newtutor%3Aidentity'))).status,200);
actor('newtutor');sql.prepare("UPDATE registrations SET status='Approved' WHERE id='newtutor:tutor'").run();assert.equal((await upload('qualification','%PDF-1.7 replacement','application/pdf')).status,200);assert.equal(sql.prepare("SELECT status FROM registrations WHERE id='newtutor:tutor'").get().status,'Pending review');assert.equal(objects.size,2);
console.log('Passed: mandatory tutor documents, file validation, private downloads, replacement review, owner gate disabled without secrets, identity + link + code, secure session, expiry/tampering and attempt limits.');
