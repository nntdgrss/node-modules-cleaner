import inquirer from "inquirer";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import {
  NodeModulesInfo,
  RemoveMode,
  RemoveOptions,
  RemoveResult,
} from "../types/types";
import { FileUtils } from "../utils/file.utils";
import { FindCommand } from "./find.command";
import { Progress } from "../ui/progress";
import { TreeView } from "../ui/tree.view";
import { Spinner } from "../ui/spinner";

/**
 * Класс для удаления директорий node_modules
 */
export class RemoveCommand {
  /**
   * Выполнение команды удаления
   * @param options - опции удаления
   * @returns Promise<RemoveResult>
   */
  static async execute(options: RemoveOptions): Promise<RemoveResult> {
    const nodeModules = await FindCommand.execute(options.path);
    const result: RemoveResult = {
      removed: 0,
      totalSize: 0,
      errors: [],
    };

    if (nodeModules.length === 0) {
      return result;
    }

    switch (options.mode) {
      case RemoveMode.ALL:
        return this.removeAll(nodeModules, options);
      case RemoveMode.UNUSED:
        return this.removeUnused(nodeModules, options);
      case RemoveMode.INTERACTIVE:
        return this.removeInteractive(nodeModules, options);
      default:
        Spinner.error("Неизвестный режим удаления");
        return result;
    }
  }

  /**
   * Создание бэкапа директорий
   * @param paths - пути к директориям для бэкапа
   * @returns Promise<string> - путь к файлу бэкапа
   */
  private static async createBackup(paths: string[]): Promise<string> {
    Spinner.start("Создание резервной копии...");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(
      process.cwd(),
      `node_modules_backup_${timestamp}.zip`
    );
    const output = fs.createWriteStream(backupPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);

    for (const dirPath of paths) {
      archive.directory(dirPath, path.basename(dirPath));
    }

    await archive.finalize();
    Spinner.success(`Резервная копия создана: ${backupPath}`);
    return backupPath;
  }

  /**
   * Удаление всех найденных директорий node_modules
   * @param nodeModules - массив информации о директориях
   * @param options - опции удаления
   */
  private static async removeAll(
    nodeModules: NodeModulesInfo[],
    options: RemoveOptions
  ): Promise<RemoveResult> {
    const result: RemoveResult = { removed: 0, totalSize: 0, errors: [] };
    const totalSize = nodeModules.reduce((acc, info) => acc + info.size, 0);

    if (options.dryRun) {
      Spinner.info(
        `Тестовый режим: будет удалено ${nodeModules.length} директорий`
      );
      TreeView.display(nodeModules);
      return result;
    }

    if (options.backup) {
      result.backupPath = await this.createBackup(
        nodeModules.map((info) => info.path)
      );
    }

    Progress.start(nodeModules.length, "Удаление директорий");

    for (const info of nodeModules) {
      try {
        if (!options.dryRun) {
          await FileUtils.removeNodeModules(info.path);
        }
        result.removed++;
        result.totalSize += info.size;
        Progress.update(result.removed, result.totalSize);
      } catch (err) {
        result.errors.push({ path: info.path, error: String(err) });
      }
    }

    Progress.stop();
    this.displayResults(result);
    return result;
  }

  /**
   * Удаление неиспользуемых директорий node_modules
   * @param nodeModules - массив информации о директориях
   * @param options - опции удаления
   */
  private static async removeUnused(
    nodeModules: NodeModulesInfo[],
    options: RemoveOptions
  ): Promise<RemoveResult> {
    const unusedModules = nodeModules.filter((info) => info.isUnused);
    const result: RemoveResult = { removed: 0, totalSize: 0, errors: [] };

    if (unusedModules.length === 0) {
      Spinner.info("Неиспользуемые директории не найдены");
      return result;
    }

    if (options.dryRun) {
      Spinner.info(
        `Тестовый режим: будет удалено ${unusedModules.length} неиспользуемых директорий`
      );
      TreeView.display(unusedModules);
      return result;
    }

    if (options.backup) {
      result.backupPath = await this.createBackup(
        unusedModules.map((info) => info.path)
      );
    }

    Progress.start(unusedModules.length, "Удаление неиспользуемых директорий");

    for (const info of unusedModules) {
      try {
        if (!options.dryRun) {
          await FileUtils.removeNodeModules(info.path);
        }
        result.removed++;
        result.totalSize += info.size;
        Progress.update(result.removed, result.totalSize);
      } catch (err) {
        result.errors.push({ path: info.path, error: String(err) });
      }
    }

    Progress.stop();
    this.displayResults(result);
    return result;
  }

  /**
   * Интерактивное удаление выбранных директорий
   * @param nodeModules - массив информации о директориях
   * @param options - опции удаления
   */
  private static async removeInteractive(
    nodeModules: NodeModulesInfo[],
    options: RemoveOptions
  ): Promise<RemoveResult> {
    const result: RemoveResult = { removed: 0, totalSize: 0, errors: [] };
    const choices = nodeModules.map((info) => ({
      name: TreeView.formatNodeInfo(info, ""),
      value: info,
      checked: info.isUnused,
    }));

    // Очищаем консоль перед отображением списка
    console.clear();

    const { selected } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selected",
        message:
          "Выберите директории для удаления (пробел - выбрать, enter - подтвердить):",
        choices,
        pageSize: 15,
        loop: false,
      },
    ]);

    if (selected.length === 0) {
      Spinner.warn("Директории не выбраны");
      return result;
    }

    const totalSize = selected.reduce(
      (acc: number, info: NodeModulesInfo) => acc + info.size,
      0
    );

    if (options.dryRun) {
      Spinner.info(
        `Тестовый режим: будет удалено ${selected.length} директорий`
      );
      TreeView.display(selected);
      return result;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Подтвердите удаление ${
          selected.length
        } директорий (${FileUtils.formatSize(totalSize)}):`,
        default: false,
      },
    ]);

    if (!confirm) {
      Spinner.warn("Операция отменена");
      return result;
    }

    if (options.backup) {
      result.backupPath = await this.createBackup(
        selected.map((info: NodeModulesInfo) => info.path)
      );
    }

    Progress.start(selected.length, "Удаление выбранных директорий");

    for (const info of selected) {
      try {
        if (!options.dryRun) {
          await FileUtils.removeNodeModules(info.path);
        }
        result.removed++;
        result.totalSize += info.size;
        Progress.update(result.removed, result.totalSize);
      } catch (err) {
        result.errors.push({ path: info.path, error: String(err) });
      }
    }

    Progress.stop();
    this.displayResults(result);
    return result;
  }

  /**
   * Отображение результатов операции удаления
   * @param result - результаты удаления
   */
  private static displayResults(result: RemoveResult): void {
    console.clear();
    Spinner.success(
      `\nУдалено ${result.removed} директорий\n` +
        `Освобождено: ${FileUtils.formatSize(result.totalSize)}`
    );

    if (result.backupPath) {
      Spinner.info(`Резервная копия: ${result.backupPath}`);
    }

    if (result.errors.length > 0) {
      Spinner.warn("\nПроизошли ошибки при удалении:");
      result.errors.forEach(({ path, error }) => {
        console.log(`  ${path}: ${error}`);
      });
    }
  }
}
