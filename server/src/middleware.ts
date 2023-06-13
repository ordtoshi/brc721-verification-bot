import { cache } from "./cache";
import { ObjectSchema, string, object } from "yup";
import { NextFunction, Request, Response } from "express";
import { Network, validate as validateAdd } from "bitcoin-address-validation";

export const code = async (req: Request, res: Response, next: NextFunction) => {
  const code = await cache.get(req.body.code);
  if (!code) return res.status(400).send({ message: "invalid link" });
  req.body.code = code;
  return next();
};

export const schemas = {
  verify: object<any>({
    code: string().required(),
    signature: string().required(),
    address: string()
      .required()
      .test({
        name: "btc-address",
        message: "Invalid address",
        test: (value) => validateAdd(value, Network.mainnet),
      }),
  }).noUnknown(),
};

export const validate =
  (schema: ObjectSchema<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate(req.body, { strict: true });
      return next();
    } catch (err: any) {
      return res
        .status(400)
        .json({ type: err.name, message: err.message, errors: err.errors });
    }
  };
