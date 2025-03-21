import chalk from "chalk";
import { NodeModulesInfo } from "../types/types";
import { FileUtils } from "../utils/file.utils";
import { Progress } from "./progress";

/**
 * Класс для древовидного отображения node_modules
 */
export class TreeView {
  /**
   * Форматирование строки для отображения информации о node_modules
   * @param info - информация о директории
   * @param prefix - префикс для отступа
   * @returns отформатированная строка
   */
  static formatNodeInfo(info: NodeModulesInfo, prefix: string = ""): string {
    const size = FileUtils.formatSize(info.size);
    const date = info.lastModified.toLocaleDateString("ru-RU");
    const { label, color } = Progress.getSizeGroup(info.size);
    const status = info.isUnused
      ? chalk.yellow("Не используется")
      : chalk.green("Активный");

    return [
      color(`${prefix}└─ ${info.path}`),
      chalk.dim(`\n${prefix}   ├─ Размер: ${size} (${label})`),
      chalk.dim(`\n${prefix}   ├─ Последнее изменение: ${date}`),
      `\n${prefix}   └─ Статус: ${status}`,
    ].join("");
  }

  /**
   * Группировка node_modules по размеру
   * @param items - массив информации о директориях
   * @returns сгруппированный массив
   */
  static groupBySize(items: NodeModulesInfo[]): {
    veryLarge: NodeModulesInfo[];
    large: NodeModulesInfo[];
    medium: NodeModulesInfo[];
    small: NodeModulesInfo[];
  } {
    const GB = 1024 * 1024 * 1024;
    const MB = 1024 * 1024;

    return {
      veryLarge: items.filter((item) => item.size >= GB),
      large: items.filter((item) => item.size >= 100 * MB && item.size < GB),
      medium: items.filter(
        (item) => item.size >= 10 * MB && item.size < 100 * MB
      ),
      small: items.filter((item) => item.size < 10 * MB),
    };
  }

  /**
   * Создание древовидного отображения с группировкой по размеру
   * @param items - массив информации о директориях
   * @returns отформатированная строка
   */
  static createSizeTree(items: NodeModulesInfo[]): string {
    const groups = this.groupBySize(items);
    const totalSize = items.reduce((acc, item) => acc + item.size, 0);

    const sections = [
      {
        title: chalk.red("Очень большие (>1GB)"),
        items: groups.veryLarge,
      },
      {
        title: chalk.yellow("Большие (100MB-1GB)"),
        items: groups.large,
      },
      {
        title: chalk.blue("Средние (10MB-100MB)"),
        items: groups.medium,
      },
      {
        title: chalk.green("Малые (<10MB)"),
        items: groups.small,
      },
    ];

    const result = [
      chalk.bold(`\nВсего найдено: ${items.length} директорий`),
      chalk.bold(`Общий размер: ${FileUtils.formatSize(totalSize)}\n`),
    ];

    for (const section of sections) {
      if (section.items.length > 0) {
        const sectionSize = section.items.reduce(
          (acc, item) => acc + item.size,
          0
        );
        result.push(
          `\n${section.title} (${
            section.items.length
          } шт., ${FileUtils.formatSize(sectionSize)})`
        );
        section.items
          .sort((a, b) => b.size - a.size)
          .forEach((item) => {
            result.push(`\n${this.formatNodeInfo(item, "  ")}`);
          });
      }
    }

    return result.join("\n");
  }

  /**
   * Очистка консоли и отображение дерева
   * @param items - массив информации о директориях
   */
  static display(items: NodeModulesInfo[]): void {
    console.clear();
    console.log(this.createSizeTree(items));
  }
}
