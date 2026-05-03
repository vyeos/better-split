import { t, UnwrapSchema } from "elysia";

export const PaymentsModel = {};

export type PaymentsModel = {
  [k in keyof typeof PaymentsModel]: UnwrapSchema<(typeof PaymentsModel)[k]>;
};
