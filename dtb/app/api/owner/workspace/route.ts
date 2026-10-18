import {getOwnerActor} from '../../../../lib/owner';
import {workspaceGET,workspacePOST} from '../../workspace/route';
export const dynamic='force-dynamic';
const denied=()=>Response.json({error:'Owner session required. Reopen your private link and enter the access code.'},{status:403,headers:{'Cache-Control':'no-store'}});
export async function GET(){const a=await getOwnerActor();return a?workspaceGET(a):denied()}
export async function POST(r:Request){const a=await getOwnerActor();return a?workspacePOST(r,a):denied()}
