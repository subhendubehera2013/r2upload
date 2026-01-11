import express from "express";
import multer from "multer";
import {
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import r2 from "./r2.js";
import "dotenv/config";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.get("/", (req, res) => {
  res.json({ status: "Cloudflare R2 Node.js API running" });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: req.file.originalname,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    const uploadedFile = await r2.send(command);
    res.json({ message: "File uploaded successfully", uploadedFile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/files", async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET,
    });

    const data = await r2.send(command);
    res.json(data.Contents || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/download/:filename", async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: req.params.filename,
    });

    const data = await r2.send(command);
    data.Body.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
