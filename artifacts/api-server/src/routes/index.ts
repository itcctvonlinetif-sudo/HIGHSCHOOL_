import { Router, type IRouter } from "express";
import healthRouter from "./health";
import menusRouter from "./menus";
import pagesRouter from "./pages";
import newsRouter from "./news";
import eventsRouter from "./events";
import galleryRouter from "./gallery";
import cctvRouter from "./cctv";
import settingsRouter from "./settings";
import layananRouter from "./layanan";
import adminRouter from "./admin";
import contactRouter from "./contact";
import homepageRouter from "./homepage";
import storageRouter from "./storage";
import storageConfigRouter from "./storageConfig";

const router: IRouter = Router();

router.use(healthRouter);
router.use(menusRouter);
router.use(pagesRouter);
router.use(newsRouter);
router.use(eventsRouter);
router.use(galleryRouter);
router.use(cctvRouter);
router.use(settingsRouter);
router.use(layananRouter);
router.use(adminRouter);
router.use(contactRouter);
router.use(homepageRouter);
router.use(storageRouter);
router.use(storageConfigRouter);

export default router;
