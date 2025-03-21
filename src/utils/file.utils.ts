import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import { NodeModulesInfo, SearchConfig } from "../types/types";
import { Logger } from "./logger.utils";

/**
 * Класс для работы с файловой системой
 */
export class FileUtils {
  /**
   * Поиск всех директорий node_modules в указанной директории
   * @param config - конфигурация поиска
   * @returns Promise<NodeModulesInfo[]> - массив информации о найденных директориях
   */
  static async findNodeModules(
    config: SearchConfig
  ): Promise<NodeModulesInfo[]> {
    try {
      const pattern = path.join(
        config.startPath,
        config.maxDepth === -1
          ? "**/node_modules"
          : `${"*/".repeat(config.maxDepth)}node_modules`
      );

      let paths = await glob(pattern, {
        ignore: config.exclude,
        absolute: true,
      });

      // Фильтруем вложенные node_modules
      paths = paths.filter((p) => {
        const relativePath = p.substring(config.startPath.length);
        const count = relativePath
          .split("/")
          .filter((part) => part === "node_modules").length;
        return count === 1;
      });

      Logger.info(`Найдено ${paths.length} директорий node_modules`);

      const results: NodeModulesInfo[] = [];
      let processed = 0;

      for (const nodePath of paths) {
        try {
          const stats = await fs.stat(nodePath);
          const size = await this.getDirectorySize(nodePath);
          const lastModified = stats.mtime;
          const isUnused = this.isDirectoryUnused(lastModified);

          results.push({
            path: nodePath,
            size,
            lastModified,
            isUnused,
          });

          processed++;
          Logger.progress(processed, paths.length, "Анализ директорий");
        } catch (err) {
          Logger.warn(`Ошибка при обработке ${nodePath}: ${err}`);
        }
      }

      return results;
    } catch (err) {
      Logger.error(`Ошибка при поиске node_modules: ${err}`);
      return [];
    }
  }

  /**
   * Получение размера директории
   * @param dirPath - путь к директории
   * @returns Promise<number> - размер в байтах
   */
  private static async getDirectorySize(dirPath: string): Promise<number> {
    try {
      const files = await fs.readdir(dirPath);
      const stats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dirPath, file);
          const stat = await fs.stat(filePath);
          if (stat.isDirectory()) {
            return this.getDirectorySize(filePath);
          }
          return stat.size;
        })
      );

      return stats.reduce((acc, size) => acc + size, 0);
    } catch (err) {
      Logger.warn(`Ошибка при подсчете размера ${dirPath}: ${err}`);
      return 0;
    }
  }

  /**
   * Проверка, является ли директория неиспользуемой (старше 1 месяца)
   * @param lastModified - дата последнего изменения
   * @returns boolean
   */
  private static isDirectoryUnused(lastModified: Date): boolean {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return lastModified < oneMonthAgo;
  }

  /**
   * Удаление директории node_modules
   * @param path - путь к директории
   * @returns Promise<boolean> - успешность удаления
   */
  static async removeNodeModules(path: string): Promise<boolean> {
    try {
      await fs.remove(path);
      return true;
    } catch (err) {
      Logger.error(`Ошибка при удалении ${path}: ${err}`);
      return false;
    }
  }

  /**
   * Форматирование размера в читаемый вид
   * @param bytes - размер в байтах
   * @returns string - отформатированный размер
   */
  static formatSize(bytes: number): string {
    const units = ["Б", "КБ", "МБ", "ГБ"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
