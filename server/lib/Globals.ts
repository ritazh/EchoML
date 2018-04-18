import * as config from "config";

export class Globals {
  public static getEnvVar = (name: string): string => {
    if (process.env[name]) {
      return process.env[name] as string;
    } else if (config.has(name)) {
      const val = config.get<any>(name);
      if (typeof val === "string") {
        return val;
      } else {
        return String(val);
      }
    }
    throw new Error(`${name} not found in env or config files`);
  };
}
