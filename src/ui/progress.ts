import cliProgress from "cli-progress";
import chalk from "chalk";
import { FileUtils } from "../utils/file.utils";

/**
 * Класс для отображения прогресса операций в консоли
 */
export class Progress {
  private static bar: cliProgress.SingleBar;

  /**
   * Создание и старт прогресс-бара
   * @param total - общее количество операций
   * @param message - сообщение прогресс-бара
   */
  static start(total: number, message: string): void {
    // Очищаем консоль для лучшего отображения
    console.clear();

    this.bar = new cliProgress.SingleBar({
      format: `${message} |${chalk.cyan(
        "{bar}"
      )}| {percentage}% | {value}/{total} | {size}`,
      barCompleteChar: "█",
      barIncompleteChar: "░",
      hideCursor: true,
      clearOnComplete: true,
    });

    this.bar.start(total, 0, { size: "0 Б" });
  }

  /**
   * Обновление прогресса
   * @param current - текущий прогресс
   * @param size - обработанный размер (в байтах)
   */
  static update(current: number, size: number = 0): void {
    if (this.bar) {
      this.bar.update(current, { size: FileUtils.formatSize(size) });
    }
  }

  /**
   * Остановка прогресс-бара
   */
  static stop(): void {
    if (this.bar) {
      this.bar.stop();
    }
  }

  /**
   * Группировка node_modules по размеру
   * @param sizes - массив размеров в байтах
   * @returns объект с группами
   */
  static getSizeGroup(size: number): { color: chalk.Chalk; label: string } {
    const GB = 1024 * 1024 * 1024;
    const MB = 1024 * 1024;

    if (size >= GB) {
      return { color: chalk.red, label: "Очень большой" };
    } else if (size >= 100 * MB) {
      return { color: chalk.yellow, label: "Большой" };
    } else if (size >= 10 * MB) {
      return { color: chalk.blue, label: "Средний" };
    } else {
      return { color: chalk.green, label: "Малый" };
    }
  }

  /**
   * Форматирование текста с цветом в зависимости от размера
   * @param text - текст для форматирования
   * @param size - размер в байтах
   * @returns отформатированный текст
   */
  static colorizeBySize(text: string, size: number): string {
    const { color } = this.getSizeGroup(size);
    return color(text);
  }

  /**
   * Очистка консоли
   */
  static clearConsole(): void {
    console.clear();
  }
}
