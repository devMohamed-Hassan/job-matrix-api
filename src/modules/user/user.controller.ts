import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UpdateUserDto } from "./dtos/update-user.dto";
import { UpdateAccountDto } from "./dtos/update-account.dto";
import { UpdatePasswordDto } from "./dtos/update-password.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../common/decorators/current-user.decorator";
import { createMulterConfig } from "../../config/multer.config";

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get("account/me")
  getCurrentUserAccount(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.getCurrentUserAccount(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("account/me")
  updateAccount(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateAccountDto: UpdateAccountDto
  ) {
    return this.userService.updateAccount(user.userId, updateAccountDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put("account/password")
  updatePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    return this.userService.updatePassword(user.userId, updatePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("account/profile-pic")
  @UseInterceptors(FileInterceptor("file", createMulterConfig("profile")))
  uploadProfilePic(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    return this.userService.uploadProfilePic(user.userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Post("account/cover-pic")
  @UseInterceptors(FileInterceptor("file", createMulterConfig("cover")))
  uploadCoverPic(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    return this.userService.uploadCoverPic(user.userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("account/profile-pic")
  deleteProfilePic(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.deleteProfilePic(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("account/cover-pic")
  deleteCoverPic(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.deleteCoverPic(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("account/me")
  softDeleteAccount(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.softDeleteAccount(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile/:id")
  getProfileData(@Param("id") id: string) {
    return this.userService.getProfileData(id);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.userService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.userService.remove(id);
  }
}
