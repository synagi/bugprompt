import fs from "fs";
import path from "path";

class FileUtil {
  static async cleanDirectory(dirPath: string): Promise<void> {
    try {
      const files = await fs.promises.readdir(dirPath);
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        await fs.promises.rm(fullPath, { recursive: true, force: true });
      }
      //console.log(`Directory cleaned: ${dirPath}`);
    } catch (error) {
      console.error(`Error cleaning directory ${dirPath}:`, error);
      throw error;
    }
  }
}

export default FileUtil;
