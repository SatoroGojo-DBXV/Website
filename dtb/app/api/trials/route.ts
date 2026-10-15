// Legacy endpoint: keep all requests subject to the new managed-workspace rules.
import {POST as workspacePost} from '../workspace/route';
export {GET} from '../workspace/route';
export async function POST(request:Request){let body;try{body=await request.json()}catch{return Response.json({error:'Invalid request.'},{status:400})}const headers=new Headers(request.headers);headers.delete('content-length');return workspacePost(new Request(request.url,{method:'POST',headers,body:JSON.stringify({...body as object,action:'request'})}));}
