import { Router } from "express";
import * as auth from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/signup", auth.signup);
authRouter.post("/signin", auth.signin);
authRouter.post("/refresh", auth.refresh);
authRouter.post("/logout", auth.logout);
authRouter.get("/me", authMiddleware, auth.me);
authRouter.post("/request-reset-password", auth.resetPasswordLink);
authRouter.post("/reset-password", auth.resetPassword);

export default authRouter;
