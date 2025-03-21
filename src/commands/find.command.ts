import os from "os";
import path from "path";
import { FileUtils } from "../utils/file.utils";
import { Logger } from "../utils/logger.utils";
import { NodeModulesInfo, SearchConfig } from "../types/types";
import { Spinner } from "../ui/spinner";
import { TreeView } from "../ui/tree.view";

/**
 * Класс для поиска директорий node_modules
 */
export class FindCommand {
  /**
   * Стандартные пути для исключения из поиска
   */
  private static defaultExcludes = [
    "**/node_modules/node_modules/**", // Вложенные node_modules
    "**/.*/**", // Скрытые директории
    "**/snap/**", // Системные директории
    "**/AppData/**", // Windows AppData
    "**/Library/**", // macOS Library
  ];

  /**
   * Поиск node_modules с настраиваемой конфигурацией
   * @param startPath - начальная директория поиска (по умолчанию домашняя директория)
   * @param maxDepth - максимальная глубина поиска (-1 для неограниченной)
   * @returns Promise<NodeModulesInfo[]>
   */
  static async execute(
    startPath: string = os.homedir(),
    maxDepth: number = -1
  ): Promise<NodeModulesInfo[]> {
    Spinner.start("Начинаем поиск директорий node_modules...");
    Spinner.update(`Сканирование: ${startPath}`);

    try {
      const searchConfig: SearchConfig = {
        startPath: path.resolve(startPath),
        maxDepth,
        exclude: this.defaultExcludes,
      };

      const results = await FileUtils.findNodeModules(searchConfig);

      if (results.length === 0) {
        Spinner.warn("Директории node_modules не найдены");
        return [];
      }

      const totalSize = results.reduce((acc, info) => acc + info.size, 0);
      const unusedCount = results.filter((r) => r.isUnused).length;

      Spinner.success(
        `Найдено ${results.length} директорий (${FileUtils.formatSize(
          totalSize
        )}, неиспользуемых: ${unusedCount})`
      );

      // Отображаем древовидную структуру
      TreeView.display(results);

      return results;
    } catch (err) {
      Spinner.error(`Ошибка при поиске node_modules: ${err}`);
      return [];
    }
  }

  /**
   * Получение человекочитаемой информации о node_modules
   * @param info - информация о директории
   * @returns string - форматированная строка
   */
  static formatNodeModulesInfo(info: NodeModulesInfo): string {
    const size = FileUtils.formatSize(info.size);
    const date = info.lastModified.toLocaleDateString("ru-RU");
    const status = info.isUnused ? "Не используется" : "Активный";
    return `${info.path}\n  Размер: ${size} | Последнее изменение: ${date} | Статус: ${status}`;
  }
}
