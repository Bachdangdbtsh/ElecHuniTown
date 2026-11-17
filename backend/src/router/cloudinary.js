import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import express from 'express';
import multer from 'multer';

cloudinary.config({
  cloud_name: "dpslnfmfi",
  api_key:   "628535626585596",
  api_secret: "gHnILDpwxfLdtdjJpAPiX8AoqUc",
});

const storage = new CloudinaryStorage({
  cloudinary,          
  params: {
    folder: 'uploads',
    format: async (req, file) => 'webp',
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});
const upload = multer({ storage });
export default upload;