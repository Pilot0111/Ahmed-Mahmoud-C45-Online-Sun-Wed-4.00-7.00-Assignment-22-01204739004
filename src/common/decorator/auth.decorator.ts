import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { TokenEnum } from '../enum/token.enum';
import { RoleEnum } from '../enum/user.enum';
import { AuthenticationGuard } from '../guard/authentication.guard';
import { AuthorizationGuard } from '../guard/authorization.guard';

export const token_type_key = 'token_type_key';
export const access_roles_key = 'access_roles_key';

export const TokenType = (token_type: TokenEnum = TokenEnum.access_token) => {
  return SetMetadata(token_type_key, token_type);
};

export const Roles = (access_roles: RoleEnum[]) => {
  return SetMetadata(access_roles_key, access_roles);
};

export function Auth({
  token_type = TokenEnum.access_token,
  access_roles = [RoleEnum.user],
}: {
  token_type?: TokenEnum;
  access_roles?: RoleEnum[];
} = {}) {
  return applyDecorators(
    TokenType(token_type),
    Roles(access_roles),
    UseGuards(AuthenticationGuard, AuthorizationGuard),
  );
}
