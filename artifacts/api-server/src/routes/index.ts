import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tripquoteRouter from "./tripquote";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tripquoteRouter);

export default router;
