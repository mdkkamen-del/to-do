# To-Do менеджер

Небольшое веб‑приложение для общего беклога задач, матрицы Эйзенхауэра и группировки по проектам.

## Запуск (для обычного пользователя)

1. Установите [Node.js](https://nodejs.org/) (он включает `npm`).
2. В папке проекта выполните команды:

   ```bash
   npm install
   npm start
   ```

3. Откройте в браузере:

   ```
   http://localhost:8000/index.html
   ```

Сервер запускается через `http-server` на порту 8000.

## Запуск через EXE (Windows)

Если нужен запуск «двойным кликом», можно собрать EXE‑файл один раз, а дальше запускать его как обычную программу.

1. Установите [Node.js](https://nodejs.org/).
2. В папке проекта выполните:

   ```bash
   npm install
   npm run build:exe
   ```

3. Появится файл `todo-launcher.exe`. Запускайте его двойным кликом — он поднимет локальный сервер и откроет приложение в браузере.

> Примечание: EXE собирается командой `pkg` из скрипта `launcher.js`.

## Синхронизация с Google Таблицей (Google Apps Script)

Это полноценная двусторонняя синхронизация: можно загружать задачи из таблицы и отправлять их обратно.

### 1) Создайте Google Таблицу

Добавьте лист с названием `Tasks`.

### 2) Добавьте Apps Script

Откройте **Расширения → Apps Script** и вставьте код ниже:

```javascript
const SHEET_NAME = "Tasks";

function buildResponse_(data, callback) {
  const json = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(`${callback}(${json});`).setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
  }
  return ContentService.createTextOutput(json).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const header = rows.shift() || [];
  const tasks = rows.map((row) => {
    const item = {};
    header.forEach((key, index) => {
      item[key] = row[index];
    });
    return item;
  });
  return buildResponse_({ tasks }, e && e.parameter && e.parameter.callback);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const payload = JSON.parse(e.postData.contents);
  const tasks = payload.tasks || [];
  const header = ["id", "title", "description", "project", "importance", "urgency", "status"];
  sheet.clearContents();
  sheet.appendRow(header);
  tasks.forEach((task) => {
    sheet.appendRow(header.map((key) => task[key] || ""));
  });
  return buildResponse_({ ok: true }, e && e.parameter && e.parameter.callback);
}
```

### 3) Опубликуйте скрипт как веб‑приложение

1. Нажмите **Развернуть → Новое развертывание**.
2. Тип: **Веб‑приложение**.
3. Доступ: **Все**.
4. Скопируйте URL веб‑приложения.
5. Если меняли код, разверните новую версию и используйте актуальный URL.

> Примечание: Google Apps Script не поддерживает добавление CORS‑заголовков в `ContentService`.
> Поэтому загрузка делается через JSONP (параметр `callback`), а отправка — обычным `POST`,
> после которого можно нажать «Загрузить», чтобы убедиться, что данные обновились.

### 4) Подключите приложение

В интерфейсе приложения вставьте URL в поле **“URL веб‑приложения Google Apps Script”** и используйте кнопки:

- **Загрузить из таблицы** — подтянуть задачи из Google Sheets.
- **Отправить в таблицу** — записать текущие задачи в Google Sheets.
