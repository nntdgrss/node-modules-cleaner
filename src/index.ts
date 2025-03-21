#!/usr/bin/env node
import { Command } from "commander";
import os from "os";
import { RemoveMode, RemoveOptions } from "./types/types";
import { RemoveCommand } from "./commands/remove.command";
import { FindCommand } from "./commands/find.command";
import { Spinner } from "./ui/spinner";

const program = new Command();

// Основная информация о программе
program
  .name("nmcleaner")
  .description("Утилита для поиска и удаления node_modules")
  .version("1.0.0");

// Команда поиска node_modules
program
  .command("list")
  .description("Показать все найденные директории node_modules")
  .option("-p, --path <path>", "Начальная директория для поиска", os.homedir())
  .option(
    "-d, --depth <depth>",
    "Максимальная глубина поиска (-1 для неограниченной)",
    "-1"
  )
  .action(async (options) => {
    try {
      await FindCommand.execute(options.path, parseInt(options.depth));
    } catch (err) {
      Spinner.error(`Ошибка при выполнении команды: ${err}`);
    }
  });

// Команда удаления node_modules
program
  .command("rm")
  .description("Удаление директорий node_modules")
  .option("-p, --path <path>", "Начальная директория", os.homedir())
  .option(
    "-m, --mode <mode>",
    "Режим удаления: all - все, unused - неиспользуемые, interactive - выборочно",
    "interactive"
  )
  .option("--dry-run", "Тестовый режим (без реального удаления)", false)
  .option("--backup", "Создать резервную копию перед удалением", false)
  .action(async (options) => {
    try {
      let mode: RemoveMode;
      switch (options.mode.toLowerCase()) {
        case "all":
          mode = RemoveMode.ALL;
          break;
        case "unused":
          mode = RemoveMode.UNUSED;
          break;
        case "interactive":
        default:
          mode = RemoveMode.INTERACTIVE;
          break;
      }

      const removeOptions: RemoveOptions = {
        path: options.path,
        mode,
        dryRun: options.dryRun,
        backup: options.backup,
      };

      await RemoveCommand.execute(removeOptions);
    } catch (err) {
      Spinner.error(`Ошибка при выполнении команды: ${err}`);
    }
  });

// Дефолтная команда - интерактивное удаление
program.action(async () => {
  try {
    await RemoveCommand.execute({
      mode: RemoveMode.INTERACTIVE,
      dryRun: false,
      backup: false,
    });
  } catch (err) {
    Spinner.error(`Ошибка при выполнении команды: ${err}`);
  }
});

// Обработка неизвестных команд
program.on("command:*", () => {
  Spinner.error("Неизвестная команда");
  console.log("\nДоступные команды:");
  program.commands.forEach((cmd) => {
    console.log(`  ${cmd.name()}\t${cmd.description()}`);
  });
  process.exit(1);
});

// Запуск программы
program.parse(process.argv);
