/** UI translations (Stage 13). Flat dotted keys → O(1) lookup, no i18n library.
 *  Only frontend-authored chrome is translated; data-derived names (node
 *  labels, archive output names) and backend `detail` messages are left as-is. */

export type Locale = "ru" | "en";

export const LOCALES: Locale[] = ["ru", "en"];

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: "RU",
  en: "EN",
};

type Dict = Record<string, string>;

const ru: Dict = {
  "common.loading": "Загрузка…",
  "common.close": "Закрыть",
  "common.hide": "Скрыть",
  "common.save": "Сохранить",

  "lang.switch": "Язык интерфейса",

  "topbar.files": "Файлы",
  "topbar.generateModel": "Создать модель архива",
  "topbar.generatingModel": "Создание модели…",
  "topbar.run": "Запуск",
  "topbar.running": "Генерация…",
  "topbar.admin": "Админ",
  "topbar.adminTitle": "Управление пользователями",
  "topbar.loggedInAs": "Вы вошли как {name}",
  "topbar.logout": "Выйти",

  "role.admin": "админ",
  "role.userShort": "польз.",
  "role.user": "пользователь",

  "data.title": "Данные",
  "data.collapse": "Свернуть панель",
  "data.import": "Импортировать",
  "data.importing": "Импортирование…",
  "data.hint": "Загрузите таблицу и шаблоны, затем импортируйте узлы на холст.",

  "files.wordTitle": "Шаблоны Word",
  "files.chooseFiles": "Выбрать файлы",
  "files.excelTitle": "Таблица Excel",
  "files.chooseExcel": "Выбрать Excel",
  "files.removeFile": "Удалить файл",

  "templates.title": "Шаблоны связей",
  "templates.empty":
    "Шаблонов пока нет. Соедините узлы, создайте модель архива и сохраните связи как шаблон — потом его можно будет применить к новому импорту.",
  "templates.connections": "{count} связей",
  "templates.apply": "Применить",
  "templates.applyTitle": "Расставить связи по шаблону",
  "templates.applyDisabledTitle": "Сначала импортируйте узлы",
  "templates.deleteTitle": "Удалить шаблон",
  "templates.deleteAria": "Удалить шаблон {name}",
  "templates.importToApply": "Импортируйте узлы, чтобы применить шаблон.",
  "templates.saved": "Шаблон «{name}» сохранён ({count} связей)",
  "templates.saveFailed": "Не удалось сохранить шаблон",
  "templates.deleted": "Шаблон «{name}» удалён",
  "templates.deleteFailed": "Не удалось удалить шаблон",

  "saveTpl.title": "Сохранить связи как шаблон",
  "saveTpl.hint":
    "Сохранит текущие соединения под именем. Позже их можно автоматически восстановить после нового импорта (по совпадающим названиям).",
  "saveTpl.placeholder": "Название шаблона",

  "archive.title": "Модель архива",
  "archive.hint":
    "Редактируйте имена прямо в дереве. Подсвеченные части (из Excel) и расширение файлов изменить нельзя. Имя объединённого файла по умолчанию содержит имя макета и редактируется целиком (кроме расширения).",
  "archiveView.lockTitle": "Подставляется из Excel — менять нельзя",
  "archiveView.extTitle": "Расширение зафиксировано",

  "validation.title": "Граф неполный",
  "validation.varNotConnected": "Переменная «{label}» не подключена к источнику данных",
  "validation.templateNotConnected":
    "Шаблон «{label}» не подключён к источнику данных (имя файла)",
  "validation.foldersNotConnected": "Поле разбивки по папкам не подключено к источнику данных",

  "progress.title": "Генерация документов",
  "progress.preparing": "Подготовка…",
  "progress.phaseFill": "Заполнение шаблонов",
  "progress.phaseMerge": "Объединение в один файл",

  "login.subtitle": "Войдите, чтобы продолжить",
  "login.username": "Логин",
  "login.usernamePh": "Ваш логин",
  "login.password": "Пароль",
  "login.passwordPh": "Ваш пароль",
  "login.submit": "Войти",
  "login.submitting": "Вход…",
  "login.failed": "Не удалось войти",

  "admin.newUser": "Новый пользователь",
  "admin.login": "Логин",
  "admin.password8": "Пароль (мин. 8)",
  "admin.create": "Создать",
  "admin.users": "Пользователи",
  "admin.you": "это вы",
  "admin.templatesBtn": "Шаблоны ({count})",
  "admin.passwordBtn": "Пароль",
  "admin.confirmDelete": "Удалить пользователя «{name}» и все его шаблоны?",
  "admin.cantDeleteSelf": "Нельзя удалить себя",
  "admin.deleteUserTitle": "Удалить пользователя",
  "admin.deleteBtn": "Удалить",
  "admin.newPassword8": "Новый пароль (мин. 8)",
  "admin.changeBtn": "Сменить",
  "admin.noTemplates": "Нет сохранённых шаблонов.",
  "admin.deleteTemplateTitle": "Удалить шаблон",
  "admin.loadUsersFailed": "Не удалось загрузить пользователей",
  "admin.userCreated": "Пользователь «{name}» создан",
  "admin.createFailed": "Не удалось создать пользователя",
  "admin.userDeleted": "Пользователь «{name}» удалён",
  "admin.deleteFailed": "Не удалось удалить пользователя",
  "admin.passwordChanged": "Пароль пользователя «{name}» изменён",
  "admin.passwordFailed": "Не удалось сменить пароль",

  "ws.attachExcel": "Пожалуйста, прикрепите файл Excel",
  "ws.attachWord": "Пожалуйста, прикрепите хотя бы один файл Word",
  "ws.importFailed": "Ошибка при импорте узлов",
  "ws.applyPartial":
    "Применён «{name}»: восстановлено {matched} из {total} связей ({missed} без совпадений)",
  "ws.applyOk": "Применён «{name}»: восстановлено {matched} связей",
  "ws.applyFailed": "Не удалось применить шаблон",
  "ws.canvasHint":
    "Откройте «Файлы», загрузите таблицу и шаблоны, затем нажмите «Импортировать».",

  "process.runFailed": "Ошибка при запуске",

  "archiveModel.noOrange":
    'Не найден оранжевый узел ("разбивать на папки"). Пожалуйста, добавьте оранжевый узел.',
  "archiveModel.needGreenOrange":
    'Нужно соединение хотя бы одного зелёного узла с оранжевым узлом "разбивать на папки"',
  "archiveModel.buildFailed": "Ошибка при создании модели архива",

  "client.serverError": "Ошибка сервера ({status})",
  "client.noArchive": "Сервер не вернул архив",
};

