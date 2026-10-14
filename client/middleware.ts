import { rewrite } from '@vercel/functions/middleware';

// Middleware Vercel : /api/* est réécrit vers l'API dont l'adresse vient de la variable
// API_URL du projet. Le navigateur ne connaît que le domaine du client, et l'adresse de
// l'API n'apparaît ni dans le bundle ni dans le dépôt.
export const config = { matcher: '/api/:path*' };

export default function middleware(request: Request): Response {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) return Response.json({ message: 'API_URL non définie' }, { status: 502 });

  const { pathname, search } = new URL(request.url);
  return rewrite(new URL(pathname.replace(/^\/api/, '') + search, apiUrl));
}
