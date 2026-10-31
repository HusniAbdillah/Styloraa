import { z } from "zod";

export const decisionIdSchema = z.uuid();

export const saveDecisionSchema = z
  .object({
    option_id: z.uuid(),
    expected_revision: z.number().int().positive(),
  })
  .strict();

export const selectProductsSchema = saveDecisionSchema
  .extend({
    choices: z
      .array(
        z
          .object({
            option_item_id: z.uuid(),
            product_id: z.uuid(),
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .superRefine((value, context) => {
    const ids = value.choices.map((choice) => choice.option_item_id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        path: ["choices"],
        message: "Choose each outfit slot once.",
      });
    }
  });

export const savedLookQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    offset: z.coerce.number().int().min(0).max(10000).default(0),
  })
  .strict();

export const lookDetailQuerySchema = z
  .object({ option_id: z.uuid().optional() })
  .strict();

export type ProductSelectionInput = z.infer<typeof selectProductsSchema>;
export type SaveDecisionInput = z.infer<typeof saveDecisionSchema>;
