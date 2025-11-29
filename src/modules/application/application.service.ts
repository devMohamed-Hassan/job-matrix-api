import { Injectable } from "@nestjs/common";
import { ApplicationRepository } from "./application.repository";

@Injectable()
export class ApplicationService {
  constructor(private readonly applicationRepository: ApplicationRepository) {}
}