const en: Dict = {
  "common.loading": "Loading…",
  "common.close": "Close",
  "common.hide": "Hide",
  "common.save": "Save",

  "lang.switch": "Interface language",

  "topbar.files": "Files",
  "topbar.generateModel": "Build archive model",
  "topbar.generatingModel": "Building model…",
  "topbar.run": "Run",
  "topbar.running": "Generating…",
  "topbar.admin": "Admin",
  "topbar.adminTitle": "User management",
  "topbar.loggedInAs": "Signed in as {name}",
  "topbar.logout": "Sign out",

  "role.admin": "admin",
  "role.userShort": "user",
  "role.user": "user",

  "data.title": "Data",
  "data.collapse": "Collapse panel",
  "data.import": "Import",
  "data.importing": "Importing…",
  "data.hint": "Upload a table and templates, then import the nodes onto the canvas.",

  "files.wordTitle": "Word templates",
  "files.chooseFiles": "Choose files",
  "files.excelTitle": "Excel table",
  "files.chooseExcel": "Choose Excel",
  "files.removeFile": "Remove file",

  "templates.title": "Connection templates",
  "templates.empty":
    "No templates yet. Connect the nodes, build the archive model and save the connections as a template — you can then apply it to a future import.",
  "templates.connections": "{count} connections",
  "templates.apply": "Apply",
  "templates.applyTitle": "Apply the template's connections",
  "templates.applyDisabledTitle": "Import nodes first",
  "templates.deleteTitle": "Delete template",
  "templates.deleteAria": "Delete template {name}",
  "templates.importToApply": "Import nodes to apply a template.",
  "templates.saved": "Template “{name}” saved ({count} connections)",
  "templates.saveFailed": "Failed to save the template",
  "templates.deleted": "Template “{name}” deleted",
  "templates.deleteFailed": "Failed to delete the template",

  "saveTpl.title": "Save connections as a template",
  "saveTpl.hint":
    "Saves the current connections under a name. Later they can be restored automatically after a new import (by matching names).",
  "saveTpl.placeholder": "Template name",

  "archive.title": "Archive model",
  "archive.hint":
    "Edit names right in the tree. Highlighted parts (from Excel) and file extensions can't be changed. A merged file's name contains the layout name by default and is fully editable (except the extension).",
  "archiveView.lockTitle": "Filled from Excel — cannot be changed",
  "archiveView.extTitle": "Extension is fixed",

  "validation.title": "Graph is incomplete",
  "validation.varNotConnected": "Variable “{label}” is not connected to a data source",
  "validation.templateNotConnected":
    "Template “{label}” is not connected to a data source (file name)",
  "validation.foldersNotConnected": "The folder-split field is not connected to a data source",

  "progress.title": "Generating documents",
  "progress.preparing": "Preparing…",
  "progress.phaseFill": "Filling templates",
  "progress.phaseMerge": "Merging into one file",

  "login.subtitle": "Sign in to continue",
  "login.username": "Username",
  "login.usernamePh": "Your username",
  "login.password": "Password",
  "login.passwordPh": "Your password",
  "login.submit": "Sign in",
  "login.submitting": "Signing in…",
  "login.failed": "Sign-in failed",

  "admin.newUser": "New user",
  "admin.login": "Username",
  "admin.password8": "Password (min. 8)",
  "admin.create": "Create",
  "admin.users": "Users",
  "admin.you": "you",
  "admin.templatesBtn": "Templates ({count})",
  "admin.passwordBtn": "Password",
  "admin.confirmDelete": "Delete user “{name}” and all of their templates?",
  "admin.cantDeleteSelf": "You can't delete yourself",
  "admin.deleteUserTitle": "Delete user",
  "admin.deleteBtn": "Delete",
  "admin.newPassword8": "New password (min. 8)",
  "admin.changeBtn": "Change",
  "admin.noTemplates": "No saved templates.",
  "admin.deleteTemplateTitle": "Delete template",
  "admin.loadUsersFailed": "Failed to load users",
  "admin.userCreated": "User “{name}” created",
  "admin.createFailed": "Failed to create the user",
  "admin.userDeleted": "User “{name}” deleted",
  "admin.deleteFailed": "Failed to delete the user",
  "admin.passwordChanged": "Password for “{name}” changed",
  "admin.passwordFailed": "Failed to change the password",

  "ws.attachExcel": "Please attach an Excel file",
  "ws.attachWord": "Please attach at least one Word file",
  "ws.importFailed": "Failed to import nodes",
  "ws.applyPartial":
    "Applied “{name}”: restored {matched} of {total} connections ({missed} unmatched)",
  "ws.applyOk": "Applied “{name}”: restored {matched} connections",
  "ws.applyFailed": "Failed to apply the template",
  "ws.canvasHint":
    "Open “Files”, upload a table and templates, then click “Import”.",

  "process.runFailed": "Generation failed",

  "archiveModel.noOrange":
    'No orange node ("split into folders") found. Please add an orange node.',
  "archiveModel.needGreenOrange":
    'At least one green node must be connected to the orange "split into folders" node',
  "archiveModel.buildFailed": "Failed to build the archive model",

  "client.serverError": "Server error ({status})",
  "client.noArchive": "The server did not return an archive",
};

export const translations: Record<Locale, Dict> = { ru, en };
