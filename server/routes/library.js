import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import rateLimit from "express-rate-limit";
import { handleUpload } from "@vercel/blob/client";
import fs from "node:fs";
import path from "node:path";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { books,categories,contributions,downloads,ledger,reading,likes,readingLists,users,auditLogs,reports,settings,notifications,ratings,readerBookmarks } from "../db/schema.js";
import { requireAuth,requireRole } from "../middleware/auth.js";
import { calculateAllowance } from "../services/credit-policy.js";
import { recommendBooks } from "../services/recommendations.js";
import { deleteDriveBook, getDriveStorageStatus, isDriveFileKey, isDriveStorageConnected, streamDriveBook, uploadDriveBook } from "../services/google-drive-storage.js";
import { deletePrivatePdf, hasBlobStorage, readPrivatePdf, streamPrivatePdf, uploadPrivatePdf } from "../services/blob-storage.js";
import { askBooks, refreshIndexingStatuses, startBookIndexing } from "../services/geminiStore.js";
const storageDir=path.resolve(process.env.STORAGE_DIR||"./storage");
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:Number(process.env.MAX_UPLOAD_MB||50)*1024*1024,files:1},fileFilter:(_r,f,cb)=>cb(f.mimetype==="application/pdf"&&path.extname(f.originalname).toLowerCase()===".pdf"?null:Object.assign(new Error("Upload must be a PDF file"),{status:400}),f.mimetype==="application/pdf"&&path.extname(f.originalname).toLowerCase()===".pdf")});
const hasBookFile = book => Boolean(book?.blobPathname || book?.fileKey);
const publicBook = book => { const { fileKey, blobPathname, geminiDocumentName, geminiOperationName, indexingError, ...safe } = book; return { ...safe, hasFile: Boolean(blobPathname || fileKey) }; };
const streamBook = async (db, book, res, disposition) => {
 if (book.blobPathname) return await streamPrivatePdf(book.blobPathname,res,{fileName:book.fileName||`${book.title||"book"}.pdf`,disposition});
 if (isDriveFileKey(book.fileKey)) return await streamDriveBook(db,book.fileKey,res,{fileName:book.fileName,disposition});
 if (book.fileKey && fs.existsSync(book.fileKey)) { if(disposition==="attachment")res.download(book.fileKey,book.fileName||"book.pdf");else res.type("application/pdf").set("Content-Disposition",`inline; filename="${path.basename(book.fileName||"book.pdf")}"`).sendFile(path.resolve(book.fileKey)); return true; }
 return false;
};
const loadIndexBuffer = async book => book.blobPathname ? readPrivatePdf(book.blobPathname) : book.fileKey && !isDriveFileKey(book.fileKey) && fs.existsSync(book.fileKey) ? fs.readFileSync(book.fileKey) : null;
const beginBookIndexing = async (db, bookId) => { const [book]=await db.select().from(books).where(eq(books.id,bookId)); if(!book||!new Set(["pending","failed"]).has(book.indexingStatus))return;const buffer=await loadIndexBuffer(book);if(!buffer)throw new Error("The original PDF is unavailable for Gemini indexing");return startBookIndexing(db,bookId,buffer,book.fileName); };
const aiLimiter = rateLimit({ windowMs: 60_000, limit: 12, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Too many AI requests. Please wait a minute and try again." } });
const contributionLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false, skip: req => req.body?.type === "blob.upload-completed", message: { error: "Too many upload requests. Please wait before trying again." } });

