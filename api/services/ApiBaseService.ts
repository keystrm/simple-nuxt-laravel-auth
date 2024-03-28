import { $Fetch } from "ofetch";

export abstract class ApiBaseService {
  private client: $Fetch;

  constructor(client: $Fetch) {
    this.client = client;
  }

  protected get call(): $Fetch {
    return this.client;
  }
}
