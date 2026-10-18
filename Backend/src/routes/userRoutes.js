import { Router } from "express";
import {
  createUser,
  getUserById,
  replaceUser,
  patchUser,
  listUsers,
} from "../controllers/userController.js";
import {
  createUserSchema,
  replaceUserSchema,
  patchUserSchema,
  paginationSchema,
} from "../validators/userValidator.js";
import { validateBody, validateQuery } from "../middleware/validate.js";

const router = Router();

router.post("/", validateBody(createUserSchema), createUser);
router.get("/", validateQuery(paginationSchema), listUsers);
router.get("/:id", getUserById);
router.put("/:id", validateBody(replaceUserSchema), replaceUser);
router.patch("/:id", validateBody(patchUserSchema), patchUser);

export default router;
