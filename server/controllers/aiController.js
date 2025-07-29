import fetch from "node-fetch";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import { response } from "express";
import fs from "fs";
// import { v2 as cloudinary } from "cloudinary";

import pdf from "pdf-parse/lib/pdf-parse.js";

import axios from "axios";
import FormData from "form-data";
import {v2 as cloudinary} from 'cloudinary';
export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt} = req.body;

    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 50) {
      return res.json({
        success: false,
        message: "You have reached your free usage limit. Please upgrade to premium plan.",
      });
    }

    // Call Gemini
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Store in database
    await sql`INSERT INTO creations(user_id, prompt, content, type)
            VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    // Update free_usage in Clerk metadata
    if (plan !== "premium") {
      const user = await clerkClient.users.getUser(userId);
      const existingMetadata = user.privateMetadata || {};

      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          ...existingMetadata,
          free_usage: (existingMetadata.free_usage || 0) + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("Error:", error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};


export const generateBlogTitles = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;

    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 50) {
      return res.json({
        success: false,
        message: "You have reached your free usage limit. Please upgrade to premium plan.",
      });
    }

    // Call Gemini
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
          },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Store in database
    await sql`INSERT INTO creations(user_id, prompt, content, type)
            VALUES (${userId}, ${prompt}, ${content}, 'blog-titles')`;

    // Update free_usage in Clerk metadata
    if (plan !== "premium") {
      const user = await clerkClient.users.getUser(userId);
      const existingMetadata = user.privateMetadata || {};

      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          ...existingMetadata,
          free_usage: (existingMetadata.free_usage || 0) + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("Error:", error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;

    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 50) {
      return res.json({
        success: false,
        message: "You have reached your free usage limit. Please upgrade to premium plan.",
      });
    }

    // Call CLIPDROP (use the correct endpoint)
    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API_KEY,
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer",
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(data, "binary").toString("base64")}`;

    // Upload to Cloudinary
    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    // Store in database
    await sql`INSERT INTO creations(user_id, prompt, content, type, publish)
            VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;

    // Update free_usage in Clerk metadata for free users

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error("Error:", error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};


export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;

    const plan = req.plan;
    const free_usage = req.free_usage;

      if (plan !== "premium" && free_usage >= 50) {
      return res.json({
        success: false,
        message: "You have reached your free usage limit. Please upgrade to premium plan.",
      });
    }

    // Upload to Cloudinary
    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation:[{
        effect: "background_removal",
        background_removal:'remove_the_background'
      }]
    });

    // Store in database
    await sql`INSERT INTO creations(user_id, prompt, content, type)
            VALUES (${userId}, 'Remove background from image' , ${secure_url}, 'image')`;

    // Update free_usage in Clerk metadata for free users

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error("Error:", error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};



export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object  } = req.body;
    const image = req.file;

    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 50) {
      return res.json({
        success: false,
        message: "You have reached your free usage limit. Please upgrade to premium plan.",
      });
    }

    // Upload to Cloudinary
    const { public_id } = await cloudinary.uploader.upload(image.path)

    const imageUrl = cloudinary.url(public_id, {
      transformation:[{effect : `gen_remove:${object}`}],
      resource_type: 'image',
    })

    // Store in database
    await sql`INSERT INTO creations(user_id, prompt, content, type)
            VALUES (${userId}, ${`Removed ${object} from image`} , ${imageUrl}, 'image')`;

    // Update free_usage in Clerk metadata for free users

    res.json({ success: true, content: imageUrl});
  } catch (error) {
    console.error("Error:", error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};



export const resumeReview    = async (req, res) => {
  try {
    const { userId } = req.auth();
    // const { object  } = req.body;
    const resume = req.file;

    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 50) {
      return res.json({
        success: false,
        message: "You have reached your free usage limit. Please upgrade to premium plan.",
      });
    }


    if(resume.size>5*1024*1024){
      return res.json({
        success: false,
        message: "File size exceeds 5MB limit.Allow only smaller files (5mb). ",
      });
    }

    const dataBuffer=fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);

    const prompt = `Review the  following resume and provide constructive  feedback on its
     strength, weakness, and areas for improvements. Resume content:/n/n ${pdfData.text}`;
    // Store in database


    // Call Gemini
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    await sql`INSERT INTO creations(user_id, prompt, content, type)
            VALUES (${userId}, 'Review the uploaded resume' , ${content}, 'resume-review')`;


            
    // Update free_usage in Clerk metadata for free users

    res.json({ success: true, content});
  } catch (error) {
    console.error("Error:", error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};