const optionalNumber = schema => z.preprocess(value => value === "" || value == null ? undefined : value, schema.optional());
const bookInput=z.object({title:z.string().trim().min(1).max(250),author:z.string().trim().min(1).max(250),description:z.string().max(10000).optional(),categoryId:z.coerce.number().int().positive(),subjects:z.string().optional(),language:z.string().max(60).optional(),isbn:z.string().max(20).optional(),publisher:z.string().max(200).optional(),publicationYear:optionalNumber(z.coerce.number().int().min(1000).max(2100)),license:z.string().max(2000).optional(),coverUrl:z.string().url().optional().or(z.literal(""))});
const notifyContributionReview=async(tx,userId,bookId,status)=>{const [u]=await tx.select({enabled:users.notifyContributionReviews}).from(users).where(eq(users.id,userId));if(u?.enabled)await tx.insert(notifications).values({userId,kind:"contribution_review",title:"Your book submission was reviewed",message:`Submission status: ${status}`,bookId});};
const getAllowance=async(tx,userId)=>{const [d]=await tx.select({n:sql`count(*)::int`}).from(downloads).where(eq(downloads.userId,userId));const [c]=await tx.select({n:sql`count(*)::int`}).from(contributions).where(and(eq(contributions.userId,userId),eq(contributions.status,"approved")));const [saved]=await tx.select({value:settings.value}).from(settings).where(eq(settings.key,"download_policy"));const policy=saved?.value||{};return calculateAllowance({used:d.n,approvedContributions:c.n,freeAllowance:policy.freeDownloads??process.env.FREE_DOWNLOADS??3,contributionsPerUnlock:policy.contributionsPerUnlock??process.env.CONTRIBUTIONS_PER_UNLOCK??3,downloadsPerUnlock:policy.downloadsPerUnlock??process.env.DOWNLOADS_PER_UNLOCK??10});};
export function libraryRoutes(db){const r=Router();
 r.get("/categories",async(_q,res)=>res.json({categories:await db.select().from(categories).where(eq(categories.active,true)).orderBy(asc(categories.sortOrder),asc(categories.name))}));
 r.get("/books/:id/ratings",async(req,res)=>{const id=Number(req.params.id),rows=await db.select({rating:ratings.rating,review:ratings.review,createdAt:ratings.createdAt,name:users.name}).from(ratings).innerJoin(users,eq(users.id,ratings.userId)).where(and(eq(ratings.bookId,id),eq(ratings.status,"approved"))).orderBy(desc(ratings.createdAt));res.json({ratings:rows,average:rows.length?Math.round(rows.reduce((sum,row)=>sum+row.rating,0)/rows.length*10)/10:0,count:rows.length});});
 r.post("/books/:id/ratings",requireAuth,async(req,res)=>{const id=Number(req.params.id),[available]=await db.select({id:books.id}).from(books).where(and(eq(books.id,id),eq(books.status,"approved")));if(!available)return res.status(404).json({error:"Book not found"});const p=z.object({rating:z.number().int().min(1).max(5),review:z.string().trim().max(2000).optional()}).safeParse(req.body);if(!p.success)return res.status(400).json({error:"Rating must be from 1 to 5; review must be at most 2000 characters"});const values={rating:p.data.rating,review:p.data.review||"",status:"pending",updatedAt:new Date()};const [saved]=await db.insert(ratings).values({userId:req.user.id,bookId:id,...values}).onConflictDoUpdate({target:[ratings.userId,ratings.bookId],set:values}).returning();res.status(201).json({rating:saved});});
 r.get("/books",async(req,res)=>{const page=Math.max(1,Number(req.query.page)||1),limit=Math.min(48,Math.max(1,Number(req.query.limit)||12)),q=String(req.query.q||"").trim(),category=Number(req.query.category)||0,sort=String(req.query.sort||"newest");const filters=[eq(books.status,"approved")];if(q)filters.push(or(ilike(books.title,`%${q}%`),ilike(books.author,`%${q}%`),ilike(books.description,`%${q}%`),ilike(books.isbn,`%${q}%`),sql`${books.subjects}::text ilike ${`%${q}%`}`));if(category)filters.push(eq(books.categoryId,category));if(req.query.language)filters.push(eq(books.language,String(req.query.language)));const order={popular:desc(books.downloadCount),read:desc(books.readCount),oldest:asc(books.createdAt),alpha:asc(books.title)}[sort]||desc(books.createdAt);const rows=await db.select({book:books,category:categories.name}).from(books).leftJoin(categories,eq(books.categoryId,categories.id)).where(and(...filters)).orderBy(order,asc(books.title)).limit(limit).offset((page-1)*limit);const [{n:total}]=await db.select({n:sql`count(*)::int`}).from(books).where(and(...filters));res.json({books:rows.map(x=>publicBook({...x.book,category:x.category})),page,limit,total});});
 r.get("/books/:id",async(req,res)=>{const [row]=await db.select({book:books,category:categories.name}).from(books).leftJoin(categories,eq(books.categoryId,categories.id)).where(and(eq(books.id,Number(req.params.id)),eq(books.status,"approved")));if(!row)return res.status(404).json({error:"Book not found"});res.json({book:publicBook({...row.book,category:row.category})});});
 r.post("/ai/ask",requireAuth,aiLimiter,async(req,res,next)=>{const parsed=z.object({question:z.string().trim().min(3).max(2000)}).safeParse(req.body);if(!parsed.success)return res.status(400).json({error:"Enter a question between 3 and 2000 characters"});try{const result=await askBooks(db,`Answer the user's question using relevant OpenShelf book passages. If the indexed books do not contain enough evidence, say so. Provide a concise answer and include relevant book titles or source details when available.\n\nUser request: ${parsed.data.question}`);res.json(result);}catch(error){next(error);}});
 r.get("/ai/indexing-status/:bookId",requireAuth,async(req,res)=>{const id=Number(req.params.bookId),[book]=await db.select({id:books.id,uploadedBy:books.uploadedBy,indexingStatus:books.indexingStatus,indexedAt:books.indexedAt}).from(books).where(eq(books.id,id));if(!book||req.user.role!=="admin"&&book.uploadedBy!==req.user.id)return res.status(404).json({error:"Book not found"});await refreshIndexingStatuses(db,[id]);const [fresh]=await db.select({indexingStatus:books.indexingStatus,indexedAt:books.indexedAt,indexingError:books.indexingError}).from(books).where(eq(books.id,id));res.json({status:fresh.indexingStatus,indexedAt:fresh.indexedAt,error:req.user.role==="admin"?fresh.indexingError:fresh.indexingError?"Indexing failed. Library staff can retry.":null});});
 r.get("/internal/indexing/poll",async(req,res,next)=>{const secret=process.env.CRON_SECRET;if(!secret||req.get("Authorization")!==`Bearer ${secret}`)return res.status(401).json({error:"Unauthorized"});try{await refreshIndexingStatuses(db);res.json({ok:true});}catch(error){next(error);}});
 r.get("/books/:id/read",requireAuth,async(req,res,next)=>{try{const [b]=await db.select().from(books).where(and(eq(books.id,Number(req.params.id)),eq(books.status,"approved")));if(!hasBookFile(b))return res.status(404).json({error:"Reading file is unavailable"});await db.update(books).set({readCount:sql`${books.readCount} + 1`}).where(eq(books.id,b.id));if(!await streamBook(db,b,res,"inline"))return res.status(404).json({error:"Reading file is unavailable"});}catch(error){if(error.status)return res.status(error.status).json({error:error.message});next(error);}});
 r.get("/books/:id/recommendations", async (req, res) => {
  const id = Number(req.params.id);
  const [target] = await db.select().from(books).where(and(eq(books.id, id), eq(books.status, "approved")));
  if (!target) return res.json({ books: [] });
  const rows = await db.select({ book: books, category: categories.name }).from(books).leftJoin(categories, eq(books.categoryId, categories.id)).where(and(eq(books.status, "approved"), sql`${books.id} <> ${target.id}`)).orderBy(desc(books.downloadCount), desc(books.createdAt)).limit(250);
  let userInterests = [], similarUserBooks = [], excludeIds = [];
  if (req.user) {
   const [liked, downloaded, read] = await Promise.all([
    db.select({ book: books }).from(likes).innerJoin(books, eq(books.id, likes.bookId)).where(eq(likes.userId, req.user.id)),
    db.select({ book: books }).from(downloads).innerJoin(books, eq(books.id, downloads.bookId)).where(eq(downloads.userId, req.user.id)),
    db.select({ book: books }).from(reading).innerJoin(books, eq(books.id, reading.bookId)).where(eq(reading.userId, req.user.id)),
   ]);
   userInterests = [...liked, ...downloaded, ...read].map(row => row.book);
   excludeIds = [...new Set(userInterests.map(book => book.id))];
   if (excludeIds.length) {
    const neighbors = await Promise.all([
     db.select({ userId: likes.userId, book: books }).from(likes).innerJoin(books, eq(books.id, likes.bookId)).where(and(inArray(likes.bookId, excludeIds), sql`${likes.userId} <> ${req.user.id}`)),
     db.select({ userId: downloads.userId, book: books }).from(downloads).innerJoin(books, eq(books.id, downloads.bookId)).where(and(inArray(downloads.bookId, excludeIds), sql`${downloads.userId} <> ${req.user.id}`)),
     db.select({ userId: reading.userId, book: books }).from(reading).innerJoin(books, eq(books.id, reading.bookId)).where(and(inArray(reading.bookId, excludeIds), sql`${reading.userId} <> ${req.user.id}`)),
    ]);
    const overlap = new Map();
    for (const row of neighbors.flat()) overlap.set(row.userId, (overlap.get(row.userId) || 0) + 1);
    const similarUsers = [...overlap].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([userId]) => userId);
    if (similarUsers.length) {
     const social = await Promise.all([
      db.select({ book: books }).from(likes).innerJoin(books, eq(books.id, likes.bookId)).where(inArray(likes.userId, similarUsers)),
      db.select({ book: books }).from(downloads).innerJoin(books, eq(books.id, downloads.bookId)).where(inArray(downloads.userId, similarUsers)),
      db.select({ book: books }).from(reading).innerJoin(books, eq(books.id, reading.bookId)).where(inArray(reading.userId, similarUsers)),
     ]);
     similarUserBooks = social.flat().map(row => row.book);
    }
   }
  }
  const recommendations = recommendBooks({ target, candidates: rows.map(row => ({ ...row.book, category: row.category })), userInterests, similarUserBooks, excludeIds, limit: 6 });
  res.json({ books: recommendations.map(publicBook) });
 });
 r.patch("/me/profile",requireAuth,async(req,res)=>{const p=z.object({name:z.string().trim().min(1).max(100),preferredLanguage:z.enum(["English","Dari (Persian)","Pashto"]),theme:z.enum(["light","dark"]),notifyContributionReviews:z.boolean().optional()}).safeParse(req.body);if(!p.success)return res.status(400).json({error:"Enter a name and choose a supported language and theme."});await db.update(users).set(p.data).where(eq(users.id,req.user.id));const [u]=await db.select({id:users.id,email:users.email,name:users.name,role:users.role,preferredLanguage:users.preferredLanguage,theme:users.theme,notifyContributionReviews:users.notifyContributionReviews}).from(users).where(eq(users.id,req.user.id));res.json({user:u});});

 r.get("/me/credits",requireAuth,async(req,res)=>res.json({credits:await getAllowance(db,req.user.id)}));
 r.get("/me/notifications",requireAuth,async(req,res)=>{const rows=await db.select().from(notifications).where(eq(notifications.userId,req.user.id)).orderBy(desc(notifications.createdAt)).limit(100);res.json({notifications:rows,unread:rows.filter(row=>!row.readAt).length});});
 r.patch("/me/notifications/:id/read",requireAuth,async(req,res)=>{const id=Number(req.params.id),[row]=await db.update(notifications).set({readAt:new Date()}).where(and(eq(notifications.id,id),eq(notifications.userId,req.user.id))).returning();if(!row)return res.status(404).json({error:"Notification not found"});res.json({notification:row});});
 r.post("/me/notifications/read-all",requireAuth,async(req,res)=>{await db.update(notifications).set({readAt:new Date()}).where(and(eq(notifications.userId,req.user.id),sql`${notifications.readAt} is null`));res.json({ok:true});});
 r.get("/me/books",requireAuth,async(req,res)=>{const rows=await db.select({book:books,contribution:contributions}).from(contributions).innerJoin(books,eq(books.id,contributions.bookId)).where(eq(contributions.userId,req.user.id)).orderBy(desc(books.createdAt));res.json({books:rows.map(row=>({...row,book:publicBook(row.book)}))});});
 r.get("/me/downloads",requireAuth,async(req,res)=>{const rows=await db.select({book:books,download:downloads}).from(downloads).innerJoin(books,eq(books.id,downloads.bookId)).where(eq(downloads.userId,req.user.id)).orderBy(desc(downloads.lastDownloadedAt));res.json({downloads:rows.map(row=>({...row,book:publicBook(row.book)}))});});
 r.get("/me/reading",requireAuth,async(req,res)=>{const rows=await db.select({book:books,progress:reading}).from(reading).innerJoin(books,eq(books.id,reading.bookId)).where(eq(reading.userId,req.user.id)).orderBy(desc(reading.updatedAt));res.json({reading:rows.map(row=>({...row,book:publicBook(row.book)}))});});
 r.get("/books/:id/user-state",requireAuth,async(req,res)=>{const id=Number(req.params.id);const [liked]=await db.select().from(likes).where(and(eq(likes.userId,req.user.id),eq(likes.bookId,id)));const [saved]=await db.select().from(readingLists).where(and(eq(readingLists.userId,req.user.id),eq(readingLists.bookId,id)));const [download]=await db.select({downloadCount:downloads.downloadCount}).from(downloads).where(and(eq(downloads.userId,req.user.id),eq(downloads.bookId,id)));res.json({liked:!!liked,saved:!!saved,downloadCount:download?.downloadCount||0});});
 r.post("/books/:id/like",requireAuth,async(req,res)=>{const id=Number(req.params.id);const [b]=await db.select().from(books).where(and(eq(books.id,id),eq(books.status,"approved")));if(!b)return res.status(404).json({error:"Book not found"});const [old]=await db.select().from(likes).where(and(eq(likes.userId,req.user.id),eq(likes.bookId,id)));if(old){await db.delete(likes).where(and(eq(likes.userId,req.user.id),eq(likes.bookId,id)));return res.json({liked:false});}await db.insert(likes).values({userId:req.user.id,bookId:id});res.json({liked:true});});
 r.post("/books/:id/list",requireAuth,async(req,res)=>{const id=Number(req.params.id);const [available]=await db.select({id:books.id}).from(books).where(and(eq(books.id,id),eq(books.status,"approved")));if(!available)return res.status(404).json({error:"Book not found"});const [old]=await db.select().from(readingLists).where(and(eq(readingLists.userId,req.user.id),eq(readingLists.bookId,id)));if(old)await db.delete(readingLists).where(and(eq(readingLists.userId,req.user.id),eq(readingLists.bookId,id)));else await db.insert(readingLists).values({userId:req.user.id,bookId:id}).onConflictDoNothing();res.json({saved:!old});});
 r.get("/me/likes",requireAuth,async(req,res)=>res.json({books:(await db.select({book:books,liked:likes.createdAt}).from(likes).innerJoin(books,eq(books.id,likes.bookId)).where(and(eq(likes.userId,req.user.id),eq(books.status,"approved"))).orderBy(desc(likes.createdAt))).map(row=>({...row,book:publicBook(row.book)}))}));
 r.get("/me/list",requireAuth,async(req,res)=>res.json({books:(await db.select({book:books,saved:readingLists.createdAt}).from(readingLists).innerJoin(books,eq(books.id,readingLists.bookId)).where(eq(readingLists.userId,req.user.id))).map(row=>({...row,book:publicBook(row.book)}))}));
 r.get("/books/:id/progress",requireAuth,async(req,res)=>{const [row]=await db.select().from(reading).where(and(eq(reading.userId,req.user.id),eq(reading.bookId,Number(req.params.id))));res.json({progress:row||null});});
 r.get("/books/:id/bookmarks",requireAuth,async(req,res)=>res.json({bookmarks:await db.select().from(readerBookmarks).where(and(eq(readerBookmarks.userId,req.user.id),eq(readerBookmarks.bookId,Number(req.params.id)))).orderBy(asc(readerBookmarks.page))}));
 r.post("/books/:id/bookmarks",requireAuth,async(req,res)=>{const id=Number(req.params.id),[available]=await db.select({id:books.id}).from(books).where(and(eq(books.id,id),eq(books.status,"approved")));if(!available)return res.status(404).json({error:"Book not found"});const p=z.object({page:z.number().int().min(1),label:z.string().trim().max(120).optional()}).safeParse(req.body);if(!p.success)return res.status(400).json({error:"Invalid page bookmark"});const [bookmark]=await db.insert(readerBookmarks).values({userId:req.user.id,bookId:id,page:p.data.page,label:p.data.label||""}).onConflictDoUpdate({target:[readerBookmarks.userId,readerBookmarks.bookId,readerBookmarks.page],set:{label:p.data.label||""}}).returning();res.status(201).json({bookmark});});
 r.delete("/books/:id/bookmarks/:bookmarkId",requireAuth,async(req,res)=>{const [bookmark]=await db.delete(readerBookmarks).where(and(eq(readerBookmarks.id,Number(req.params.bookmarkId)),eq(readerBookmarks.bookId,Number(req.params.id)),eq(readerBookmarks.userId,req.user.id))).returning();if(!bookmark)return res.status(404).json({error:"Bookmark not found"});res.json({ok:true});});
 r.put("/books/:id/progress",requireAuth,async(req,res)=>{const [available]=await db.select({id:books.id}).from(books).where(and(eq(books.id,Number(req.params.id)),eq(books.status,"approved")));if(!available)return res.status(404).json({error:"Book not found"});const p=z.object({page:z.number().int().min(1),totalPages:z.number().int().positive().optional(),finished:z.boolean().optional()}).safeParse(req.body);if(!p.success)return res.status(400).json({error:"Invalid reading progress"});if(p.data.totalPages!==undefined&&p.data.page>p.data.totalPages)return res.status(400).json({error:"Current page cannot exceed the total page count"});const value={userId:req.user.id,bookId:Number(req.params.id),page:p.data.page,totalPages:p.data.totalPages,progress:p.data.totalPages?Math.round(p.data.page/p.data.totalPages*100):0,finished:!!p.data.finished,updatedAt:new Date()};await db.insert(reading).values(value).onConflictDoUpdate({target:[reading.userId,reading.bookId],set:value});res.json({progress:value});});
 r.post("/books/:id/download",requireAuth,async(req,res,next)=>{
  try{
   const id=Number(req.params.id),parsed=z.object({formatIndex:z.number().int().min(0).optional()}).safeParse(req.body||{});
   if(!parsed.success)return res.status(400).json({error:"Invalid download format"});
   const result=await db.transaction(async tx=>{
    await tx.execute(sql`select id from users where id = ${req.user.id} for update`);
    const [account]=await tx.select({dailyDownloadCount:users.dailyDownloadCount,dailyDownloadDate:users.dailyDownloadDate}).from(users).where(eq(users.id,req.user.id));
    const today=new Date().toISOString().slice(0,10);
    const downloadsToday=account?.dailyDownloadDate===today?account.dailyDownloadCount:0;
    if(downloadsToday>=10)throw Object.assign(new Error("You have reached today's limit of 10 downloads. Try again tomorrow."),{status:429});
    const [b]=await tx.select().from(books).where(and(eq(books.id,id),eq(books.status,"approved")));
    if(!b)throw Object.assign(new Error("Book not found"),{status:404});
    let externalUrl=null;
    if(parsed.data.formatIndex!==undefined){
     const file=Array.isArray(b.externalFormats)?b.externalFormats[parsed.data.formatIndex]:null;
     if(!file?.url)throw Object.assign(new Error("Download format not found"),{status:404});
     let target;try{target=new URL(file.url);}catch{throw Object.assign(new Error("Download link is invalid"),{status:400});}
     if(target.protocol!=="https:")throw Object.assign(new Error("Only secure download links are allowed"),{status:400});
     externalUrl=target.toString();
    }else if(!hasBookFile(b)||(!b.blobPathname&&!isDriveFileKey(b.fileKey)&&!fs.existsSync(b.fileKey))){
     throw Object.assign(new Error("Book file is unavailable"),{status:404});
    }
    const [existing]=await tx.select().from(downloads).where(and(eq(downloads.userId,req.user.id),eq(downloads.bookId,id)));
    const [policyRow]=await tx.select({value:settings.value}).from(settings).where(eq(settings.key,"download_policy"));
    const repeat=policyRow?.value?.allowRepeatDownload??(String(process.env.ALLOW_REPEAT_DOWNLOAD||"true")==="true");
    if(existing&&!repeat)throw Object.assign(new Error("Repeat downloads are disabled for this library account."),{status:403});
    if(existing){
     await tx.update(downloads).set({downloadCount:sql`${downloads.downloadCount} + 1`,lastDownloadedAt:new Date()}).where(and(eq(downloads.userId,req.user.id),eq(downloads.bookId,id)));
    }else{
     const a=await getAllowance(tx,req.user.id);
     if(a.remaining<=0)throw Object.assign(new Error("Download limit reached. Publish three books to unlock 10 more downloads."),{status:403,allowance:a});
     await tx.insert(downloads).values({userId:req.user.id,bookId:id,downloadCount:1,lastDownloadedAt:new Date()});
     await tx.insert(ledger).values({userId:req.user.id,kind:"download",amount:-1,bookId:id});
     await tx.update(books).set({downloadCount:sql`${books.downloadCount} + 1`}).where(eq(books.id,id));
    }
    await tx.update(users).set({dailyDownloadDate:today,dailyDownloadCount:downloadsToday+1}).where(eq(users.id,req.user.id));
    return{...b,fileName:b.fileName||`${b.title}.pdf`,externalUrl};
   });
   if(result.externalUrl)return res.json({externalUrl:result.externalUrl});
   if(!await streamBook(db,result,res,"attachment"))return res.status(404).json({error:"Book file is unavailable"});
  }catch(error){if(error.status)return res.status(error.status).json({error:error.message,credits:error.allowance});next(error);}
 });
 r.post("/contributions/blob-upload",contributionLimiter,async(req,res,next)=>{try{if(!hasBlobStorage())return res.status(503).json({error:"Private PDF storage is not configured"});const completion=req.body?.type==="blob.upload-completed";if(!completion&&(!req.user||req.get("X-Requested-With")!=="library"))return res.status(req.user?403:401).json({error:req.user?"Missing CSRF header":"Authentication required"});const result=await handleUpload({body:req.body,request:req,onBeforeGenerateToken:async(pathname)=>{const prefix=`books/${req.user.id}/`;if(!pathname.startsWith(prefix)||pathname.includes("..")||!pathname.toLowerCase().endsWith(".pdf"))throw Object.assign(new Error("Invalid upload path"),{status:400});return{allowedContentTypes:["application/pdf"],maximumSizeInBytes:Number(process.env.MAX_UPLOAD_MB||50)*1024*1024,addRandomSuffix:true,tokenPayload:JSON.stringify({userId:req.user.id})};},onUploadCompleted:async({blob,tokenPayload})=>{const owner=JSON.parse(tokenPayload||"{}").userId;if(!owner||!blob.pathname.startsWith(`books/${owner}/`))throw new Error("Upload ownership validation failed");}});res.json(result);}catch(error){next(error);}});
 r.post("/contributions",requireAuth,contributionLimiter,upload.single("file"),async(req,res,next)=>{
  let blobPathname=null,localFileKey=null,stored=false,requestedPath=null;
  try{
   const p=bookInput.safeParse(req.body);
   if(!p.success)return res.status(400).json({error:"Invalid book details",issues:p.error.flatten().fieldErrors});
   let file=req.file;
   if(req.body.blobPathname){requestedPath=String(req.body.blobPathname);if(!hasBlobStorage()||!requestedPath.startsWith(`books/${req.user.id}/`)||requestedPath.includes(".."))return res.status(400).json({error:"Invalid uploaded PDF reference"});const [existingPath]=await db.select({id:books.id}).from(books).where(eq(books.blobPathname,requestedPath));if(existingPath)return res.status(409).json({error:"This uploaded file has already been submitted"});const buffer=await readPrivatePdf(requestedPath);if(buffer.length>Number(process.env.MAX_UPLOAD_MB||50)*1024*1024)return res.status(413).json({error:"PDF exceeds the upload size limit"});file={buffer,size:buffer.length,originalname:String(req.body.fileName||"book.pdf"),mimetype:"application/pdf"};}
   if(!file)return res.status(400).json({error:"A PDF file is required"});
   if(path.extname(file.originalname).toLowerCase()!==".pdf"||file.mimetype!=="application/pdf"||file.buffer.subarray(0,5).toString()!=="%PDF-")return res.status(400).json({error:"File is not a valid PDF"});
   const [dupe]=await db.select({id:books.id}).from(books).where(or(p.data.isbn?eq(books.isbn,p.data.isbn):sql`false`,and(ilike(books.title,p.data.title),ilike(books.author,p.data.author))));
   if(dupe)return res.status(409).json({error:"A matching title, author, or ISBN already exists"});
   if(requestedPath)blobPathname=requestedPath;
   else if(hasBlobStorage()) { const blob=await uploadPrivatePdf(file.buffer,file.originalname);blobPathname=blob.pathname; }
   else if(process.env.NODE_ENV==="production")return res.status(503).json({error:"Private PDF storage is not configured"});
   else { fs.mkdirSync(storageDir,{recursive:true});localFileKey=path.join(storageDir,`${crypto.randomUUID()}.pdf`);fs.writeFileSync(localFileKey,file.buffer); }
   const vals=p.data;
   const [book]=await db.transaction(async tx=>{
    const now=new Date();
    const [saved]=await tx.insert(books).values({title:vals.title,author:vals.author,description:vals.description||"",categoryId:vals.categoryId,subjects:vals.subjects?vals.subjects.split(",").map(x=>x.trim()).filter(Boolean):[],language:vals.language||"English",isbn:vals.isbn||null,publisher:vals.publisher||null,publicationYear:vals.publicationYear||null,license:vals.license||null,coverUrl:vals.coverUrl||null,fileKey:localFileKey,fileName:file.originalname,fileSize:file.size,fileType:"pdf",blobPathname,indexingStatus:"pending",uploadedBy:req.user.id,status:"approved"}).returning();
    const [contribution]=await tx.insert(contributions).values({bookId:saved.id,userId:req.user.id,status:"approved",reviewedAt:now}).returning();
    await tx.insert(ledger).values({userId:req.user.id,kind:"contribution_approved",amount:1,contributionId:contribution.id});
    await tx.insert(auditLogs).values({action:"contribution_auto_approved",entity:"contribution",entityId:contribution.id,details:{bookId:saved.id}});
    return [saved];
   });
   stored=true;
   try { await startBookIndexing(db,book.id,file.buffer,file.originalname); }
   catch(error) { console.error("Gemini indexing could not be started for book",book.id,error.message); }
   res.status(201).json({book:publicBook(book)});
  }catch(error){
   if(!stored&&blobPathname&&!requestedPath){try{await deletePrivatePdf(blobPathname);}catch(cleanupError){console.error("Could not clean up an unused Blob upload:",cleanupError.message);}}
   if(!stored&&localFileKey)fs.rmSync(localFileKey,{force:true});
   next(error);
  }
 });
 r.get("/admin/storage/google-drive",requireRole("admin"),async(_req,res)=>res.json({storage:await getDriveStorageStatus(db)}));
 r.post("/admin/storage/google-drive/migrate",requireRole("admin"),async(_req,res)=>{const status=await getDriveStorageStatus(db);if(!status.connected)return res.status(409).json({error:"Connect Google Drive before migrating files"});const rows=await db.select({id:books.id,fileKey:books.fileKey,fileName:books.fileName}).from(books).where(sql`${books.fileKey} is not null and ${books.fileKey} not like 'gdrive:%'`);let migrated=0;const failed=[];for(const row of rows){if(!row.fileKey||!fs.existsSync(row.fileKey))continue;try{const fileId=await uploadDriveBook(db,row.fileKey,row.fileName||path.basename(row.fileKey));await db.update(books).set({fileKey:`gdrive:${fileId}`,updatedAt:new Date()}).where(eq(books.id,row.id));migrated++;}catch(error){failed.push(row.id);console.error("Google Drive migration failed for book",row.id,error.message);}}await db.insert(auditLogs).values({actorId:_req.user.id,action:"google_drive_migration",entity:"books",details:{migrated,failed:failed.length}});res.json({migrated,failed});});
 r.get("/admin/overview",requireRole("admin"),async(_req,res)=>{const [{users:nUsers}]=await db.select({users:sql`count(*)::int`}).from(users);const [{books:nBooks}]=await db.select({books:sql`count(*)::int`}).from(books).where(eq(books.status,"approved"));const [{pending}]=await db.select({pending:sql`count(*)::int`}).from(contributions).where(eq(contributions.status,"pending"));const [{events}]=await db.select({events:sql`count(*)::int`}).from(downloads);res.json({stats:{users:nUsers,books:nBooks,pending,distinctDownloads:events}});});
 r.get("/admin/contributions",requireRole("admin"),async(_req,res)=>res.json({contributions:await db.select({book:books,contribution:contributions,user:users.name,email:users.email}).from(contributions).innerJoin(books,eq(books.id,contributions.bookId)).innerJoin(users,eq(users.id,contributions.userId)).where(eq(contributions.status,"pending")).orderBy(asc(books.createdAt))}));
 r.get("/admin/contributions/:id/file",requireRole("admin"),async(req,res,next)=>{try{const [row]=await db.select({id:books.id,title:books.title,fileKey:books.fileKey,blobPathname:books.blobPathname,fileName:books.fileName}).from(contributions).innerJoin(books,eq(books.id,contributions.bookId)).where(eq(contributions.id,Number(req.params.id)));if(!hasBookFile(row))return res.status(404).json({error:"Submission file not found"});if(!await streamBook(db,row,res,"inline"))return res.status(404).json({error:"Submission file not found"});}catch(error){if(error.status)return res.status(error.status).json({error:error.message});next(error);}});
 r.patch("/admin/contributions/:id",requireRole("admin"),async(req,res)=>{const p=z.object({status:z.enum(["approved","rejected","needs_changes"]),note:z.string().max(2000).optional()}).safeParse(req.body);if(!p.success)return res.status(400).json({error:"Invalid moderation decision"});const id=Number(req.params.id);const result=await db.transaction(async tx=>{await tx.execute(sql`select id from contributions where id = ${id} for update`);const [c]=await tx.select().from(contributions).where(eq(contributions.id,id));if(!c)return null;if(c.status!=="pending")throw Object.assign(new Error("This submission has already been reviewed"),{status:409});await tx.update(contributions).set({status:p.data.status,reviewNote:p.data.note||null,reviewedBy:req.user.id,reviewedAt:new Date()}).where(eq(contributions.id,id));await tx.update(books).set({status:p.data.status==="approved"?"approved":p.data.status,moderationNote:p.data.note||null,updatedAt:new Date()}).where(eq(books.id,c.bookId));if(p.data.status==="approved")await tx.insert(ledger).values({userId:c.userId,kind:"contribution_approved",amount:1,contributionId:c.id});await tx.insert(auditLogs).values({actorId:req.user.id,action:`contribution_${p.data.status}`,entity:"contribution",entityId:c.id,details:{note:p.data.note||null}});await notifyContributionReview(tx,c.userId,c.bookId,p.data.status);return c;});if(!result)return res.status(404).json({error:"Submission not found"});if(p.data.status==="approved")beginBookIndexing(db,result.bookId).catch(error=>console.error("Gemini indexing could not be started for approved book",result.bookId,error.message));res.json({ok:true});});
 r.post("/books/:id/report",requireAuth,async(req,res)=>{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return res.status(404).json({error:"Book not found"});const [available]=await db.select({id:books.id}).from(books).where(and(eq(books.id,id),eq(books.status,"approved")));if(!available)return res.status(404).json({error:"Book not found"});const p=z.object({reason:z.string().trim().min(10).max(2000)}).safeParse(req.body);if(!p.success)return res.status(400).json({error:"Please describe the issue"});const [report]=await db.insert(reports).values({userId:req.user.id,bookId:id,reason:p.data.reason}).returning();res.status(201).json({report});});
 r.get("/admin/categories",requireRole("admin"),async(_req,res)=>res.json({categories:await db.select().from(categories).orderBy(asc(categories.sortOrder),asc(categories.name))}));
 r.post("/admin/categories",requireRole("admin"),async(req,res)=>{const p=z.object({name:z.string().trim().min(1).max(100)}).safeParse(req.body);if(!p.success)return res.status(400).json({error:"Invalid category"});const slug=p.data.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");const [c]=await db.insert(categories).values({name:p.data.name,slug}).returning();res.status(201).json({category:c});});
 r.patch("/admin/categories/:id",requireRole("admin"),async(req,res)=>{const p=z.object({name:z.string().trim().min(1).max(100).optional(),active:z.boolean().optional(),sortOrder:z.number().int().min(0).max(10000).optional()}).refine(v=>Object.keys(v).length>0).safeParse(req.body);if(!p.success)return res.status(400).json({error:"Invalid category update"});const update={...p.data};if(update.name)update.slug=update.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");const [category]=await db.update(categories).set(update).where(eq(categories.id,Number(req.params.id))).returning();if(!category)return res.status(404).json({error:"Category not found"});await db.insert(auditLogs).values({actorId:req.user.id,action:"category_updated",entity:"category",entityId:category.id,details:update});res.json({category});});
 r.get("/admin/books",requireRole("admin"),async(req,res)=>{const page=Math.max(1,Number(req.query.page)||1),limit=Math.min(100,Math.max(1,Number(req.query.limit)||30));const rows=await db.select({book:books,category:categories.name}).from(books).leftJoin(categories,eq(books.categoryId,categories.id)).orderBy(desc(books.createdAt)).limit(limit).offset((page-1)*limit);const [{n:total}]=await db.select({n:sql`count(*)::int`}).from(books);res.json({books:rows.map(row=>({...publicBook(row.book),indexingError:row.book.indexingError,category:row.category})),page,limit,total});});
 r.post("/admin/books/:id/index",requireRole("admin"),async(req,res,next)=>{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return res.status(404).json({error:"Book not found"});try{const [book]=await db.select().from(books).where(eq(books.id,id));if(!book)return res.status(404).json({error:"Book not found"});if(book.status!=="approved")return res.status(409).json({error:"Only approved books can be indexed"});if(book.indexingStatus==="processing"||book.indexingStatus==="indexed")return res.json({status:book.indexingStatus});const result=await beginBookIndexing(db,id);res.status(202).json(result);}catch(error){if(error.status)return res.status(error.status).json({error:error.message});next(error);}});
 r.patch("/admin/books/:id", requireRole("admin"), async (req, res) => {
  const parsed = z.object({ title: z.string().trim().min(1).max(250).optional(), author: z.string().trim().min(1).max(250).optional(), description: z.string().max(10000).optional(), categoryId: z.number().int().positive().nullable().optional(), status: z.enum(["approved", "pending", "rejected", "needs_changes"]).optional(), moderationNote: z.string().max(2000).nullable().optional(), license: z.string().max(2000).optional() }).refine(value => Object.keys(value).length > 0).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid book update" });
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(404).json({ error: "Book not found" });
  const result = await db.transaction(async tx => {
   await tx.execute(sql`select id from books where id = ${id} for update`);
   const [current] = await tx.select().from(books).where(eq(books.id, id));
   if (!current) return { missing: true };
   const data = parsed.data;
   if (data.status && data.status !== current.status) {
    const [contribution] = await tx.select().from(contributions).where(eq(contributions.bookId, id));
    if (contribution && contribution.status !== data.status) {
     const wasApproved = contribution.status === "approved";
     const willBeApproved = data.status === "approved";
     await tx.update(contributions).set({ status: data.status, reviewNote: data.moderationNote || null, reviewedBy: req.user.id, reviewedAt: new Date() }).where(eq(contributions.id, contribution.id));
     if (willBeApproved && !wasApproved) await tx.insert(ledger).values({ userId: contribution.userId, kind: "contribution_approved", amount: 1, contributionId: contribution.id });
     if (wasApproved && !willBeApproved) await tx.insert(ledger).values({ userId: contribution.userId, kind: "contribution_revoked", amount: -1, contributionId: contribution.id });
     await notifyContributionReview(tx, contribution.userId, id, data.status);
    }
   }
   const [book] = await tx.update(books).set({ ...data, updatedAt: new Date() }).where(eq(books.id, id)).returning();
   await tx.insert(auditLogs).values({ actorId: req.user.id, action: "book_updated", entity: "book", entityId: id, details: data });
   return { book };
  });
  if (result.missing) return res.status(404).json({ error: "Book not found" });
  if(parsed.data.status==="approved")beginBookIndexing(db,id).catch(error=>console.error("Gemini indexing could not be started for approved book",id,error.message));
  res.json({ book: result.book });
 });
 r.get("/admin/users",requireRole("admin"),async(req,res)=>{const page=Math.max(1,Number(req.query.page)||1),limit=Math.min(100,Math.max(1,Number(req.query.limit)||30));const rows=await db.select({id:users.id,email:users.email,name:users.name,role:users.role,suspended:users.suspended,createdAt:users.createdAt}).from(users).orderBy(desc(users.createdAt)).limit(limit).offset((page-1)*limit);const [{n:total}]=await db.select({n:sql`count(*)::int`}).from(users);res.json({users:rows,page,limit,total});});
 r.patch("/admin/users/:id",requireRole("admin"),async(req,res)=>{const id=Number(req.params.id),p=z.object({role:z.enum(["user","admin"]).optional(),suspended:z.boolean().optional()}).refine(v=>Object.keys(v).length>0).safeParse(req.body);if(!Number.isSafeInteger(id)||id<1)return res.status(404).json({error:"User not found"});if(!p.success)return res.status(400).json({error:"Invalid user update"});if(id===req.user.id&&(p.data.role!==undefined||p.data.suspended===true))return res.status(400).json({error:"You cannot change your own role or suspend your own account"});const [u]=await db.update(users).set(p.data).where(eq(users.id,id)).returning({id:users.id,email:users.email,name:users.name,role:users.role,suspended:users.suspended});if(!u)return res.status(404).json({error:"User not found"});await db.insert(auditLogs).values({actorId:req.user.id,action:"user_updated",entity:"user",entityId:id,details:p.data});res.json({user:u});});
 r.get("/admin/reports",requireRole("admin"),async(_req,res)=>{const rows=await db.select({report:reports,book:books,user:users.name,email:users.email}).from(reports).leftJoin(books,eq(books.id,reports.bookId)).innerJoin(users,eq(users.id,reports.userId)).orderBy(asc(reports.status),desc(reports.createdAt));res.json({reports:rows});});
 r.patch("/admin/reports/:id",requireRole("admin"),async(req,res)=>{const p=z.object({status:z.enum(["open","reviewing","resolved","dismissed"])}).safeParse(req.body);if(!p.success)return res.status(400).json({error:"Invalid report status"});const id=Number(req.params.id),[report]=await db.update(reports).set({status:p.data.status}).where(eq(reports.id,id)).returning();if(!report)return res.status(404).json({error:"Report not found"});await db.insert(auditLogs).values({actorId:req.user.id,action:`report_${p.data.status}`,entity:"report",entityId:id});res.json({report});});
 r.get("/admin/ratings",requireRole("admin"),async(_req,res)=>res.json({ratings:await db.select({rating:ratings,book:books.title,user:users.name,email:users.email}).from(ratings).innerJoin(books,eq(books.id,ratings.bookId)).innerJoin(users,eq(users.id,ratings.userId)).where(eq(ratings.status,"pending")).orderBy(asc(ratings.createdAt))}));
 r.patch("/admin/ratings/:id",requireRole("admin"),async(req,res)=>{const p=z.object({status:z.enum(["approved","rejected"])}).safeParse(req.body);if(!p.success)return res.status(400).json({error:"Invalid rating decision"});const id=Number(req.params.id),[rating]=await db.update(ratings).set({status:p.data.status,updatedAt:new Date()}).where(eq(ratings.id,id)).returning();if(!rating)return res.status(404).json({error:"Rating not found"});await db.insert(auditLogs).values({actorId:req.user.id,action:`rating_${p.data.status}`,entity:"book_rating",entityId:id});res.json({rating});});
 r.get("/admin/audit-logs",requireRole("admin"),async(req,res)=>{const limit=Math.min(100,Math.max(1,Number(req.query.limit)||50));res.json({logs:await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit)});});
 r.get("/admin/settings/credits",requireRole("admin"),async(_req,res)=>{const [saved]=await db.select({value:settings.value}).from(settings).where(eq(settings.key,"download_policy"));res.json({policy:saved?.value||{freeDownloads:Number(process.env.FREE_DOWNLOADS||3),contributionsPerUnlock:Number(process.env.CONTRIBUTIONS_PER_UNLOCK||3),downloadsPerUnlock:Number(process.env.DOWNLOADS_PER_UNLOCK||10),allowRepeatDownload:String(process.env.ALLOW_REPEAT_DOWNLOAD||"true")==="true"}});});
 r.patch("/admin/settings/credits",requireRole("admin"),async(req,res)=>{const p=z.object({freeDownloads:z.number().int().min(0).max(100),contributionsPerUnlock:z.number().int().min(1).max(100),downloadsPerUnlock:z.number().int().min(1).max(100),allowRepeatDownload:z.boolean()}).safeParse(req.body);if(!p.success)return res.status(400).json({error:"Invalid download policy"});await db.insert(settings).values({key:"download_policy",value:p.data}).onConflictDoUpdate({target:settings.key,set:{value:p.data}});await db.insert(auditLogs).values({actorId:req.user.id,action:"download_policy_updated",entity:"settings",details:p.data});res.json({policy:p.data});});
 return r;}
