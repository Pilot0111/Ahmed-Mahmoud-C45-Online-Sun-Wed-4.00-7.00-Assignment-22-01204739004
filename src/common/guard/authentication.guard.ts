import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Socket } from 'socket.io';
import { symmetricDecryption } from '../utils/security/encrypt.security';
import { TokenService } from '../utils/security/toke.security';
import { UserRepository } from '../../DB/repositories/user.repository';
import { RedisService } from 'src/common/service/redis.service';
import { TokenEnum } from '../enum/token.enum';
import { token_type_key } from '../decorator/auth.decorator';

export const getSignature = async (prefix: string) => {
  let ACCESS_SECRET_KEY = '';
  let REFRESH_SECRET_KEY = '';

  if (prefix === process.env.PREFIX_USER) {
    ACCESS_SECRET_KEY = process.env.JWT_ACCESS_SECRET_USER as string;
    REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET_USER as string;
  } else if (prefix === process.env.PREFIX_ADMIN) {
    ACCESS_SECRET_KEY = process.env.JWT_ACCESS_SECRET_ADMIN as string;
    REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET_ADMIN as string;
  }
  return { ACCESS_SECRET_KEY, REFRESH_SECRET_KEY };
};

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const contextType = context.getType<'http' | 'ws' | 'graphql'>();
    let req: any;

    // 1. Resolve the request object based on the context type (HTTP, WebSocket, or GraphQL)
    if (contextType === 'http') {
      req = context.switchToHttp().getRequest<Request>();
    } else if (contextType === 'ws') {
      const client = context.switchToWs().getClient<Socket>();
      req = client.handshake;
      // Socket.io often passes authorization in the auth payload instead of headers
      if (!req.headers?.authorization && req.auth?.authorization) {
        req.headers = { ...req.headers, authorization: req.auth.authorization };
      }
    } else if (contextType === 'graphql') {
      // In GraphQL, the 3rd execution argument is typically the GraphQL Context containing the request
      const gqlContext = context.getArgByIndex(2);
      req = gqlContext.req;
    } else {
      throw new UnauthorizedException('Invalid request context type');
    }

    try {
      // 2. Read the required token type from the metadata (defaults to access_token)
      const requiredTokenType = this.reflector.get<TokenEnum>(
        token_type_key,
        context.getHandler(),
      );
      const tokenType = requiredTokenType || TokenEnum.access_token;
      
      // Attempt to extract authorization header or fallback to query parameters
      let authorization = req.headers?.authorization || req.get?.('authorization');

      if (!authorization && req.query?.token && req.query?.prefix) {
        authorization = `${req.query.prefix} ${req.query.token}`;
      }

      if (!authorization) {
        throw new UnauthorizedException('Authentication error: Token missing');
      }

      const parts = authorization.trim().split(/\s+/);

      if (parts.length !== 2) {
        throw new UnauthorizedException(
          "Authentication error: Invalid header format. Use '{Prefix} {Token}'",
        );
      }

      const [prefix, token] = parts;
      if (!token) {
        throw new UnauthorizedException('Authentication error: Token missing');
      }

      const { ACCESS_SECRET_KEY, REFRESH_SECRET_KEY } = await getSignature(prefix);

      if (!ACCESS_SECRET_KEY || !REFRESH_SECRET_KEY) {
        throw new UnauthorizedException('Authentication error: Invalid prefix');
      }

      const secretKey =
        tokenType === TokenEnum.access_token
          ? ACCESS_SECRET_KEY
          : REFRESH_SECRET_KEY;

      const decoded: any = await this.tokenService.verifyToken({
        token,
        secret_key: secretKey,
      });

      if (!decoded || !decoded?.id) {
        throw new UnauthorizedException('Authentication error: Invalid token format');
      }

      const user = await this.userRepository.findOne({
        filter: { _id: new Types.ObjectId(decoded.id) },
        projection: '-password -__v',
      });

      if (!user) {
        console.error('Guard Error: User not found for ID:', decoded.id);
        throw new UnauthorizedException('Authentication error: User not found');
      }

      await user.populate({
        path: 'friends',
        select: 'profilePicture firstName lastName',
      });

      if (!user.confirmed) {
        throw new UnauthorizedException(
          'Please confirm your email to access this resource',
        );
      }

      const isRevoked = await this.redisService.get({
        key: this.redisService.generateRevokeTokenKey(
          user._id.toString(),
          decoded.jti,
        ),
      });

      if (isRevoked) {
        throw new UnauthorizedException('Authentication error: Token revoked');
      }

      const decryptedPhone = user.phone ? symmetricDecryption(user.phone) : null;
      user.phone = decryptedPhone;

      // 2. Attach the populated user to the appropriate object based on context type
      if (contextType === 'ws') {
        const socket = context.switchToWs().getClient<Socket>();
        socket.data.user = user;
        socket.data.decoded = decoded;
      } else {
        req.user = user;
        req.decoded = decoded;
      }

      return true;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(error.message || 'Authentication failed');
    }
  }
}
