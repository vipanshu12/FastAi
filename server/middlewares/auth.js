// Middleware to check userId and premium plan

import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
    try {
        const { userId, has } = await req.auth();
        const hasPremium = await has({ plan: 'premium' });

        const user = await clerkClient.users.getUser(userId);

        // Always set free_usage from user metadata (default to 0 if not set)
        req.free_usage = user.privateMetadata?.free_usage || 0;

        // If user is premium, reset free_usage to 0 if needed
        if (!hasPremium && user,privateMetadata.free_usage) {
            req.free_usage = user.privateMetadata.free_usage;
        }else{
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    ...user.privateMetadata,
                    free_usage: 0
                }
            });
            req.free_usage = 0;
        }

        req.plan = hasPremiumPlan ? 'premium' : 'free';

        next();

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};