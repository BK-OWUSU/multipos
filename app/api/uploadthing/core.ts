import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import {  getSession } from "@/lib/auths-functions";
import { NextRequest } from "next/server";
import { JwtPayload } from "@/types/auth/auth";

const auth = async (request: NextRequest ) => {
    //Get Current user session
    const session = await getSession();
    if (!session || typeof session === "string") return null;
    console.log("Session for UPT: ", session)
    
    return {
        userId: session.userId,
        businessId: session.businessId,
        businessSlug: session.businessSlug,
        email: session.email
    } as JwtPayload
}

const f = createUploadthing();




// FileRouter for my app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await auth(req);
      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId, uploadType: "product" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.ufsUrl);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, uploadType: metadata.uploadType };
    }),

  userImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await auth(req);

      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");
      console.log("====User UploadThing===: ", user)

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId, type: "User" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.ufsUrl);

      return { uploadedBy: metadata.userId, type: metadata.type };
    }),

    businessImageUploader: f({image:{maxFileSize: "2MB", maxFileCount: 1}})
    .middleware(async({req})=> {
        const user = await auth(req)

        if (!user) throw new UploadThingError("Unauthorized");
        return {userId: user.userId, type: "user"}
    }).onUploadComplete(({metadata, file})=> {
        console.log( metadata.userId)
        console.log( file.ufsUrl)
    })

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;