import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../app/chatgpt-auth';
import {isOwnerIdentity} from './validation';
export async function getActor(){const user=await getChatGPTUser();return user?{...user,isOwner:isOwnerIdentity(user.email,env.DTB_OWNER_EMAIL)}:null;}
