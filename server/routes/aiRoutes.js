import express from 'express';
import { generateArticle, generateBlogTitles, generateImage, removeImageBackground, removeImageObject, resumeReview } from '../controllers/aiController.js';
import { auth } from '../middlewares/auth.js';
import { upload } from '../configs/multer.js';

const aiRouter = express.Router();

aiRouter.post('/generate-article',generateArticle);

aiRouter.post('/generate-blog-title',generateBlogTitles);


aiRouter.post('/generate-images',generateImage);


aiRouter.post('/remove-image-background' ,upload.single('image'), removeImageBackground);



aiRouter.post('/remove-image-object' , upload.single('image'), removeImageObject);


aiRouter.post('/resume-review', upload.single('resume'), resumeReview);

// aiRouter.post('/generate-images' ,generateImage);


export default aiRouter; 