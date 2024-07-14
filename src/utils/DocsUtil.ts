import fs from "fs";
import FileUtil from "./FileUtil.js";

class DocUtil {
  static async prepareOutputDirectory(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      console.log(`Output directory created or verified: ${dirPath}`);
      await FileUtil.cleanDirectory(dirPath);
    } catch (error) {
      console.error(`Error preparing output directory ${dirPath}:`, error);
      throw error;
    }
  }
}

export default DocUtil;
