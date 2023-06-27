import dotenv from "dotenv";
import cors from "cors";
import parser from "body-parser";
import express, { Request } from "express";
import { rateLimit } from "express-rate-limit";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";

import { queueRoles } from "./queue";
import { verifySig } from "./helpers";
import { VerifyRequestDto } from "./types";
import { getCurrentMessage } from "./helpers";
import { code, schemas, validate } from "./middleware";
import { gateway } from "./discord";

dotenv.config();
gateway.connect();

const app = express();
const port = process.env.PORT;
const limiter = rateLimit({
  max: 30,
  windowMs: 60 * 1000,
  legacyHeaders: false,
  standardHeaders: false,
});

// Queue admin dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
createBullBoard({ serverAdapter, queues: [new BullMQAdapter(queueRoles)] });

if (process.env.NODE_ENV === "development") {
  app.use("/admin/queues", serverAdapter.getRouter());
}

app.use(cors());
app.use(limiter);
app.use(parser.json());

app.post(
  "/verify",
  [validate(schemas.verify), code],
  async (req: Request<any, any, VerifyRequestDto>, res: any) => {
    const message = getCurrentMessage();
    const { address, signature, code, provider, publicKey } = req.body;
    if (
      !(await verifySig({ message, address, signature, provider, publicKey }))
    ) {
      return res.status(400).send({
        message: "Invalid signature",
      });
    }

    await queueRoles.add(
      `new`,
      { code, address, type: "new" },
      { priority: 1 }
    );

    res.send();
  }
);

app.get("/message", async (req, res) => {
  res.send(getCurrentMessage());
});

app.listen(port, async () => {
  console.log(`Running on ${port}`);
});
