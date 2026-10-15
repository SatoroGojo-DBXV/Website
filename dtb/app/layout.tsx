import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'DTB — Tutors who care. Learning that lasts.',description:'Diligent Tutors Bureau: personalised home and online tutoring. Explore subjects, register as a parent, student or tutor, and manage your learning journey.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
