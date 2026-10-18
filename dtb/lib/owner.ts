import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {getChatGPTUser} from '../app/chatgpt-auth';
import {isAuthorizedOwner} from './owner-directory';
import {gateConfigured,verifyOwnerSession} from './owner-security';
export async function getActor(){const user=await getChatGPTUser();return user?{...user,isOwner:false}:null;}
export async function getOwnerActor(){const user=await getChatGPTUser();if(!user||!await isAuthorizedOwner(user.email)||!gateConfigured(env.DTB_OWNER_PATH_KEY,env.DTB_OWNER_CODE))return null;const token=(await cookies()).get('__Host-dtb-owner')?.value||'';if(!await verifyOwnerSession(token,user.userId,env.DTB_OWNER_PATH_KEY!,env.DTB_OWNER_CODE!))return null;return {...user,isOwner:true};}
