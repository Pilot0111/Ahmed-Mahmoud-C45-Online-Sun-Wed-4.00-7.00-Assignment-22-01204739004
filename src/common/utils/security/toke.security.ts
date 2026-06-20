import { Injectable } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async generateToken({
    payload,
    secret_key,
    options = {},
  }: {
    payload: object | Buffer;
    secret_key: string | undefined;
    options?: JwtSignOptions;
  }): Promise<string> {
    if (!secret_key) {
      throw new Error("Token secret key is required");
    }
    return await this.jwtService.signAsync(payload as object, { secret: secret_key, ...options });
  }

  async verifyToken({
    token,
    secret_key,
  }: {
    token: string;
    secret_key: string | undefined;
  }): Promise<any> {
    if (!secret_key) {
      throw new Error("Token secret key is required");
    }
    return await this.jwtService.verifyAsync(token, { secret: secret_key });
  }
}
