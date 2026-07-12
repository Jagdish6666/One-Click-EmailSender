import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
    // publicRoutes are routes that don't require authentication
    publicRoutes: ["/", "/sign-in(.*)", "/sign-up(.*)"],
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/(api|trpc)(.*)"],
};
