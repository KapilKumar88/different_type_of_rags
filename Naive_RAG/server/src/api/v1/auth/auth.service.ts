import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { jwtConfig } from '../../../config/jwt.config';
import type { User } from '../../../database/schemas';
import { AuthRepository } from './auth.repository';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type {
  AuthResult,
  AuthTokenPayload,
  SafeUser,
} from '../../../types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existingUser = await this.authRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await hash(dto.password, 12);
    const user = await this.authRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    if (!user) {
      throw new InternalServerErrorException('Unable to create user');
    }

    return this.createAuthResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.authRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createAuthResult(user);
  }

  async getAuthenticatedUser(token: string | undefined): Promise<SafeUser> {
    if (!token) {
      throw new UnauthorizedException('Authentication cookie is missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
        token,
        {
          secret: jwtConfig.secret,
        },
      );
      const user = await this.authRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Authenticated user was not found');
      }

      return this.toSafeUser(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid authentication cookie');
    }
  }

  private async createAuthResult(user: User): Promise<AuthResult> {
    const safeUser = this.toSafeUser(user);
    const signOptions: JwtSignOptions = {
      secret: jwtConfig.secret,
      expiresIn: jwtConfig.expiresIn as JwtSignOptions['expiresIn'],
    };
    const token = await this.jwtService.signAsync(
      { sub: safeUser.id, email: safeUser.email },
      signOptions,
    );

    return { token, user: safeUser };
  }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
