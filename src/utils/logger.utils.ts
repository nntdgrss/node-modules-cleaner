import chalk from "chalk";

/**
 * Класс для логирования и вывода информации в консоль
 */
export class Logger {
  /**
   * Выводит информационное сообщение
   * @param message - текст сообщения
   */
  static info(message: string): void {
    console.log(chalk.blue("ℹ"), message);
  }

  /**
   * Выводит сообщение об успехе
   * @param message - текст сообщения
   */
  static success(message: string): void {
    console.log(chalk.green("✔"), message);
  }

  /**
   * Выводит предупреждение
   * @param message - текст сообщения
   */
  static warn(message: string): void {
    console.log(chalk.yellow("⚠"), message);
  }

  /**
   * Выводит сообщение об ошибке
   * @param message - текст сообщения
   */
  static error(message: string): void {
    console.log(chalk.red("✖"), message);
  }

  /**
   * Выводит прогресс операции
   * @param current - текущий прогресс
   * @param total - общее количество
   * @param message - дополнительное сообщение
   */
  static progress(current: number, total: number, message: string): void {
    const percentage = Math.round((current / total) * 100);
    process.stdout.write(
      `\r${chalk.cyan("↻")} ${message}: ${percentage}% (${current}/${total})`
    );
    if (current === total) {
      process.stdout.write("\n");
    }
  }
}
