import DTB from './site';
import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <DTB signedIn={!!user} email={user?.email||''} signIn={chatGPTSignInPath('/?view=portal')} signOut={chatGPTSignOutPath('/')} />}
