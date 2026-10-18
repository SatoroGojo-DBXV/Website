import DTB from './site';
import {getActor} from '../lib/owner';
import {chatGPTSignInPath,chatGPTSignOutPath} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getActor();return <DTB signedIn={!!user} email={user?.email||''} owner={false} signIn={chatGPTSignInPath('/?view=portal')} signOut={chatGPTSignOutPath('/')} />}
