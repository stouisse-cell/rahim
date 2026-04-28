import { Router, type IRouter } from "express";
import healthRouter from "./health";
import propertiesRouter from "./properties";
import leadsRouter from "./leads";
import adminAuthRouter from "./admin-auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminAuthRouter);
router.use(propertiesRouter);
router.use(leadsRouter);

export default router;
