
// export const createUserSchema = z
//   .strictObject({
//     name: z.string(),
//     email: z.string().email(),
//     password: z.string().min(8),
//     cPassword: z.string().min(8),
//     age: z.number(),
//     roles: z.array(z.string()),
//     status: z.string(),
//     createdAt: z.coerce.date(),
//     updatedAt: z.coerce.date(),
//     deletedAt: z.coerce.date().optional(),
//   })
//   .superRefine(({ password, cPassword }, ctx) => {
//     if (password !== cPassword) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         message: 'Passwords do not match',
//         path: ['cPassword'],
//       });
//     }
//   });

// export const updateUserSchema = z
//   .strictObject({
//     name: z.string().optional(),
//     email: z.string().email().optional(),
//     password: z.string().min(8).optional(),
//     cPassword: z.string().min(8).optional(),
//     age: z.number().optional(),
//     roles: z.array(z.string()).optional(),
//     status: z.string().optional(),
//     createdAt: z.coerce.date().optional(),
//     updatedAt: z.coerce.date().optional(),
//     deletedAt: z.coerce.date().optional(),
//   })
//   .superRefine(({ password, cPassword }, ctx) => {
//     if (password !== cPassword) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         message: 'Passwords do not match',
//         path: ['cPassword'],
//       });
//     }
//   });

// export type UpdateUserDtoType = z.infer<typeof updateUserSchema>;
