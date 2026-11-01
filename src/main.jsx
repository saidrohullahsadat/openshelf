import React, { Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  BookOpen,
  Search,
  Bookmark,
  Download,
  Heart,
  UserRound,
  LayoutDashboard,
  Plus,
  LogOut,
  ArrowRight,
  LibraryBig,
  Menu,
  X,
  ChevronLeft,
  FileText,
  ShieldCheck,
  Clock3,
  Check,
  AlertCircle,
  Sun,
  Moon,
} from "lucide-react";
import "./style.css";
const AdminPage = lazy(() => import("./AdminPage.jsx"));
const LANGUAGES = [
  "English",
  "Dari (Persian)",
  "Pashto",
  "Arabic",
  "French",
  "Spanish",
  "Urdu",
  "Hindi",
  "Bengali",
  "Chinese",
  "Japanese",
  "Korean",
  "Russian",
  "Turkish",
  "Kurdish",
  "Uzbek",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Indonesian",
  "Malay",
  "Thai",
  "Vietnamese",
  "Hebrew",
  "Greek",
  "Ukrainian",
  "Other",
];
const UI_LANGUAGES = ["English", "Dari (Persian)", "Pashto"];
const TRANSLATIONS = {
  "Dari (Persian)": {
    Explore: "گشت‌وگذار",
    Popular: "محبوب",
    Contribute: "مشارکت",
    "My library": "کتابخانه من",
    Admin: "مدیر",
    "Admin access required": "دسترسی مدیر لازم است",
    "Sign in with an administrator account to manage the library.":
      "برای مدیریت کتابخانه با حساب مدیر وارد شوید.",
    "Full access controls": "کنترل‌های کامل مدیریت",
    "Manage books, readers, categories, reports, reviews, moderation, audit history, and download rules.":
      "کتاب‌ها، خوانندگان، دسته‌بندی‌ها، گزارش‌ها، دیدگاه‌ها، بررسی محتوا، سابقه تغییرات و قوانین دانلود را مدیریت کنید.",
    Storage: "ذخیره‌سازی",
    "Google Drive storage": "ذخیره‌سازی Google Drive",
    "Connected account": "حساب متصل‌شده",
    "Uploads are stored locally until Google Drive is connected.":
      "تا زمان اتصال Google Drive، فایل‌های آپلودشده به‌صورت محلی ذخیره می‌شوند.",
    "New book uploads will be saved to this Drive account.":
      "فایل‌های جدید کتاب در این حساب Drive ذخیره می‌شوند.",
    "Connect Google Drive": "اتصال Google Drive",
    "Copy existing local PDFs to Drive": "کپی PDFهای محلی به Drive",
    "Copied to Drive": "در Drive کاپی شول",
    Failed: "ناموفق",
    "Add the Google OAuth settings and Drive token key before connecting.":
      "پیش از اتصال، تنظیمات Google OAuth و کلید رمزگذاری Drive را وارد کنید.",
    "Google Drive connection failed. Check the Drive API, consent screen, and test user.":
      "اتصال Google Drive ناموفق بود. API، صفحه رضایت و کاربر آزمایشی را بررسی کنید.",
    "Google Drive is connected. New book uploads will be saved there.":
      "Google Drive وصل شد؛ کتاب‌های جدید در آنجا ذخیره می‌شوند.",
    "LIBRARY MANAGEMENT": "مدیریت کتابخانه",
    "Admin dashboard.": "داشبورد مدیر.",
    "Keep the collection thoughtful, useful, and growing.":
      "مجموعه را مفید، ارزشمند و رو به رشد نگه دارید.",
    ADMIN: "مدیر",
    "REGISTERED READERS": "خوانندگان ثبت‌نام‌شده",
    "PUBLISHED BOOKS": "کتاب‌های منتشرشده",
    "PENDING REVIEW": "در انتظار بررسی",
    "DISTINCT DOWNLOADS": "دانلودهای جداگانه",
    License: "مجوز",
    "Submissions to review": "کتاب‌های در انتظار بررسی",
    "Review the details and license before publishing.":
      "پیش از انتشار، جزئیات و مجوز را بررسی کنید.",
    "Reason for rejection (shown to the contributor):":
      "دلیل رد کردن (برای نویسنده نمایش داده می‌شود):",
    "Category name": "نام دسته‌بندی",
    "All caught up. There are no submissions to review.":
      "همه موارد بررسی شده‌اند؛ کتابی در صف بررسی نیست.",
    "Book published": "کتاب منتشر شد",
    "Your book is now live in the public catalog.":
      "کتاب شما اکنون در فهرست عمومی در دسترس است.",
    "Books appear in the catalog right away. Admins can reject them later.":
      "کتاب‌ها فوراً در فهرست منتشر می‌شوند و مدیران می‌توانند بعداً آن‌ها را رد کنند.",
    "Publish book": "کتاب را منتشر کنید",
    "Google sign-in needs native app setup before it can be used here.":
      "ورود با Google در این اپ به تنظیمات ویژه موبایل نیاز دارد.",
    "Publish three books to unlock 10 more downloads.":
      "سه کتاب منتشر کنید تا ۱۰ دانلود دیگر دریافت کنید.",
    "Every three published books unlock 10 more downloads. Daily limit: 10 downloads; it resets tomorrow. Repeat downloads also count toward the daily limit.":
      "هر سه کتاب منتشرشده ۱۰ دانلود دیگر باز می‌کند. حد روزانه ۱۰ دانلود است و فردا دوباره آغاز می‌شود. دانلود دوباره نیز در حد روزانه حساب می‌شود.",
    "Submitted to the review team": "برای بررسی به کتابخانه فرستاده شد",
    "Preview document": "پیش‌نمایش فایل",
    "No description provided.": "توضیحی ارائه نشده است.",
    "by": "از سوی",
    system: "سامانه",
    contribution: "سهم کتاب",
    book: "کتاب",
    settings: "تنظیمات",
    category: "دسته‌بندی",
    report: "گزارش",
    book_rating: "امتیاز کتاب",
    "Books": "کتاب‌ها",
    "Users": "کاربران",
    "Categories": "دسته‌بندی‌ها",
    "Reports": "گزارش‌ها",
    "Ratings": "امتیازها",
    "Audit": "سوابق",
    "Credits": "اعتبارها",
    "Free distinct downloads": "دانلودهای رایگان کتاب‌های متفاوت",
    "Approved contributions per unlock": "تعداد کتاب‌های تأییدشده برای افزایش سهمیه",
    "Downloads per unlock": "دانلودهای افزوده‌شده در هر مرحله",
    "Allow free repeat downloads": "اجازه دانلود دوباره رایگان",
    "Save credit rules": "ذخیره قوانین دانلود",
    "Publish": "انتشار",
    "Reject": "رد کردن",
    "Make reader": "تبدیل به خواننده",
    "Make admin": "تبدیل به مدیر",
    "Restore": "بازیابی",
    "Suspend": "تعلیق",
    "Add category": "افزودن دسته‌بندی",
    "Active": "فعال",
    "Hidden": "پنهان",
    "Hide": "پنهان کردن",
    "Activate": "فعال کردن",
    "Book unavailable": "کتاب در دسترس نیست",
    "reviewing": "در حال بررسی",
    "resolved": "رسیدگی‌شده",
    "dismissed": "ردشده",
    "open": "باز",
    "Approve": "تأیید",
    "No written review": "بدون دیدگاه نوشتاری",
    "approved": "تأییدشده",
    "rejected": "ردشده",
    "pending": "در انتظار بررسی",
    "needs_changes": "نیازمند اصلاح",
    active: "فعال",
    suspended: "معلق",
    admin: "مدیر",
    user: "خواننده",
    contribution_approved: "تأیید سهم کتاب",
    contribution_rejected: "رد سهم کتاب",
    contribution_needs_changes: "درخواست اصلاح کتاب",
    book_updated: "به‌روزرسانی کتاب",
    user_updated: "به‌روزرسانی کاربر",
    category_updated: "به‌روزرسانی دسته‌بندی",
    report_resolved: "رسیدگی به گزارش",
    rating_approved: "تأیید امتیاز",
    rating_rejected: "رد امتیاز",
    download_policy_updated: "به‌روزرسانی قوانین دانلود",
    "Nothing to show here yet.": "هنوز موردی برای نمایش وجود ندارد.",
    Profile: "نمایه",
    "Log in": "ورود",
    "Join the library": "عضویت در کتابخانه",
    "YOUR NEXT CHAPTER STARTS HERE": "فصل بعدی شما از اینجا آغاز می‌شود",
    "Ideas worth": "ایده‌هایی که ارزش دارند",
    "getting lost in.": "در آن‌ها غرق شوید.",
    "Search books, authors, subjects…": "جست‌وجوی کتاب، نویسنده یا موضوع…",
    "Find a book": "جست‌وجوی کتاب",
    "Explore the shelves.": "قفسه‌ها را بگردید.",
    "All categories": "همه دسته‌ها",
    "All languages": "همه زبان‌ها",
    "Recently added": "تازه‌افزوده‌ها",
    "Most downloaded": "بیشترین دانلود",
    "Most read": "بیشترین مطالعه",
    "Share a book": "اشتراک‌گذاری کتاب",
    "Book title *": "عنوان کتاب *",
    "Author *": "نویسنده *",
    "Category *": "دسته‌بندی *",
    "Subjects, separated by commas": "موضوع‌ها، با کاما جدا شوند",
    Language: "زبان",
    Description: "توضیحات",
    "My library.": "کتابخانه من.",
    Downloads: "دانلودها",
    Overview: "نمای کلی",
    Reading: "در حال مطالعه",
    PROFILE: "نمایه",
    Appearance: "ظاهر",
    "Saving…": "در حال ذخیره…",
    "Profile settings": "تنظیمات نمایه",
    "Change your name, language, and appearance.":
      "نام، تصویر، زبان و ظاهر خود را تغییر دهید.",
    "Display name": "نام نمایشی",
    "System language": "زبان سامانه",
    "Light mode": "حالت روشن",
    "Dark mode": "حالت تاریک",
    "Profile image": "تصویر نمایه",
    "Save profile": "ذخیره نمایه",
    "Choose a JPG, PNG, or WebP image up to 10 MB.":
      "تصویر JPG، PNG یا WebP تا ۱۰ مگابایت انتخاب کنید.",
    "Saved profile settings.": "تنظیمات نمایه ذخیره شد.",
    "My downloads": "دانلودهای من",
    "No downloads yet": "هنوز دانلودی ندارید",
    "Save to reading list": "ذخیره در فهرست مطالعه",
    "Remove from reading list": "حذف از فهرست مطالعه",
    "Add to favorites": "افزودن به علاقه‌مندی‌ها",
    "Remove from favorites": "حذف از علاقه‌مندی‌ها",
    "Read online": "مطالعه آنلاین",
    "Download PDF": "دانلود PDF",
    "Apply filters": "اعمال فیلترها",
  },
  Pashto: {
    Explore: "کتابتون وپلټئ",
    Popular: "مشهور",
    Contribute: "کتاب شریکول",
    "My library": "زما کتابتون",
    Admin: "مدیر",
    Profile: "پروفایل",
    "Log in": "ننوتل",
    "Join the library": "کتابتون سره یوځای کېدل",
    "YOUR NEXT CHAPTER STARTS HERE": "ستاسو راتلونکی فصل له دې ځایه پیلېږي",
    "Ideas worth": "هغه مفکورې چې ارزښت لري",
    "getting lost in.": "چې پکې ډوب شئ.",
    "Search books, authors, subjects…": "کتابونه، لیکوالان او موضوعات ولټوئ…",
    "Find a book": "کتاب ولټوئ",
    "Explore the shelves.": "کتابتون وپلټئ.",
    "All categories": "ټولې کټګورۍ",
    "All languages": "ټولې ژبې",
    "Recently added": "نوي زیات شوي",
    "Most downloaded": "ډېر ډاونلوډ شوي",
    "Most read": "ډېر لوستل شوي",
    "Share a book": "کتاب شریک کړئ",
    "Book title *": "د کتاب نوم *",
    "Author *": "لیکوال *",
    "Category *": "کټګوري *",
    "Subjects, separated by commas": "موضوعات، په کامو یې جلا کړئ",
    Language: "ژبه",
    Description: "تشریح",
    "My library.": "زما کتابتون.",
    Downloads: "ډاونلوډونه",
    Overview: "لنډیز",
    Reading: "لوستل",
    PROFILE: "پروفایل",
    Appearance: "بڼه",
    "Saving…": "خوندي کېږي…",
    "Profile settings": "د پروفایل امستنې",
    "Change your name, language, and appearance.":
      "خپل نوم، انځور، ژبه او بڼه بدله کړئ.",
    "Display name": "ښکاره کېدونکی نوم",
    "System language": "د سیسټم ژبه",
    "Light mode": "روښانه بڼه",
    "Dark mode": "تیاره بڼه",
    "Profile image": "د پروفایل انځور",
    "Save profile": "پروفایل خوندي کړئ",
    "Choose a JPG, PNG, or WebP image up to 10 MB.":
      "تر ۱۰ مېګابایټه پورې JPG، PNG یا WebP انځور وټاکئ.",
    "Saved profile settings.": "د پروفایل امستنې خوندي شوې.",
    "My downloads": "زما ډاونلوډونه",
    "No downloads yet": "تر اوسه مو څه نه دي ډاونلوډ کړي",
    "Save to reading list": "د لوستلو لړ ته خوندي کړئ",
    "Remove from reading list": "د لوستلو له لړ څخه لرې کړئ",
    "Add to favorites": "د خوښې وړ ته ورزیات کړئ",
    "Remove from favorites": "له خوښې وړ څخه لرې کړئ",
    "Read online": "آنلاین ولولئ",
    "Download PDF": "PDF ډاونلوډ کړئ",
    "Apply filters": "فلټرونه پلي کړئ",
  },
};
const EXTRA_TRANSLATIONS = {
  Pashto: {
    "Good to see you again.": "بیا مو لیدل د خوښۍ خبره ده.",
    "Sign in to pick up where you left off.":
      "خپل حساب ته ننوځئ او لوستلو ته دوام ورکړئ.",
    "Email address": "برېښنالیک پته",
    Password: "پټ نوم",
    "At least 10 characters.": "لږ تر لږه ۱۰ توري.",
    "Log in to your account": "خپل حساب ته ننوځئ",
    "New to Open Shelf?": "اوپن شېلف ته نوي یاست؟",
    "Make room for a new idea.": "د نوې مفکورې لپاره ځای جوړ کړئ.",
    "Join a community that believes good books are better shared.":
      "له هغې ټولنې سره یوځای شئ چې ښه کتابونه له نورو سره شریکوي.",
    "Your name": "ستاسو نوم",
    "Create your account": "خپل حساب جوړ کړئ",
    "Already have an account?": "لا دمخه حساب لرئ؟",
    "YOUR NEXT CHAPTER STARTS HERE": "ستاسو راتلونکی فصل له دې ځایه پیلېږي",
    "A thoughtful collection of books for every curious mind. Find something new, or share something you love.":
      "د هر لېوال لوستونکي لپاره د کتابونو غوره ټولګه. نوی کتاب ومومئ یا خپل خوښ کتاب له نورو سره شریک کړئ.",
    "A growing, shared collection": "د ټولو په ګډه پراخېدونکې ټولګه",
    "Reader-powered & thoughtfully curated":
      "د لوستونکو په مرسته په غور چمتو شوې",
    "A LIBRARY THAT GROWS WITH YOU": "هغه کتابتون چې له تاسو سره وده کوي",
    "Good books have a way of finding you.":
      "ښه کتابونه تل خپله لاره پیدا کوي.",
    "Discover a fresh perspective, revisit a favorite, or help another reader find their next great read.":
      "نوې لیدلوری ومومئ، خپل خوښ کتاب بیا ولولئ، یا له بل لوستونکي سره د کتاب په موندلو کې مرسته وکړئ.",
    "Reader favorites": "د لوستونکو خوښ کتابونه",
    "The books people keep coming back to.":
      "هغه کتابونه چې لوستونکي یې بیا بیا لولي.",
    "Fresh on the shelves": "نوي ورزیات شوي کتابونه",
    "New additions from our community.": "زموږ د ټولنې نوې ډالۍ.",
    "Join the conversation around these reads.":
      "د دغو کتابونو د لوستونکو له خبرو سره یوځای شئ.",
    "YOUR SHELF, SHARED": "خپل کتابونه له نورو سره شریک کړئ",
    "Have a book worth sharing?": "د شریکولو وړ کتاب لرئ؟",
    "Help the next reader discover something wonderful. Every contribution is reviewed by our library team.":
      "له بل لوستونکي سره د غوره کتاب په موندلو کې مرسته وکړئ. زموږ ډله هره ونډه ارزوي.",
    "Contribute a book": "کتاب شریک کړئ",
    Explore: "کتابتون وپلټئ",
    Popular: "مشهور",
    "My library": "زما کتابتون",
    Contribute: "ونډه واخلئ",
    Admin: "مدیر",
    "Admin access required": "د اډمین لاسرسی اړین دی",
    "Sign in with an administrator account to manage the library.":
      "د کتابتون د مدیریت لپاره د اډمین حساب ته ننوځئ.",
    "LIBRARY MANAGEMENT": "د کتابتون مدیریت",
    "Admin dashboard.": "د اډمین مخکتنه.",
    "Keep the collection thoughtful, useful, and growing.":
      "ټولګه ګټوره او د ودې په حال کې وساتئ.",
    ADMIN: "اډمین",
    "REGISTERED READERS": "ثبت شوي لوستونکي",
    "PUBLISHED BOOKS": "خپر شوي کتابونه",
    "PENDING REVIEW": "د ارزونې په تمه",
    "DISTINCT DOWNLOADS": "د بېلابېلو کتابونو ډاونلوډونه",
    License: "د شریکولو اجازه",
    "Submissions to review": "د ارزونې لپاره سپارل شوي کتابونه",
    "Review the details and license before publishing.":
      "له خپرولو مخکې د کتاب معلومات او جواز وارزوئ.",
    "Reason for rejection (shown to the contributor):":
      "د ردولو دلیل (کتاب شریکوونکي ته ښکاري):",
    "Category name": "د کټګورۍ نوم",
    "All caught up. There are no submissions to review.":
      "ټول کتابونه ارزول شوي؛ د ارزونې لپاره څه پاتې نه دي.",
    "Book published": "کتاب خپور شو",
    "Your book is now live in the public catalog.":
      "ستاسو کتاب اوس په عامه کتابتون کې خپور شوی دی.",
    "Books appear in the catalog right away. Admins can reject them later.":
      "کتابونه سملاسي په فهرست کې خپرېږي؛ مدیران یې وروسته ردولای شي.",
    "Publish book": "کتاب خپور کړئ",
    "Google sign-in needs native app setup before it can be used here.":
      "په دې موبایل اپ کې د Google ننوتلو لپاره ځانګړي تنظیمات پکار دي.",
    "Publish three books to unlock 10 more downloads.":
      "درې کتابونه خپاره کړئ چې ۱۰ نور ډاونلوډونه ترلاسه کړئ.",
    "Every three published books unlock 10 more downloads. Daily limit: 10 downloads; it resets tomorrow. Repeat downloads also count toward the daily limit.":
      "هر درې خپاره شوي کتابونه ۱۰ نور ډاونلوډونه درکوي. د ورځې حد ۱۰ ډاونلوډونه دي او سبا بیا پیلېږي. بیا ډاونلوډ هم د ورځني حد برخه ده.",
    "Submitted to the review team": "د کتابتون د ارزونې ډلې ته ولېږل شو",
    "Preview document": "د فایل مخکتنه",
    "No description provided.": "تشریح نه ده ورکړل شوې.",
    "by": "له خوا",
    system: "سیسټم",
    contribution: "د کتاب ونډه",
    settings: "امستنې",
    category: "کټګوري",
    report: "راپور",
    book_rating: "د کتاب درجه",
    "Full access controls": "د بشپړ مدیریت واکونه",
    "Manage books, readers, categories, reports, reviews, moderation, audit history, and download rules.":
      "کتابونه، لوستونکي، کټګورۍ، راپورونه، بیاکتنې، ارزونه، د بدلونونو تاریخ او د ډاونلوډ اصول اداره کړئ.",
    Storage: "زېرمه",
    "Google Drive storage": "د Google Drive زېرمه",
    "Connected account": "نښلول شوی حساب",
    "Uploads are stored locally until Google Drive is connected.":
      "تر هغه چې Google Drive نه وي نښلول شوی، پورته شوي فایلونه په همدې کمپیوټر کې ساتل کېږي.",
    "New book uploads will be saved to this Drive account.":
      "د کتابونو نوي فایلونه به په همدې Drive حساب کې خوندي شي.",
    "Connect Google Drive": "Google Drive ونښلوئ",
    "Copy existing local PDFs to Drive": "اوسني محلي PDF فایلونه Drive ته کاپي کړئ",
    "Copied to Drive": "Drive ته کاپي شول",
    Failed: "ناکام",
    "Add the Google OAuth settings and Drive token key before connecting.":
      "له نښلولو مخکې د Google OAuth امستنې او د Drive د رمزولو کیلي برابره کړئ.",
    "Google Drive connection failed. Check the Drive API, consent screen, and test user.":
      "Google Drive ونښلول شوای نه؛ د Drive API، د اجازې مخ او ازمېښتي کارن وګورئ.",
    "Google Drive is connected. New book uploads will be saved there.":
      "Google Drive ونښلول شو؛ د کتابونو نوي فایلونه به هلته خوندي کېږي.",
    Books: "کتابونه",
    Users: "کاروونکي",
    Categories: "کټګورۍ",
    Reports: "راپورونه",
    Ratings: "درجې",
    Audit: "د بدلونونو تاریخ",
    Credits: "کریډیټونه",
    "Free distinct downloads": "د بېلابېلو کتابونو وړیا ډاونلوډونه",
    "Approved contributions per unlock": "د هر نوي امتیاز لپاره منل شوې ونډې",
    "Downloads per unlock": "د هر نوي امتیاز ډاونلوډونه",
    "Allow free repeat downloads": "د بیا ډاونلوډ وړیا اجازه",
    "Save credit rules": "د ډاونلوډ اصول خوندي کړئ",
    Publish: "خپورول",
    Reject: "ردول",
    "Make reader": "لوستونکی کول",
    "Make admin": "اډمین کول",
    Restore: "بیا فعالول",
    Suspend: "ځنډول",
    "Add category": "کټګوري زیاتول",
    Active: "فعاله",
    Hidden: "پټه",
    Hide: "پټول",
    Activate: "فعالول",
    "Book unavailable": "کتاب شتون نه لري",
    reviewing: "د ارزونې په حال کې",
    resolved: "حل شوی",
    dismissed: "رد شوی",
    open: "پرانیستی",
    Approve: "منل",
    "No written review": "لیکل شوې بیاکتنه نشته",
    approved: "منل شوی",
    rejected: "رد شوی",
    pending: "د ارزونې په تمه",
    needs_changes: "بدلونونو ته اړتیا لري",
    active: "فعال",
    suspended: "ځنډول شوی",
    admin: "اډمین",
    user: "لوستونکی",
    contribution_approved: "د کتاب ونډه ومنل شوه",
    contribution_rejected: "د کتاب ونډه رد شوه",
    contribution_needs_changes: "د کتاب د سمون غوښتنه وشوه",
    book_updated: "کتاب تازه شو",
    user_updated: "کارن تازه شو",
    category_updated: "کټګوري تازه شوه",
    report_resolved: "راپور وڅېړل شو",
    rating_approved: "درجه ومنل شوه",
    rating_rejected: "درجه رد شوه",
    download_policy_updated: "د ډاونلوډ اصول تازه شول",
    "Nothing to show here yet.": "تر اوسه د ښودلو لپاره څه نشته.",
    Profile: "پروفایل",
    "Log in": "ننوتل",
    "Join the library": "له کتابتون سره یوځای شئ",
    "Switch to dark mode": "تیاره بڼه فعاله کړئ",
    "Switch to light mode": "روښانه بڼه فعاله کړئ",
    "Saved profile settings.": "د پروفایل امستنې خوندي شوې.",
    Appearance: "بڼه",
    "Light mode": "روښانه بڼه",
    "Dark mode": "تیاره بڼه",
    "Loading…": "مهرباني وکړئ تم شئ…",
    "THE COLLECTION": "د کتابونو ټولګه",
    "Explore the shelves.": "کتابتون وپلټئ.",
    "Thoughtful reads, shared by curious minds.":
      "د ځیرکو لوستونکو لپاره غوره کتابونه.",
    "BROWSE BY": "لټون د دې له مخې",
    "Oldest first": "له پخوانیو څخه",
    "A to Z": "الف تر یا",
    book: "کتاب",
    books: "کتابونه",
    "No books found yet": "تر اوسه کتابونه ونه موندل شول",
    "Try changing your search, or help our collection grow by sharing a book.":
      "خپل لټون بدل کړئ یا د کتاب په شریکولو سره زموږ له ټولګې سره مرسته وکړئ.",
    Page: "پاڼه",
    Previous: "مخکینی",
    Next: "راتلونکی",
    "YOUR PERSONAL LIBRARY": "ستاسو شخصي کتابتون",
    "My library.": "زما کتابتون.",
    "Your books, your discoveries, all in one place.":
      "ستاسو کتابونه او موندنې، ټول په یوه ځای کې.",
    overview: "لنډیز",
    downloads: "ډاونلوډونه",
    "my-books": "زما کتابونه",
    reading: "لوستل",
    saved: "خوندي شوي",
    liked: "خوښ شوي",
    notifications: "خبرتیاوې",
    "FREE DOWNLOADS USED": "کارول شوي وړیا ډاونلوډونه",
    "APPROVED CONTRIBUTIONS": "منل شوې ونډې",
    "DOWNLOADS LEFT": "پاتې ډاونلوډونه",
    "Pick up where you left off": "له هماغه ځایه لوستل پیل کړئ",
    "No downloads yet": "تر اوسه مو کتاب نه دی ډاونلوډ کړی",
    "No contributions yet": "تر اوسه مو کتاب نه دی شریک کړی",
    "Share a book and help another reader.":
      "کتاب شریک کړئ او له بل لوستونکي سره مرسته وکړئ.",
    "No notifications yet.": "تر اوسه خبرتیا نشته.",
    "Mark all read": "ټولې د لوستل شویو په توګه وټاکئ",
    "Mark read": "لوستل شوی وټاکئ",
    PROFILE: "پروفایل",
    "Profile settings": "د پروفایل امستنې",
    "System language": "د سیسټم ژبه",
    "Display name": "ښکاره کېدونکی نوم",
    "Save profile": "پروفایل خوندي کړئ",
    "Choose a JPG, PNG, or WebP image up to 10 MB.":
      "تر ۱۰ مېګابایټه پورې JPG، PNG یا WebP انځور وټاکئ.",
    "Explore books": "کتابونه وپلټئ",
    "Add a book": "کتاب ورزیات کړئ",
    "Share the book": "کتاب شریک کړئ",
    Description: "تشریح",
    Language: "ژبه",
    "Category *": "کټګوري *",
    "Book title *": "د کتاب نوم *",
    "Author *": "لیکوال *",
    "Search books, authors, subjects…": "کتابونه، لیکوالان او موضوعات ولټوئ…",
    "Find a book": "کتاب ولټوئ",
    "All categories": "ټولې کټګورۍ",
    "All languages": "ټولې ژبې",
    "Most downloaded": "تر ټولو ډېر ډاونلوډ شوي",
    "Apply filters": "فلټرونه پلي کړئ",
    "Most read": "تر ټولو ډېر لوستل شوي",
    "Save to reading list": "د لوستلو لړ ته خوندي کړئ",
    "Remove from reading list": "له لړ څخه لرې کړئ",
    "Add to favorites": "خوښو ته ورزیات کړئ",
    "Remove from favorites": "له خوښو لرې کړئ",
    "Read online": "آنلاین لوستل",
    "Download PDF": "PDF ډاونلوډ کړئ",
    "A BOOK TO SHARE": "د شریکولو لپاره کتاب",
    "Give a good book": "یو ښه کتاب ورکړئ",
    "a new reader.": "نوي لوستونکي ته.",
    "Our library team reviews every submission before it goes on the shelves.":
      "زموږ د کتابتون ډله هر کتاب له خپرېدو مخکې ارزوي.",
    "How to share a book": "څنګه کتاب شریک کړئ",
    "Sign in, enter the book details, choose its category and language, and upload a PDF up to 50 MB. Add your sharing permission, then send the book for review. Once approved, it will appear in the public library for everyone to read or download.":
      "حساب ته ننوځئ، د کتاب معلومات ولیکئ، کټګوري او ژبه وټاکئ او تر ۵۰ مېګابایټه کوچنی PDF پورته کړئ. د شریکولو اجازه هم ولیکئ او کتاب د ارزونې لپاره ولېږئ. له منل کېدو وروسته به په عامه کتابتون کې ټولو ته د لوستلو او ډاونلوډ لپاره ښکاره شي.",
    "Choose a category": "کټګوري وټاکئ",
    "Subjects, separated by commas": "موضوعات په کامو سره جلا کړئ",
    ISBN: "ISBN",
    Publisher: "خپرندوی",
    "Publication year": "د خپرېدو کال",
    "Cover image URL": "د پوښ انځور پته",
    "License or permission information *":
      "د جواز یا د شریکولو د اجازې معلومات *",
    "Tell us why this book can be shared in our library.":
      "موږ ته ووایاست چې ولې دا کتاب زموږ په کتابتون کې شریکېدای شي.",
    "PDF book file *": "د کتاب PDF فایل *",
    "PDF only, up to 50 MB.": "یوازې PDF، تر ۵۰ مېګابایټه پورې.",
    "The PDF must be 50 MB or smaller.": "د PDF فایل باید ۵۰ مېګابایټه یا تر هغه کوچنی وي.",
    "Please only share works you own or have permission to distribute. We check every submission before publication.":
      "یوازې خپل یا د شریکولو اجازه لرونکي کتابونه شریک کړئ. موږ هره ونډه له خپرېدو مخکې ګورو.",
    "Send for review": "د ارزونې لپاره یې ولېږئ",
    "Computer Science": "کمپیوټر ساینس",
    Programming: "پروګرام‌لیکنه",
    "Web Development": "د وېب پراختیا",
    Databases: "ډیټابېسونه",
    "Artificial Intelligence": "مصنوعي ځیرکتیا",
    Mathematics: "ریاضي",
    Physics: "فزیک",
    Chemistry: "کیمیا",
    Biology: "بیولوژي",
    Medicine: "طب",
    History: "تاریخ",
    Literature: "ادبیات",
    Business: "سوداګري",
    Languages: "ژبې",
    Engineering: "انجنیري",
    "Islamic Studies": "اسلامي زده کړې",
    Religion: "دین",
    Other: "نور",
    Hindi: "هندي",
    Bengali: "بنګالي",
    Chinese: "چینایي",
    Japanese: "جاپاني",
    Korean: "کوریایي",
    Russian: "روسي",
    Turkish: "ترکي",
    Kurdish: "کردي",
    Uzbek: "ازبکي",
    German: "جرمني",
    Italian: "ایټالوي",
    Portuguese: "پرتګالي",
    Dutch: "هالنډي",
    Indonesian: "اندونیزیایي",
    Malay: "مالایي",
    Thai: "تایلنډي",
    Vietnamese: "ویتنامي",
    Hebrew: "عبري",
    Greek: "یوناني",
    Ukrainian: "اوکرایني",
    "Art & Design": "هنر او ډیزاین",
    Architecture: "معماري",
    Education: "زده کړې",
    Philosophy: "فلسفه",
    Psychology: "ارواپوهنه",
    Economics: "اقتصاد",
    Law: "حقوق",
    Politics: "سیاست",
    Geography: "جغرافیه",
    Environment: "چاپېریال",
    Agriculture: "کرنه",
    "Health & Fitness": "روغتیا او فټنس",
    Cooking: "پخلی",
    Poetry: "شاعري",
    Drama: "ډرامه",
    "Children’s Books": "د ماشومانو کتابونه",
    "Young Adult": "د تنکیو ځوانانو کتابونه",
    Comics: "کامیکونه",
    Reference: "مراجع",
    "Self-help": "ځان‌مرسته",
    "Continue with Google": "له Google سره دوام ورکړئ",
    or: "یا",
    "Google sign-in needs OAuth credentials in the server environment.":
      "د Google ننوتلو لپاره د سرور OAuth اسناد اړین دي.",
    "Google sign-in could not be completed. Please try again.":
      "د Google ننوتل بشپړ نه شول. بیا هڅه وکړئ.",
    "Your book is in the review queue. We’ll let you know when it’s approved.":
      "ستاسو کتاب د ارزونې په کتار کې دی. د منل کېدو په صورت کې به خبر درکړو.",
    "e.g. design, psychology": "لکه: ډیزاین، ارواپوهنه",
    Saved: "خوندي شوي",
    Liked: "خوښ شوي",
    Notifications: "خبرتیاوې",
    "My books": "زما کتابونه",
    English: "انګلیسي",
    "Dari (Persian)": "دري (فارسي)",
    Pashto: "پښتو",
    Arabic: "عربي",
    French: "فرانسوي",
    Spanish: "هسپانوي",
    Urdu: "اردو",
    "Contribution review updates": "د ونډې د ارزونې خبرتیاوې",
    "Tell me when an admin reviews a book I submitted.":
      "کله چې مدیر زما شریک کړی کتاب وارزوي، ما خبر کړئ.",
    "A bright look for daytime reading.": "د ورځې لوستلو لپاره روښانه بڼه.",
    "A softer look for low-light reading.":
      "په کمه رڼا کې د لوستلو لپاره نرمه بڼه.",
  },
};
function tr(text) {
  const language = localStorage.getItem("open-shelf-language") || "English";
  return (
    TRANSLATIONS[language]?.[text] ||
    EXTRA_TRANSLATIONS[language]?.[text] ||
    text
  );
}
const API_BASE = (import.meta.env.VITE_API_BASE || "/api/v1").replace(/\/$/, "");
const api = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      "X-Requested-With": "library",
      ...options.headers,
    },
  });
  if (res.status === 204) return null;
  const type = res.headers.get("content-type") || "";
  if (!res.ok) {
    const e = type.includes("json")
      ? await res.json()
      : { error: "Request failed" };
    throw Error(e.error || "Request failed");
  }
  return type.includes("json") ? res.json() : res;
};
function Cover({ book, large = false }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`cover ${large ? "cover-lg" : ""}`}
      aria-label={`Cover of ${book.title}`}
    >
      {book.coverUrl && !failed && (
        <img
          className="cover-image"
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          onError={() => setFailed(true)}
        />
      )}
      <div className="cover-inner">
        <span className="cover-kicker">{book.category || "OPEN SHELF"}</span>
        <strong>{book.title}</strong>
        <span className="cover-author">{book.author}</span>
        <BookOpen size={large ? 24 : 17} />
      </div>
    </div>
  );
}
function UserAvatar({ user, className = "" }) {
  return (
    <span
      className={`user-avatar avatar-fallback ${className}`}
      aria-hidden="true"
    >
      {user?.name?.trim()?.[0]?.toUpperCase() || "?"}
    </span>
  );
}
function App() {
  const [user, setUser] = useState(null),
    [authReady, setAuthReady] = useState(false),
    [menu, setMenu] = useState(false),
    [language, setLanguage] = useState(
      () => localStorage.getItem("open-shelf-language") || "English",
    ),
    [theme, setTheme] = useState(
      () => localStorage.getItem("open-shelf-theme") || "light",
    );
  const applyUser = (u) => {
    setUser(u);
    if (u?.preferredLanguage) {
      localStorage.setItem("open-shelf-language", u.preferredLanguage);
      setLanguage(u.preferredLanguage);
    }
    if (u?.theme) {
      localStorage.setItem("open-shelf-theme", u.theme);
      setTheme(u.theme);
    }
  };
  const updateLanguage = (value) => {
    localStorage.setItem("open-shelf-language", value);
    setLanguage(value);
  };
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (user) {
      api("/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: user.name,
          preferredLanguage: language,
          theme: next,
          notifyContributionReviews: user.notifyContributionReviews ?? true,
        }),
      })
        .then((result) =>
          setUser((current) => ({ ...current, ...result.user })),
        )
        .catch(() => {});
    }
  };
  useEffect(() => {
    api("/auth/me")
      .then((x) => applyUser(x.user))
      .catch(() => {})
      .finally(() => setAuthReady(true));
  }, []);
  useEffect(() => {
    const languageCodes = {
      English: "en",
      "Dari (Persian)": "fa-AF",
      Pashto: "ps",
      Arabic: "ar",
      French: "fr",
      Spanish: "es",
      Urdu: "ur",
    };
    const rtlLanguages = new Set(["Dari (Persian)", "Pashto", "Arabic", "Urdu"]);
    document.documentElement.lang = languageCodes[language] || "en";
    document.documentElement.dir = rtlLanguages.has(language) ? "rtl" : "ltr";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("open-shelf-language", language);
    localStorage.setItem("open-shelf-theme", theme);
  }, [language, theme]);
  const signout = async () => {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    location.href = "/";
  };
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <Link className="brand" to="/">
            <span className="brand-icon">
              <BookOpen size={20} />
            </span>
            <span>
              open<span className="brand-light">shelf</span>
            </span>
          </Link>
          <nav className={menu ? "nav nav-open" : "nav"}>
            <Link to="/catalog">{tr("Explore")}</Link>
            <Link to="/catalog?sort=popular">{tr("Popular")}</Link>
            {user && <Link to="/add">{tr("Contribute")}</Link>}
            {user && <Link to="/dashboard">{tr("My library")}</Link>}
            {user?.role === "admin" && <Link to="/admin">{tr("Admin")}</Link>}
          </nav>
          <div className="top-actions">
            <button
              className="icon-button theme-toggle"
              aria-label={tr(
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode",
              )}
              title={tr(
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode",
              )}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <>
                <Link className="profile-link" to="/profile">
                  <UserAvatar user={user} />
                  <span>{user.name.split(" ")[0]}</span>
                </Link>
                <button
                  className="icon-button"
                  onClick={signout}
                  title="Sign out"
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <>
                <Link className="login-link" to="/login">
                  {tr("Log in")}
                </Link>
                <Link className="button button-small" to="/register">
                  {tr("Join the library")} <ArrowRight size={14} />
                </Link>
              </>
            )}
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/book/:id" element={<BookPage user={user} />} />
            <Route path="/read/:id" element={<Reader user={user} />} />
            <Route
              path="/login"
              element={<Auth mode="login" onUser={applyUser} />}
            />
            <Route
              path="/register"
              element={<Auth mode="register" onUser={applyUser} />}
            />
            <Route path="/add" element={<AddBook />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/profile"
              element={
                <Profile
                  user={user}
                  onUpdate={applyUser}
                  language={language}
                  setLanguage={updateLanguage}
                  theme={theme}
                  setTheme={setTheme}
                />
              }
            />
            <Route
              path="/admin"
              element={
                !authReady ? (
                  <div className="page-wrap"><div className="loading-line" /></div>
                ) : user?.role === "admin" ? (
                  <Suspense fallback={<div className="page-wrap"><div className="loading-line" /></div>}>
                    <AdminPage api={api} apiBase={API_BASE} tr={tr} Cover={Cover} />
                  </Suspense>
                ) : (
                  <div className="page-wrap">
                    <div className="empty-state">
                      <ShieldCheck size={30} className="empty-icon" />
                      <h2>{tr("Admin access required")}</h2>
                      <p>{tr("Sign in with an administrator account to manage the library.")}</p>
                      <Link className="button" to="/login">{tr("Log in")}</Link>
                    </div>
                  </div>
                )
              }
            />
            <Route path="*" element={<Catalog />} />
          </Routes>
        </main>
        <footer>
          <Link className="brand footer-brand" to="/">
            <span className="brand-icon">
              <BookOpen size={17} />
            </span>
            <span>
              open<span className="brand-light">shelf</span>
            </span>
          </Link>
          <span>A little more curious, every day.</span>
          <span>© 2026 Open Shelf Library</span>
        </footer>
      </div>
    </BrowserRouter>
  );
}
function SearchBox({ initial = "" }) {
  const [text, setText] = useState(initial),
    nav = useNavigate();
  return (
    <form
      className="search-box"
      onSubmit={(e) => {
        e.preventDefault();
        nav(`/catalog?q=${encodeURIComponent(text)}`);
      }}
    >
      <Search size={18} />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={tr("Search books, authors, subjects…")}
        aria-label="Search books"
      />
      <button className="button button-small">
        {tr("Find a book")} <ArrowRight size={14} />
      </button>
    </form>
  );
}
function Home({ user }) {
  const [sections, setSections] = useState({});
  useEffect(() => {
    Promise.all([
      api("/books?sort=popular&limit=5"),
      api("/books?sort=newest&limit=5"),
      api("/books?sort=read&limit=5"),
    ])
      .then(([popular, newest, read]) =>
        setSections({
          popular: popular.books,
          newest: newest.books,
          read: read.books,
        }),
      )
      .catch(() => {});
  }, []);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />{" "}
            {tr("YOUR NEXT CHAPTER STARTS HERE")}
          </div>
          <h1>
            {tr("Ideas worth")}
            <br />
            <em>{tr("getting lost in.")}</em>
          </h1>
          <p>
            {tr(
              "A thoughtful collection of books for every curious mind. Find something new, or share something you love.",
            )}
          </p>
          <SearchBox />
          <div className="hero-meta">
            <span>
              <BookOpen size={15} />
              {tr("A growing, shared collection")}
            </span>
            <span>
              <ShieldCheck size={15} />
              {tr("Reader-powered & thoughtfully curated")}
            </span>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-circle" />
          <div className="book-stack stack-one">
            <b>
              THE
              <br />
              CREATIVE
              <br />
              ACT
            </b>
            <small>RICK RUBIN</small>
          </div>
          <div className="book-stack stack-two">
            <b>
              A BRIEF
              <br />
              HISTORY OF
              <br />
              TIME
            </b>
            <small>STEPHEN HAWKING</small>
          </div>
          <div className="book-stack stack-three">
            <b>
              DESIGNING
              <br />
              DATA-INTENSIVE
              <br />
              APPLICATIONS
            </b>
            <small>MARTIN KLEPPMANN</small>
          </div>
          <div className="art-sparkle">✳</div>
          <div className="art-note">
            A world of
            <br />
            ideas awaits <ArrowRight size={14} />
          </div>
        </div>
      </section>
      <section className="intro-row">
        <div>
          <span className="eyebrow muted">
            {tr("A LIBRARY THAT GROWS WITH YOU")}
          </span>
          <h2>
            {user
              ? `Welcome back, ${user.name.split(" ")[0]}.`
              : tr("Good books have a way of finding you.")}
          </h2>
        </div>
        <p>
          {tr(
            "Discover a fresh perspective, revisit a favorite, or help another reader find their next great read.",
          )}
        </p>
      </section>
      <BookSection
        title={tr("Reader favorites")}
        subtitle={tr("The books people keep coming back to.")}
        books={sections.popular || []}
        more="/catalog?sort=popular"
      />
      <BookSection
        title={tr("Fresh on the shelves")}
        subtitle={tr("New additions from our community.")}
        books={sections.newest || []}
        more="/catalog?sort=newest"
      />
      <BookSection
        title={tr("Most read")}
        subtitle={tr("Join the conversation around these reads.")}
        books={sections.read || []}
        more="/catalog?sort=read"
      />
      <section className="contribute-band">
        <div className="contribute-mark">
          <Plus size={27} />
        </div>
        <div>
          <span className="eyebrow">{tr("YOUR SHELF, SHARED")}</span>
          <h2>{tr("Have a book worth sharing?")}</h2>
          <p>
            {tr(
              "Help the next reader discover something wonderful. Every contribution is reviewed by our library team.",
            )}
          </p>
        </div>
        <Link to={user ? "/add" : "/register"} className="button">
          {tr("Contribute a book")} <ArrowRight size={16} />
        </Link>
      </section>
    </>
  );
}
function BookSection({ title, subtitle, books = [], more }) {
  return (
    <section className="book-section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <Link to={more} className="text-link">
          See all <ArrowRight size={15} />
        </Link>
      </div>
      {books.length ? (
        <div className="book-grid">
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      ) : (
        <div className="empty-inline">
          <BookOpen size={21} />
          <span>
            New discoveries are on their way. Be the first to contribute a book.
          </span>
          <Link to="/add">
            Add a book <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </section>
  );
}
function BookCard({ book }) {
  return (
    <Link to={`/book/${book.id}`} className="book-card">
      <Cover book={book} />
      <div className="card-info">
        <span className="card-category">{book.category || "FEATURED"}</span>
        <strong>{book.title}</strong>
        <span className="card-author">{book.author}</span>
        {book.recommendationReason && (
          <small className="recommendation-reason">
            {book.recommendationReason}
          </small>
        )}
        <div className="card-stats">
          <span>
            <Download size={13} />
            {book.downloadCount || 0}
          </span>
          <span>
            <BookOpen size={13} />
            {book.readCount || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
function Catalog() {
  const [params, setParams] = useSearchParams(),
    [books, setBooks] = useState([]),
    [total, setTotal] = useState(0),
    [categories, setCategories] = useState([]),
    [error, setError] = useState("");
  const q = params.get("q") || "",
    sort = params.get("sort") || "newest",
    cat = params.get("category") || "",
    language = params.get("language") || "";
  useEffect(() => {
    api("/categories").then((x) => setCategories(x.categories));
  }, []);
  useEffect(() => {
    setError("");
    api(
      `/books?q=${encodeURIComponent(q)}&sort=${sort}&category=${cat}&language=${encodeURIComponent(language)}&page=${params.get("page") || 1}`,
    )
      .then((x) => {
        setBooks(x.books);
        setTotal(x.total);
      })
      .catch((e) => setError(e.message));
  }, [q, sort, cat, language, params.get("page")]);
  const change = (key, value) => {
    const p = new URLSearchParams(params);
    value ? p.set(key, value) : p.delete(key);
    p.delete("page");
    setParams(p);
  };
  return (
    <div className="page-wrap">
      <div className="page-title-row">
        <div>
          <span className="eyebrow muted">{tr("THE COLLECTION")}</span>
          <h1>{tr("Explore the shelves.")}</h1>
          <p>{tr("Thoughtful reads, shared by curious minds.")}</p>
        </div>
        <Link to="/add" className="button">
          <Plus size={16} /> {tr("Share a book")}
        </Link>
      </div>
      <div className="catalog-search">
        <SearchBox initial={q} />
      </div>
      <div className="filter-row">
        <div className="filter-label">{tr("BROWSE BY")}</div>
        <select
          aria-label="Category"
          value={cat}
          onChange={(e) => change("category", e.target.value)}
        >
          <option value="">{tr("All categories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {tr(c.name)}
            </option>
          ))}
        </select>
        <select
          aria-label="Language"
          value={language}
          onChange={(e) => change("language", e.target.value)}
        >
          <option value="">{tr("All languages")}</option>
          {LANGUAGES.map((x) => (
            <option key={x} value={x}>
              {tr(x)}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort books"
          value={sort}
          onChange={(e) => change("sort", e.target.value)}
        >
          <option value="newest">{tr("Recently added")}</option>
          <option value="popular">{tr("Most downloaded")}</option>
          <option value="read">{tr("Most read")}</option>
          <option value="oldest">{tr("Oldest first")}</option>
          <option value="alpha">{tr("A to Z")}</option>
        </select>
        <span className="result-count">
          {total} {total === 1 ? "book" : "books"}
        </span>
      </div>
      {error ? (
        <p className="error-box">{error}</p>
      ) : books.length ? (
        <div className="book-grid catalog-grid">
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">
            <Search size={22} />
          </span>
          <h2>{tr("No books found yet")}</h2>
          <p>
            {tr(
              "Try changing your search, or help our collection grow by sharing a book.",
            )}
          </p>
          <Link className="button" to="/add">
            Contribute a book <ArrowRight size={15} />
          </Link>
        </div>
      )}
      {total > 12 && (
        <div className="pagination">
          <button
            disabled={(Number(params.get("page")) || 1) <= 1}
            onClick={() =>
              change("page", String((Number(params.get("page")) || 1) - 1))
            }
          >
            {tr("Previous")}
          </button>
          <span>
            {tr("Page")} {params.get("page") || 1}
          </span>
          <button
            disabled={(Number(params.get("page")) || 1) * 12 >= total}
            onClick={() =>
              change("page", String((Number(params.get("page")) || 1) + 1))
            }
          >
            {tr("Next")}
          </button>
        </div>
      )}
    </div>
  );
}
function BookPage({ user }) {
  const { id } = useParams(),
    [book, setBook] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [liked, setLiked] = useState(false),
    [saved, setSaved] = useState(false),
    [myDownloadCount, setMyDownloadCount] = useState(0);
  useEffect(() => {
    api(`/books/${id}`)
      .then((x) => setBook(x.book))
      .catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => {
    setLiked(false);
    setSaved(false);
    setMyDownloadCount(0);
    if (user)
      api(`/books/${id}/user-state`)
        .then((x) => {
          setLiked(x.liked);
          setSaved(x.saved);
          setMyDownloadCount(x.downloadCount);
        })
        .catch(() => {});
  }, [id, user]);
  const action = async (kind, formatIndex) => {
    try {
      if (kind === "read") {
        if (!user) return (location.href = "/login");
        location.href = `/read/${id}`;
        return;
      }
      if (kind === "external") {
        if (!user) {
          location.href = "/login";
          return;
        }
        const popup = window.open("about:blank", "_blank");
        try {
          const result = await api(`/books/${id}/download`, {
            method: "POST",
            body: JSON.stringify({ formatIndex }),
          });
          setMyDownloadCount((value) => value + 1);
          if (popup) popup.location.href = result.externalUrl;
          else location.href = result.externalUrl;
        } catch (e) {
          popup?.close();
          throw e;
        }
        return;
      }
      if (kind === "save") {
        const result = await api(`/books/${id}/list`, {
          method: "POST",
          body: "{}",
        });
        setSaved(result.saved);
        setNotice(
          result.saved
            ? "Saved to your reading list."
            : "Removed from your reading list.",
        );
        return;
      }
      if (kind === "like") {
        const result = await api(`/books/${id}/like`, {
          method: "POST",
          body: "{}",
        });
        setLiked(result.liked);
        setNotice(
          result.liked
            ? "Added to your favorites."
            : "Removed from your favorites.",
        );
        return;
      }
      const response = await api(`/books/${id}/download`, {
        method: "POST",
        body: "{}",
      });
      setMyDownloadCount((value) => value + 1);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setNotice(e.message);
    }
  };
  if (error)
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <AlertCircle />
          <h2>{error}</h2>
          <Link to="/catalog" className="button">
            Back to the collection
          </Link>
        </div>
      </div>
    );
  if (!book)
    return (
      <div className="page-wrap">
        <div className="loading-line" />
      </div>
    );
  const rtl = ["Pashto", "Dari (Persian)", "Persian", "Dari", "Arabic", "Urdu"].includes(
      book.language,
    ),
    subjects = Array.isArray(book.subjects) ? book.subjects : [],
    formats = Array.isArray(book.externalFormats) ? book.externalFormats : [];
  const updated = book.sourceLastUpdated
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(book.sourceLastUpdated),
      )
    : null;
  return (
    <div className="page-wrap detail-wrap">
      <Link to="/catalog" className="back-link">
        <ChevronLeft size={15} /> Back to the collection
      </Link>
      <div className="detail-layout">
        <Cover book={book} large />
        <div className="detail-copy" dir={rtl ? "rtl" : "ltr"}>
          <span className="eyebrow muted">
            {book.category || "OPEN SHELF"}
            {book.sourceEbookId && ` · EBOOK #${book.sourceEbookId}`}
          </span>
          <h1>{book.title}</h1>
          {book.subtitle && <h2>{book.subtitle}</h2>}
          <p className="detail-author">
            by <strong>{book.author}</strong>
          </p>
          <p className="detail-description">
            {book.description || "A new addition to the Open Shelf collection."}
          </p>
          <div className="detail-meta">
            {book.language && (
              <span>
                Language <b>{book.language}</b>
              </span>
            )}
            {book.publicationYear && (
              <span>
                First published <b>{book.publicationYear}</b>
              </span>
            )}
            {book.publisher && (
              <span>
                Publisher <b>{book.publisher}</b>
              </span>
            )}
            {book.isbn && (
              <span>
                ISBN <b>{book.isbn}</b>
              </span>
            )}
            {book.readingLevel && (
              <span>
                Reading level <b>{book.readingLevel}</b>
              </span>
            )}
            {book.fileType && (
              <span>
                Format <b>{book.fileType.toUpperCase()}</b>
              </span>
            )}
            {book.fileSize && (
              <span>
                File size <b>{formatBytes(book.fileSize)}</b>
              </span>
            )}
            {updated && (
              <span>
                Source updated <b>{updated}</b>
              </span>
            )}
          </div>
          <div className="detail-stats">
            <span>
              <Download size={16} />
              {book.downloadCount} distinct Open Shelf downloads
            </span>
            <span>
              <BookOpen size={16} />
              {book.readCount} reads
            </span>
          </div>
          {myDownloadCount > 0 && (
            <p className="personal-download-count">
              You downloaded this book {myDownloadCount}{" "}
              {myDownloadCount === 1 ? "time" : "times"}.
            </p>
          )}
          <div className="detail-actions">
            {book.onlineReadUrl ? (
              <a
                className="button"
                href={book.onlineReadUrl}
                target="_blank"
                rel="noreferrer"
              >
                <BookOpen size={16} /> Read online <ArrowRight size={14} />
              </a>
            ) : (
              book.fileKey && (
                <button className="button" onClick={() => action("read")}>
                  <BookOpen size={16} /> Read online
                </button>
              )
            )}
            {book.fileKey && (
              <button
                className="button button-outline"
                onClick={() => action("download")}
              >
                <Download size={16} /> Download PDF
              </button>
            )}
            {user && (
              <>
                <button
                  className={`icon-button bordered state-icon ${saved ? "is-active" : ""}`}
                  onClick={() => action("save")}
                  title={
                    saved ? "Remove from reading list" : "Save to reading list"
                  }
                  aria-label={
                    saved ? "Remove from reading list" : "Save to reading list"
                  }
                  aria-pressed={saved}
                >
                  <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
                </button>
                <button
                  className={`icon-button bordered state-icon ${liked ? "is-active" : ""}`}
                  onClick={() => action("like")}
                  title={liked ? "Remove from favorites" : "Add to favorites"}
                  aria-label={
                    liked ? "Remove from favorites" : "Add to favorites"
                  }
                  aria-pressed={liked}
                >
                  <Heart size={17} fill={liked ? "currentColor" : "none"} />
                </button>
              </>
            )}
          </div>
          {notice && (
            <p className="notice">
              <Check size={15} />
              {notice}
            </p>
          )}
        </div>
      </div>
      {subjects.length > 0 && (
        <section className="book-facts">
          <h2>Subjects</h2>
          <div className="subject-tags">
            {subjects.map((subject) => (
              <span key={subject}>{subject}</span>
            ))}
          </div>
        </section>
      )}
      {formats.length > 0 && (
        <section className="download-panel">
          <div className="section-heading">
            <div>
              <h2>Download for free</h2>
              <p>
                {book.sourceName
                  ? `Files are hosted by ${book.sourceName}. Downloads open on their site.`
                  : "Available formats"}
              </p>
            </div>
          </div>
          <div className="format-list">
            {formats.map((file, index) => (
              <button
                type="button"
                className="format-row"
                onClick={() => action("external", index)}
                key={file.format + file.label}
              >
                <span className="format-icon">
                  <FileText size={18} />
                </span>
                <span className="format-copy">
                  <strong>{file.label}</strong>
                  <small>
                    {file.format}
                    {file.recommended ? " · Recommended" : ""}
                  </small>
                </span>
                <span className="format-size">{file.size}</span>
                <Download size={16} />
              </button>
            ))}
          </div>
        </section>
      )}
      {(book.license || book.attribution || book.sourceUrl) && (
        <section className="book-facts source-facts">
          <h2>About this edition</h2>
          <div className="source-info-grid">
            {book.sourceName && (
              <span>
                Source<b>{book.sourceName}</b>
              </span>
            )}
            {book.license && (
              <span>
                Rights and license<b>{book.license}</b>
              </span>
            )}
            {book.attribution && (
              <span>
                Credits<b>{book.attribution}</b>
              </span>
            )}
            {book.sourceUrl && (
              <span>
                Original record
                <a href={book.sourceUrl} target="_blank" rel="noreferrer">
                  View on {book.sourceName || "source site"}{" "}
                  <ArrowRight size={13} />
                </a>
              </span>
            )}
          </div>
        </section>
      )}
      <BookRecommendations id={id} />
      <BookRatings id={id} user={user} />
    </div>
  );
}
function BookRatings({ id, user }) {
  const [data, setData] = useState({ ratings: [], average: 0, count: 0 }),
    [message, setMessage] = useState("");
  const load = () =>
    api(`/books/${id}/ratings`)
      .then(setData)
      .catch(() => {});
  useEffect(() => {
    load();
  }, [id]);
  const submit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(e.currentTarget);
    try {
      await api(`/books/${id}/ratings`, {
        method: "POST",
        body: JSON.stringify({
          rating: Number(f.get("rating")),
          review: f.get("review"),
        }),
      });
      setMessage("Your rating was submitted for review.");
      form.reset();
    } catch (e) {
      setMessage(e.message);
    }
  };
  return (
    <section className="book-facts">
      <h2>
        Reader reviews {data.count > 0 && `· ${data.average}/5 (${data.count})`}
      </h2>
      {data.ratings.map((row, index) => (
        <article className="reader-review" key={`${row.name}-${index}`}>
          <strong>
            {row.name} · {row.rating}/5
          </strong>
          {row.review && <p>{row.review}</p>}
        </article>
      ))}
      {user ? (
        <form className="form rating-form" onSubmit={submit}>
          <label>
            Your rating
            <select name="rating" defaultValue="5">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
          </label>
          <label>
            Review (optional)
            <textarea name="review" maxLength="2000" rows="3" />
          </label>
          <button className="button">Submit rating</button>
          {message && <p className="notice">{message}</p>}
        </form>
      ) : (
        <p>Sign in to leave a rating.</p>
      )}
    </section>
  );
}
function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
function BookRecommendations({ id }) {
  const [books, setBooks] = useState([]);
  useEffect(() => {
    api(`/books/${id}/recommendations`)
      .then((x) => setBooks(x.books))
      .catch(() => {});
  }, [id]);
  return books.length ? (
    <BookSection
      title="You might also like"
      subtitle="More to explore from this shelf."
      books={books}
    />
  ) : null;
}
function Auth({ mode, onUser }) {
  const nav = useNavigate(),
    [searchParams] = useSearchParams(),
    login = mode === "login",
    [error, setError] = useState(() => {
      const code = searchParams.get("oauth_error");
      return code
        ? code === "not_configured"
          ? "Google sign-in needs OAuth credentials in the server environment."
          : code === "google_unreachable"
            ? "The server cannot reach Google. Check its internet connection or firewall, then try again."
          : "Google sign-in could not be completed. Please try again."
        : "";
    }),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const x = await api(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({
          email: f.get("email"),
          password: f.get("password"),
          ...(login ? {} : { name: f.get("name") }),
        }),
      });
      onUser(x.user);
      nav("/");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <span className="eyebrow muted">
          {login ? "WELCOME BACK" : "BECOME A READER"}
        </span>
        <h1>
          {tr(login ? "Good to see you again." : "Make room for a new idea.")}
        </h1>
        <p>
          {tr(
            login
              ? "Sign in to pick up where you left off."
              : "Join a community that believes good books are better shared.",
          )}
        </p>
        {Capacitor.isNativePlatform() ? (
          <p className="form-note">{tr("Google sign-in needs native app setup before it can be used here.")}</p>
        ) : (
          <>
            <a className="button button-google" href={`${API_BASE}/auth/google`}>
              <span className="google-mark">G</span>
              {tr("Continue with Google")}
            </a>
            <div className="auth-divider">
              <span>{tr("or")}</span>
            </div>
          </>
        )}
        <form className="form" onSubmit={submit}>
          {!login && (
            <label>
              {tr("Your name")}
              <input required name="name" autoComplete="name" />
            </label>
          )}
          <label>
            {tr("Email address")}
            <input required name="email" type="email" autoComplete="email" />
          </label>
          <label>
            {tr("Password")}
            <input
              required
              name="password"
              type="password"
              minLength="10"
              autoComplete={login ? "current-password" : "new-password"}
            />
            <small>{tr("At least 10 characters.")}</small>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-full" disabled={busy}>
            {busy
              ? tr("Loading…")
              : tr(
                  login ? "Log in to your account" : "Create your account",
                )}{" "}
            <ArrowRight size={15} />
          </button>
        </form>
        <p className="auth-switch">
          {tr(login ? "New to Open Shelf?" : "Already have an account?")}{" "}
          <Link to={login ? "/register" : "/login"}>
            {tr(login ? "Join the library" : "Log in")}
          </Link>
        </p>
      </div>
    </div>
  );
}
function AddBook() {
  const navigate = useNavigate();
  const [err, setErr] = useState(""),
    [categories, setCats] = useState([]);
  useEffect(() => {
    api("/categories")
      .then((x) => setCats(x.categories))
      .catch(() => {});
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const data = new FormData(e.currentTarget);
    const file = data.get("file");
    if (file instanceof File && file.size > 50 * 1024 * 1024) {
      setErr(tr("The PDF must be 50 MB or smaller."));
      return;
    }
    try {
      await api("/contributions", { method: "POST", body: data });
      navigate("/dashboard?tab=my-books&submitted=1");
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <div className="page-wrap form-page">
      <div className="form-heading">
        <span className="eyebrow muted">{tr("A BOOK TO SHARE")}</span>
        <h1>
          {tr("Give a good book")}
          <br />
          <em>{tr("a new reader.")}</em>
        </h1>
        <p>{tr("Books appear in the catalog right away. Admins can reject them later.")}</p>
      </div>
      <form
        className="form contribution-form"
        onSubmit={submit}
        encType="multipart/form-data"
      >
        <div className="form-columns">
          <label>
            {tr("Book title *")}
            <input required name="title" maxLength="250" />
          </label>
          <label>
            {tr("Author *")}
            <input required name="author" maxLength="250" />
          </label>
          <label>
            {tr("Category *")}
            <select name="categoryId" required defaultValue="">
              <option value="" disabled>
                {tr("Choose a category")}
              </option>
              {categories.map((c) => (
                <option value={c.id} key={c.id}>
                  {tr(c.name)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {tr("Language")}
            <select name="language" defaultValue="English">
              {LANGUAGES.map((x) => (
                <option key={x} value={x}>
                  {tr(x)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          {tr("License or permission information *")}
          <textarea
            name="license"
            rows="3"
            required
            placeholder={tr(
              "Tell us why this book can be shared in our library.",
            )}
          />
        </label>
        <label className="file-label">
          <FileText size={18} />
          {tr("PDF book file *")}
          <input
            required
            type="file"
            name="file"
            accept="application/pdf,.pdf"
          />
          <small>{tr("PDF only, up to 50 MB.")}</small>
        </label>
        {err && <p className="form-error">{err}</p>}
        <button className="button">
          {tr("Publish book")} <ArrowRight size={15} />
        </button>
      </form>
    </div>
  );
}
function Profile({ user, onUpdate, language, setLanguage, theme, setTheme }) {
  const [name, setName] = useState(user?.name || ""),
    [notifyReviews, setNotifyReviews] = useState(
      user?.notifyContributionReviews ?? true,
    ),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setName(user?.name || "");
    setNotifyReviews(user?.notifyContributionReviews ?? true);
  }, [user?.name, user?.notifyContributionReviews]);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await api("/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          preferredLanguage: language,
          theme,
          notifyContributionReviews: notifyReviews,
        }),
      });
      onUpdate(result.user);
      setMessage(tr("Saved profile settings."));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!user)
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <UserRound />
          <h2>Sign in to edit your profile</h2>
          <Link className="button" to="/login">
            {tr("Log in")}
          </Link>
        </div>
      </div>
    );
  return (
    <div className="page-wrap profile-page">
      <div className="page-title-row">
        <div>
          <span className="eyebrow muted">{tr("PROFILE")}</span>
          <h1>{tr("Profile settings")}</h1>
          <p>{tr("Change your name, language, and appearance.")}</p>
        </div>
        <Link to="/dashboard" className="text-link">
          {tr("My library")} <ArrowRight size={14} />
        </Link>
      </div>
      <form className="form profile-form" onSubmit={submit}>
        <label>
          {tr("Display name")}
          <input
            required
            name="name"
            maxLength="100"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          {tr("System language")}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {UI_LANGUAGES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="notification-preference">
          <input
            type="checkbox"
            checked={notifyReviews}
            onChange={(event) => setNotifyReviews(event.target.checked)}
          />
          <span>
            <strong>{tr("Contribution review updates")}</strong>
            <small>
              {tr("Tell me when an admin reviews a book I submitted.")}
            </small>
          </span>
        </label>
        <fieldset className="theme-choice">
          <legend>{tr("Appearance")}</legend>
          <button
            type="button"
            className={
              theme === "light" ? "theme-option selected" : "theme-option"
            }
            aria-pressed={theme === "light"}
            onClick={() => setTheme("light")}
          >
            <span className="theme-option-icon">
              <Sun size={19} />
            </span>
            <span className="theme-option-copy">
              <strong>{tr("Light mode")}</strong>
              <small>{tr("A bright look for daytime reading.")}</small>
            </span>
            {theme === "light" && <Check className="theme-check" size={17} />}
          </button>
          <button
            type="button"
            className={
              theme === "dark" ? "theme-option selected" : "theme-option"
            }
            aria-pressed={theme === "dark"}
            onClick={() => setTheme("dark")}
          >
            <span className="theme-option-icon">
              <Moon size={19} />
            </span>
            <span className="theme-option-copy">
              <strong>{tr("Dark mode")}</strong>
              <small>{tr("A softer look for low-light reading.")}</small>
            </span>
            {theme === "dark" && <Check className="theme-check" size={17} />}
          </button>
        </fieldset>
        {error && <p className="form-error">{error}</p>}
        {message && (
          <p className="notice">
            <Check size={15} />
            {message}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? tr("Saving…") : tr("Save profile")} <Check size={15} />
        </button>
      </form>
    </div>
  );
}
function Dashboard() {
  const [searchParams] = useSearchParams();
  const [credits, setCredits] = useState(null),
    [books, setBooks] = useState([]),
    [reading, setReading] = useState([]),
    [downloads, setDownloads] = useState([]),
    [saved, setSaved] = useState([]),
    [liked, setLiked] = useState([]),
    [tab, setTab] = useState(() =>
      searchParams.get("tab") === "my-books" ? "my-books" : "overview",
    );
  useEffect(() => {
    Promise.all([
      api("/me/credits"),
      api("/me/books"),
      api("/me/reading"),
      api("/me/downloads"),
      api("/me/list"),
      api("/me/likes"),
    ])
      .then(([c, b, r, d, s, l]) => {
        setCredits(c.credits);
        setBooks(b.books);
        setReading(r.reading);
        setDownloads(d.downloads);
        setSaved(s.books);
        setLiked(l.books);
      })
      .catch(() => {});
  }, []);
  return (
    <div className="page-wrap dashboard">
      <div className="page-title-row">
        <div>
          <span className="eyebrow muted">{tr("YOUR PERSONAL LIBRARY")}</span>
          <h1>{tr("My library.")}</h1>
          <p>{tr("Your books, your discoveries, all in one place.")}</p>
        </div>
        <Link to="/add" className="button">
          <Plus size={16} /> Add a book
        </Link>
      </div>
      <div className="dashboard-tabs">
        {[
          "overview",
          "downloads",
          "my-books",
          "reading",
          "saved",
          "liked",
          "credits",
          "notifications",
        ].map((x) => (
          <button
            className={tab === x ? "tab-active" : ""}
            onClick={() => setTab(x)}
            key={x}
          >
            {tr(
              x === "my-books" ? "My books" : x[0].toUpperCase() + x.slice(1),
            )}
          </button>
        ))}
      </div>
      {tab === "overview" && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span>FREE DOWNLOADS USED</span>
              <strong>
                {credits ? `${credits.freeUsed}/${credits.freeAllowance}` : "—"}
              </strong>
              <small>Your first downloads are on us.</small>
            </div>
            <div className="stat-card">
              <span>APPROVED CONTRIBUTIONS</span>
              <strong>{credits?.approvedContributions ?? "—"}</strong>
              <small>Thanks for growing our shelves.</small>
            </div>
            <div className="stat-card">
              <span>DOWNLOADS LEFT</span>
              <strong>{credits?.remaining ?? "—"}</strong>
              <small>
                {credits?.remaining === 0
                  ? tr("Publish three books to unlock 10 more downloads.")
                  : "Enjoy your next good read."}
              </small>
            </div>
          </div>
          <h2 className="dashboard-heading">
            {tr("Pick up where you left off")}
          </h2>
          {reading.length ? (
            <div className="book-grid">
              {reading.map((x) => (
                <BookCard key={x.book.id} book={x.book} />
              ))}
            </div>
          ) : (
            <div className="empty-inline">
              <Clock3 size={20} />
              <span>Your reading journey will show up here.</span>
              <Link to="/catalog">
                Explore books <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </>
      )}
      {tab === "downloads" && (
        <div className="download-history">
          {downloads.length ? (
            downloads.map(({ book, download }) => (
              <Link
                to={`/book/${book.id}`}
                className="download-history-row"
                key={book.id}
              >
                <Cover book={book} />
                <span className="download-history-info">
                  <strong>{book.title}</strong>
                  <small>{book.author}</small>
                  <small>
                    Downloaded {download.downloadCount}{" "}
                    {download.downloadCount === 1 ? "time" : "times"} · Last:{" "}
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(download.lastDownloadedAt))}
                  </small>
                </span>
                <ArrowRight size={17} />
              </Link>
            ))
          ) : (
            <div className="empty-state">
              <Download />
              <h2>No downloads yet</h2>
              <p>
                Books you download will appear here, with your download count
                and latest date.
              </p>
              <Link to="/catalog" className="button">
                Explore books
              </Link>
            </div>
          )}
        </div>
      )}
      {tab === "my-books" && (
        <>
        {searchParams.get("submitted") === "1" && (
          <div className="success-banner">
            <Check size={18} />
            <div>
              <strong>{tr("Book published")}</strong>
              <span>{tr("Your book is now live in the public catalog.")}</span>
            </div>
          </div>
        )}
        <div className="submission-list">
          {books.length ? (
            books.map(({ book, contribution: c }) => (
              <div className="submission-row" key={book.id}>
                <Cover book={book} />
                <div>
                  <strong>{book.title}</strong>
                  <span>{book.author}</span>
                  <small>
                    {c.reviewNote || tr("Submitted to the review team")}
                  </small>
                </div>
                <span className={`status status-${c.status}`}>
                  {tr(c.status)}
                </span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <BookOpen />
              <h2>No contributions yet</h2>
              <p>Share a book and help another reader.</p>
              <Link className="button" to="/add">
                Contribute a book
              </Link>
            </div>
          )}
        </div>
        </>
      )}
      {tab === "reading" && (
        <div className="book-grid">
          {reading.map((x) => (
            <BookCard key={x.book.id} book={x.book} />
          ))}
        </div>
      )}
      {tab === "saved" && (
        <div className="book-grid">
          {saved.map((row) => (
            <BookCard key={row.book.id} book={row.book} />
          ))}
          {!saved.length && (
            <p className="empty-inline">Your reading list is empty.</p>
          )}
        </div>
      )}
      {tab === "liked" && (
        <div className="book-grid">
          {liked.map((row) => (
            <BookCard key={row.book.id} book={row.book} />
          ))}
          {!liked.length && (
            <p className="empty-inline">
              You have not favorited any books yet.
            </p>
          )}
        </div>
      )}
      {tab === "credits" && (
        <div className="credits-panel">
          <div className="credits-number">{credits?.remaining ?? 0}</div>
          <div>
            <h2>
              {credits?.remaining === 0
                ? "Your next download starts with a contribution."
                : "You have room for another good read."}
            </h2>
            <p>
              {tr("Every three published books unlock 10 more downloads. Daily limit: 10 downloads; it resets tomorrow. Repeat downloads also count toward the daily limit.")}
            </p>
            <Link to="/add" className="button">
              Contribute a book <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}
      {tab === "notifications" && <NotificationsPanel />}
    </div>
  );
}
function NotificationsPanel() {
  const [rows, setRows] = useState([]),
    [error, setError] = useState("");
  const load = () =>
    api("/me/notifications")
      .then((x) => setRows(x.notifications))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const mark = async (id) => {
    try {
      await api(`/me/notifications/${id}/read`, { method: "PATCH" });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const readAll = async () => {
    try {
      await api("/me/notifications/read-all", {
        method: "POST",
        body: JSON.stringify({}),
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <div className="notification-list">
      <button className="button button-outline button-small" onClick={readAll}>
        {tr("Mark all read")}
      </button>
      {error && <p className="form-error">{error}</p>}
      {rows.map((row) => (
        <article
          className={`notification-row ${row.readAt ? "" : "notification-unread"}`}
          key={row.id}
        >
          <strong>{row.title}</strong>
          <p>{row.message}</p>
          <small>{new Date(row.createdAt).toLocaleString()}</small>
          {!row.readAt && (
            <button
              className="button button-small"
              onClick={() => mark(row.id)}
            >
              Mark read
            </button>
          )}
        </article>
      ))}
      {!rows.length && !error && (
        <p className="empty-inline">{tr("No notifications yet.")}</p>
      )}
    </div>
  );
}
function Reader({ user }) {
  const { id } = useParams(),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(null),
    [zoom, setZoom] = useState(100),
    [ready, setReady] = useState(false),
    [bookmarks, setBookmarks] = useState([]);
  const loadBookmarks = () =>
    api(`/books/${id}/bookmarks`)
      .then((x) => setBookmarks(x.bookmarks))
      .catch(() => {});
  useEffect(() => {
    if (user) loadBookmarks();
  }, [id, user]);
  const toggleBookmark = async () => {
    const existing = bookmarks.find((item) => item.page === page);
    try {
      if (existing)
        await api(`/books/${id}/bookmarks/${existing.id}`, {
          method: "DELETE",
        });
      else
        await api(`/books/${id}/bookmarks`, {
          method: "POST",
          body: JSON.stringify({ page, label: `Page ${page}` }),
        });
      loadBookmarks();
    } catch {}
  };
  useEffect(() => {
    if (!user) {
      location.href = "/login";
      return;
    }
    api(`/books/${id}/progress`)
      .then((x) => {
        if (x.progress) {
          setPage(x.progress.page);
          setTotal(x.progress.totalPages);
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [id, user]);
  useEffect(() => {
    if (!ready || !user) return;
    let timer = setTimeout(
      () =>
        api(`/books/${id}/progress`, {
          method: "PUT",
          body: JSON.stringify({ page, totalPages: total || undefined }),
        }).catch(() => {}),
      700,
    );
    return () => clearTimeout(timer);
  }, [id, page, total, user, ready]);
  return (
    <div className="reader-page">
      <div className="reader-toolbar">
        <Link to={`/book/${id}`} className="back-link">
          <ChevronLeft size={16} /> Book details
        </Link>
        <span>
          <BookOpen size={16} /> Online reading
        </span>
        <div>
          <label>
            Page{" "}
            <input
              aria-label="Current page"
              type="number"
              min="1"
              value={page}
              onChange={(e) => setPage(Math.max(1, Number(e.target.value)))}
            />
            {total ? ` / ${total}` : ""}
          </label>
          <button
            className="icon-button"
            aria-label="Zoom out"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
          >
            −
          </button>
          <span>{zoom}%</span>
          <button
            className="icon-button"
            aria-label="Zoom in"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
          >
            +
          </button>
          <button
            className="icon-button"
            onClick={() =>
              document.querySelector(".pdf-viewer")?.requestFullscreen?.()
            }
          >
            Fullscreen
          </button>
          <button
            className="icon-button"
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            −
          </button>
          <button className="icon-button" onClick={() => setPage(page + 1)}>
            +
          </button>
          <button className="button button-small" onClick={toggleBookmark}>
            {bookmarks.some((item) => item.page === page)
              ? "Remove bookmark"
              : "Bookmark page"}
          </button>
        </div>
      </div>
      <iframe
        className="pdf-viewer"
        src={`${API_BASE}/books/${id}/read#page=${page}&zoom=${zoom}`}
        title="PDF book reader"
        onLoad={() => {}}
      />
      <div className="reader-tip">
        <p>
          Your reading position is saved as you go. Use the PDF controls to
          navigate, zoom, or view full screen.
        </p>
        {bookmarks.length > 0 && (
          <div className="reader-bookmarks">
            <strong>Bookmarks</strong>
            {bookmarks.map((item) => (
              <button
                className="button button-outline button-small"
                key={item.id}
                onClick={() => setPage(item.page)}
              >
                Page {item.page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);

if (import.meta.env.PROD && !Capacitor.isNativePlatform() && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}
