import { redirect } from 'next/navigation';

// proxy.ts already redirects '/' to '/dashboard' or '/login' based on auth
// state. This route itself is unreachable in normal operation — this is a
// defence-in-depth backstop should the proxy matcher ever change.
// TODO: remove once a real landing page exists
export default function Home() {
  redirect('/login');
}
