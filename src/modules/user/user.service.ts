import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { unlink } from 'fs/promises';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UpdateAccountDto } from './dtos/update-account.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { UserDocument, ImageData } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    throw new Error('Method not implemented.');
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userRepository.findAll();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userRepository.update(id, updateUserDto);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async updateAccount(userId: string, updateAccountDto: UpdateAccountDto): Promise<UserDocument> {
    const user = await this.userRepository.findByIdExcludingDeleted(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (updateAccountDto.firstName !== undefined) {
      user.firstName = updateAccountDto.firstName;
    }

    if (updateAccountDto.lastName !== undefined) {
      user.lastName = updateAccountDto.lastName;
    }

    if (updateAccountDto.gender !== undefined) {
      user.gender = updateAccountDto.gender;
    }

    if (updateAccountDto.DOB !== undefined) {
      user.DOB = new Date(updateAccountDto.DOB);
    }

    if (updateAccountDto.mobileNumber !== undefined) {
      user.mobileNumber = updateAccountDto.mobileNumber;
    }

    await user.save();

    return user;
  }

  async getCurrentUserAccount(userId: string): Promise<any> {
    const user = await this.userRepository.findByIdExcludingDeleted(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.refreshTokenHash;
    delete userObject.otp;

    return userObject;
  }

  async getProfileData(userId: string): Promise<any> {
    const user = await this.userRepository.findByIdExcludingDeleted(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const userObject = user.toObject();

    return {
      userName: `${userObject.firstName}${userObject.lastName}`,
      mobileNumber: userObject.mobileNumber,
      profilePic: userObject.profilePic,
      coverPic: userObject.coverPic,
    };
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.password) {
      throw new BadRequestException('User does not have a password set');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, saltRounds);

    await this.userRepository.update(userId, {
      password: hashedPassword,
      changeCredentialTime: new Date(),
    });
  }

  async uploadProfilePic(userId: string, file: Express.Multer.File): Promise<UserDocument> {
    const user = await this.userRepository.findByIdExcludingDeleted(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.profilePic?.secure_url) {
      try {
        const oldFilePath = user.profilePic.secure_url;
        if (oldFilePath.startsWith('uploads/profile/')) {
          await unlink(oldFilePath).catch(() => {
          });
        }
      } catch (error) {
      }
    }

    const filePath = file.path;
    const imageData: ImageData = {
      secure_url: filePath,
      public_id: file.filename,
    };

    const updatedUser = await this.userRepository.update(userId, {
      profilePic: imageData,
    });

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return updatedUser;
  }

  async uploadCoverPic(userId: string, file: Express.Multer.File): Promise<UserDocument> {
    const user = await this.userRepository.findByIdExcludingDeleted(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.coverPic?.secure_url) {
      try {
        const oldFilePath = user.coverPic.secure_url;
        if (oldFilePath.startsWith('uploads/cover/')) {
          await unlink(oldFilePath).catch(() => {
          });
        }
      } catch (error) {
      }
    }

    const filePath = file.path;
    const imageData: ImageData = {
      secure_url: filePath,
      public_id: file.filename,
    };

    const updatedUser = await this.userRepository.update(userId, {
      coverPic: imageData,
    });

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return updatedUser;
  }

  async deleteProfilePic(userId: string): Promise<UserDocument> {
    const user = await this.userRepository.findByIdExcludingDeleted(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.profilePic?.secure_url) {
      try {
        const filePath = user.profilePic.secure_url;
        if (filePath.startsWith('uploads/profile/')) {
          await unlink(filePath).catch(() => {
          });
        }
      } catch (error) {
      }
    }

    const updatedUser = await this.userRepository.update(userId, {
      profilePic: null,
    });

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return updatedUser;
  }

  async deleteCoverPic(userId: string): Promise<UserDocument> {
    const user = await this.userRepository.findByIdExcludingDeleted(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.coverPic?.secure_url) {
      try {
        const filePath = user.coverPic.secure_url;
        if (filePath.startsWith('uploads/cover/')) {
          await unlink(filePath).catch(() => {
          });
        }
      } catch (error) {
      }
    }

    const updatedUser = await this.userRepository.update(userId, {
      coverPic: null,
    });

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return updatedUser;
  }

  async softDeleteAccount(userId: string): Promise<void> {
    const user = await this.userRepository.findByIdExcludingDeleted(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.userRepository.softDelete(userId);
  }
}

