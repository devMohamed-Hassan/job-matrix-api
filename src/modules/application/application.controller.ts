import { Controller } from "@nestjs/common";
import { ApplicationService } from "./application.service";

@Controller("applications")
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}
}
