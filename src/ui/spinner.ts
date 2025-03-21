import ora, { Ora } from "ora";
import chalk from "chalk";

/**
 * Класс для управления спиннером загрузки в консоли
 */
export class Spinner {
  private static instance: Ora;

  /**
   * Вывод информационного сообщения
   * @param text - текст сообщения
   */
  static info(text: string): void {
    if (this.instance) {
      this.instance.info(text);
    } else {
      console.log(chalk.blue("ℹ"), text);
    }
  }

  /**
   * Инициализация спиннера с текстом
   * @param text - текст, отображаемый рядом со спиннером
   */
  static start(text: string): void {
    this.instance = ora({
      text,
      color: "cyan",
      spinner: "dots",
    }).start();
  }

  /**
   * Обновление текста спиннера
   * @param text - новый текст
   */
  static update(text: string): void {
    if (this.instance) {
      this.instance.text = text;
    }
  }

  /**
   * Остановка спиннера с успешным статусом
   * @param text - текст успешного завершения
   */
  static success(text: string): void {
    if (this.instance) {
      this.instance.succeed(text);
    }
  }

  /**
   * Остановка спиннера с ошибкой
   * @param text - текст ошибки
   */
  static error(text: string): void {
    if (this.instance) {
      this.instance.fail(text);
    }
  }

  /**
   * Остановка спиннера с предупреждением
   * @param text - текст предупреждения
   */
  static warn(text: string): void {
    if (this.instance) {
      this.instance.warn(text);
    }
  }

  /**
   * Очистка спиннера
   */
  static clear(): void {
    if (this.instance) {
      this.instance.clear();
    }
  }

  /**
   * Остановка спиннера
   */
  static stop(): void {
    if (this.instance) {
      this.instance.stop();
    }
  }
}
