import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Application,
  ApplicationDocument,
} from "./entities/application.entity";

@Injectable()
export class ApplicationRepository {
  constructor(
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>
  ) {}
}
