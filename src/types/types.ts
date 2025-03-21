/**
 * Интерфейс для представления информации о директории node_modules
 */
export interface NodeModulesInfo {
  /** Полный путь к директории */
  path: string;
  /** Размер директории в байтах */
  size: number;
  /** Дата последнего изменения */
  lastModified: Date;
  /** Флаг, указывающий, используется ли директория (изменялась ли за последний месяц) */
  isUnused: boolean;
}

/**
 * Интерфейс для конфигурации поиска
 */
export interface SearchConfig {
  /** Начальная директория для поиска */
  startPath: string;
  /** Глубина поиска (-1 для неограниченной глубины) */
  maxDepth: number;
  /** Исключаемые пути (регулярные выражения) */
  exclude: string[];
}

/**
 * Перечисление для режимов удаления
 */
export enum RemoveMode {
  /** Удаление всех node_modules */
  ALL = "all",
  /** Удаление только неиспользуемых node_modules */
  UNUSED = "unused",
  /** Интерактивное удаление выбранных node_modules */
  INTERACTIVE = "interactive",
}

/**
 * Интерфейс для опций команды удаления
 */
export interface RemoveOptions {
  /** Путь для поиска */
  path?: string;
  /** Режим удаления */
  mode: RemoveMode;
  /** Тестовый режим (без реального удаления) */
  dryRun?: boolean;
  /** Создать бэкап перед удалением */
  backup?: boolean;
}

/**
 * Интерфейс для результатов операции удаления
 */
export interface RemoveResult {
  /** Количество удаленных директорий */
  removed: number;
  /** Общий размер удаленных директорий */
  totalSize: number;
  /** Путь к бэкапу (если был создан) */
  backupPath?: string;
  /** Список ошибок при удалении */
  errors: Array<{ path: string; error: string }>;
}
