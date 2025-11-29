import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { CreateUserDto } from '../user/dtos/create-user.dto';
import { UserRepository } from '../user/user.repository';
import { UserDocument } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userRepository: UserRepository,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOneByEmail(
      createUserDto.email.toLowerCase(),
    );

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = await this.userRepository.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
    });

    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
  }

  async login(loginDto: LoginDto) {

    const user = await this.userRepository.findByEmailWithPassword(
      loginDto.email.toLowerCase(),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted');
    }

    if (user.bannedAt) {
      throw new UnauthorizedException('Account has been banned');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const userObject = user.toObject();
    delete userObject.password;

    return {
      accessToken,
      user: userObject,
    };
  }

  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.userRepository.findByEmailWithPassword(email.toLowerCase());

    if (!user) {
      return null;
    }

    if (user.deletedAt || user.bannedAt) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
