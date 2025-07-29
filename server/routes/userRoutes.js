import express from 'express';
import { getPublishedCreation, getUserCreation, toggleLikeCreation } from '../controllers/userController.js';
import { auth } from '../middlewares/auth.js';

const userRouter = express.Router();


userRouter.get('/get-user-creations', getUserCreation);
userRouter.get('/get-published-creations', getPublishedCreation);
userRouter.post('/toggle-like-creation', toggleLikeCreation);

export default userRouter;