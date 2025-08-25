import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/chat(.*)'])
const isPublicRoute = createRouteMatcher(['/'])

export default clerkMiddleware(async (auth, req) => {
  // Protect chat routes
  if (isProtectedRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      // Redirect to sign-in if not authenticated
      return Response.redirect(new URL('/sign-in', req.url))
    }
  }
  
  // Redirect authenticated users away from landing page
  if (isPublicRoute(req)) {
    const { userId } = await auth()
    if (userId) {
      return Response.redirect(new URL('/chat', req.url))
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}