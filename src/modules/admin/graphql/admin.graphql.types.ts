import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class ImageDataType {
  @Field({ nullable: true })
  secure_url?: string;

  @Field({ nullable: true })
  public_id?: string;
}

@ObjectType()
export class UserType {
  @Field(() => ID)
  _id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  provider: string;

  @Field({ nullable: true })
  gender?: string;

  @Field({ nullable: true })
  DOB?: Date;

  @Field({ nullable: true })
  mobileNumber?: string;

  @Field()
  role: string;

  @Field()
  emailConfirmed: boolean;

  @Field({ nullable: true })
  deletedAt?: Date;

  @Field({ nullable: true })
  bannedAt?: Date;

  @Field(() => ImageDataType, { nullable: true })
  profilePic?: ImageDataType;

  @Field(() => ImageDataType, { nullable: true })
  coverPic?: ImageDataType;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class CompanyType {
  @Field(() => ID)
  _id: string;

  @Field()
  companyName: string;

  @Field()
  description: string;

  @Field()
  industry: string;

  @Field()
  address: string;

  @Field()
  numberOfEmployees: string;

  @Field()
  companyEmail: string;

  @Field(() => ID)
  createdBy: string;

  @Field(() => ImageDataType, { nullable: true })
  logo?: ImageDataType;

  @Field(() => ImageDataType, { nullable: true })
  coverPic?: ImageDataType;

  @Field(() => [ID])
  HRs: string[];

  @Field({ nullable: true })
  bannedAt?: Date;

  @Field({ nullable: true })
  deletedAt?: Date;

  @Field(() => ImageDataType, { nullable: true })
  legalAttachment?: ImageDataType;

  @Field()
  approvedByAdmin: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class AllDataResponse {
  @Field(() => [UserType], { nullable: false })
  users: UserType[];

  @Field(() => [CompanyType], { nullable: false })
  companies: CompanyType[];
}

@ObjectType()
export class BanUserResponse {
  @Field(() => UserType)
  user: UserType;

  @Field()
  message: string;
}

@ObjectType()
export class BanCompanyResponse {
  @Field(() => CompanyType)
  company: CompanyType;

  @Field()
  message: string;
}

@ObjectType()
export class ApproveCompanyResponse {
  @Field(() => CompanyType)
  company: CompanyType;

  @Field()
  message: string;
}
