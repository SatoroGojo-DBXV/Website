import {env} from 'cloudflare:workers';
import {notFound} from 'next/navigation';
import {getOwnerActor} from '../../lib/owner';
import {gateConfigured} from '../../lib/owner-security';
import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from '../chatgpt-auth';
import {isAuthorizedOwner} from '../../lib/owner-directory';
import OwnerUnlock from './unlock';
import DTB from '../site';
export const dynamic='force-dynamic';
export const metadata={title:'Private workspace · DTB',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function OwnerPage(){if(!gateConfigured(env.DTB_OWNER_CODE,env.DTB_OWNER_SESSION_SECRET))notFound();const user=await getChatGPTUser();if(!user)return <main className="registration-welcome"><h1>Private workspace</h1><p>Sign in with the owner account to continue.</p><a className="btn" href={chatGPTSignInPath('/owner')} target="_top">Owner sign-in</a></main>;if(!await isAuthorizedOwner(user.email))notFound();const owner=await getOwnerActor();if(!owner)return <OwnerUnlock/>;return <DTB signedIn email={owner.email} owner signIn={chatGPTSignInPath('/owner')} signOut={chatGPTSignOutPath('/')}/>;}
