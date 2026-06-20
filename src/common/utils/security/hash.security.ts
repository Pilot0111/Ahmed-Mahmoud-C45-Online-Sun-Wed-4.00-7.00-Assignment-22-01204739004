import { hashSync, compareSync } from "bcrypt";

export const hashPassword = ({
  plainText,
  salt_rounds = +process.env.SALT_ROUNDS!,
}: {
  plainText: string;
  salt_rounds?: number;
}): string=> hashSync(plainText.toString(), salt_rounds);

export const comparePassword = ({
  PlainText,
  cipherText,
}: {
  PlainText: string;
  cipherText: string;
}): boolean => compareSync(PlainText, cipherText);
