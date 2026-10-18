import {env} from 'cloudflare:workers';
import {notFound} from 'next/navigation';
import {getOwnerActor} from '../../../lib/owner';
import {gateConfigured,safeEqual} from '../../../lib/owner-security';
import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from '../../chatgpt-auth';
import {isOwnerIdentity} from '../../../lib/validation';
import OwnerUnlock from './unlock';
import DTB from '../../site';
export const dynamic='force-dynamic';
export const metadata={title:'Private workspace · DTB',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function OwnerPage({params}:{params:Promise<{key:string}>}){const {key}=await params;if(!gateConfigured(env.DTB_OWNER_PATH_KEY,env.DTB_OWNER_CODE)||!await safeEqual(key,env.DTB_OWNER_PATH_KEY!))notFound();const user=await getChatGPTUser();if(!user)return <main className="registration-welcome"><h1>Private workspace</h1><p>Sign in with the owner account to continue.</p><a className="btn" href={chatGPTSignInPath('/owner/'+key)} target="_top">Owner sign-in</a></main>;if(!isOwnerIdentity(user.email,env.DTB_OWNER_EMAIL))notFound();const owner=await getOwnerActor();if(!owner)return <OwnerUnlock pathKey={key}/>;return <DTB signedIn email={owner.email} owner signIn={chatGPTSignInPath('/owner/'+key)} signOut={chatGPTSignOutPath('/')}/>;}
