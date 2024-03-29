import type Application from "../models/Application";
import { ApiBaseService } from "./ApiBaseService";

export default class ApplicationService extends ApiBaseService {
  async info(): Promise<Application> {
    return await this.call<Application>("/");
  }
}
