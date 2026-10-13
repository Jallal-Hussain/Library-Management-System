import ImageKit from "imagekit";
import "dotenv/config";

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || "dummy_public_key";
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "dummy_private_key";
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/dummy";

const imagekit = new ImageKit({
  publicKey,
  privateKey,
  urlEndpoint,
});

export const isImageKitConfigured = () => {
  return (
    Boolean(process.env.IMAGEKIT_PUBLIC_KEY) &&
    process.env.IMAGEKIT_PUBLIC_KEY !== "your_imagekit_public_key" &&
    Boolean(process.env.IMAGEKIT_PRIVATE_KEY) &&
    process.env.IMAGEKIT_PRIVATE_KEY !== "your_imagekit_private_key"
  );
};

export default imagekit;
