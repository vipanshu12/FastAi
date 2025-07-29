import sql from "../configs/db.js"; // Ensure .js extension if using ES Modules
import { auth } from "../middlewares/auth.js";

// 1. Get creations by the current user
export const getUserCreation = async (req, res) => {
    try {
        const { userId } = req.auth();

        const creation = await sql`
            SELECT * FROM creations 
            WHERE user_id = ${userId} 
            ORDER BY created_at DESC
        `;

        res.json({ success: true, creations: creation });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 2. Get all published creations
export const getPublishedCreation = async (req, res) => {
    try {
        const creation = await sql`
            SELECT * FROM creations 
            WHERE publish = true 
            ORDER BY created_at DESC
        `;

        res.json({ success: true, creations: creation });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 3. Toggle like on a creation
export const toggleLikeCreation = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        const [creation] = await sql`SELECT * FROM creations WHERE id = ${id}`;

        if (!creation) {
            return res.json({ success: false, message: "Creation not found" });
        }

        const currentLikes = creation.likes || [];
        const userIdStr = userId.toString();
        let updatedLikes;
        let message;

        if (currentLikes.includes(userIdStr)) {
            updatedLikes = currentLikes.filter((u) => u !== userIdStr);
            message = "Creation unliked successfully";
        } else {
            updatedLikes = [...currentLikes, userIdStr];
            message = "Creation liked successfully";
        }

        // Convert to Postgres array literal format
        const formattedArray = `{${updatedLikes.join(',')}}`;

        await sql`
            UPDATE creations 
            SET likes = ${formattedArray}::text[] 
            WHERE id = ${id}
        `;

        res.json({ success: true, message });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
