import { z } from 'zod';

const ConfigSchema = z.object({
  entry: z.string().or(z.record(z.string(), z.string())),
  output: z.object({
    path: z.string(),
    filename: z.string(),
  }),
  resolve: z
    .object({
      extensions: z.array(z.string()).default(['.ts', '.js']),
      alias: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  mode: z.enum(['development', 'production']).default('development'),
});

export type UserConfig = z.infer<typeof ConfigSchema>;
export { ConfigSchema };