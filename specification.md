# Readme — инструкция по запуску

Readme — бэкенд блога из пяти микросервисов: Account, Publication, File, Notification и API Gateway. Клиентский интерфейс в проект не входит; запросы можно выполнять через Swagger. Схема сервисов: `specification.drawio` и `specification.drawio.png`.

## Требования

- Node.js 24 или 26 и npm. Локальная проверка выполнена на Node.js 24; Dockerfile сервисов использует Node.js 26.
- Docker Desktop с Linux-контейнерами либо Docker Engine.
- Docker Compose с поддержкой `include` (версия 2.20 или новее).

Команды ниже выполняются из директории `project` внутри корня репозитория:

```bash
cd project
npm ci
```

## Настройка окружения разработки

При первом запуске скопируйте `.env.example` в `.env` для каждого сервиса. Существующие `.env` не перезаписывайте.

```bash
cp apps/account/.env.example apps/account/.env
cp apps/publication/.env.example apps/publication/.env
cp apps/file/.env.example apps/file/.env
cp apps/notification/.env.example apps/notification/.env
cp apps/gateway/.env.example apps/gateway/.env
```

В PowerShell вместо `cp` можно использовать `Copy-Item`. Если PowerShell блокирует `npm.ps1` или `npx.ps1`, выполняйте команды через `npm.cmd` и `npx.cmd`.

В файлах `.env` замените все образцы паролей и секретов собственными значениями:

| Сервис       | Настройки                                                                                                                                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account      | `PORT`; `MONGO_HOST`, `MONGO_PORT`, `MONGO_DB`, `MONGO_USER`, `MONGO_PASSWORD`, `MONGO_AUTH_SOURCE`; `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, сроки действия токенов; `RABBITMQ_URL`, `RABBITMQ_QUEUE`; реквизиты Mongo Express |
| Publication  | `PORT`; `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, `DATABASE_URL`; реквизиты PgAdmin; `RABBITMQ_URL`, `RABBITMQ_QUEUE`; `SEED_USER_PASSWORD` для демонстрационных пользователей                        |
| File         | `PORT`, `UPLOAD_DIRECTORY` — каталог хранения изображений и метаданных                                                                                                                                                            |
| Notification | `PORT`; реквизиты MongoDB, Mongo Express и RabbitMQ; `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM`; `MAILPIT_UI_PORT`; при необходимости пара `SMTP_USER`/`SMTP_PASSWORD`                                                  |
| Gateway      | `PORT`; `ACCOUNT_URL`, `PUBLICATION_URL`, `FILE_URL`, `NOTIFICATION_URL`; `JWT_ACCESS_SECRET`, `HTTP_TIMEOUT`; при необходимости `CORS_ORIGIN`                                                                                    |

Настройки, которые должны совпадать:

- `JWT_ACCESS_SECRET` в Account и Gateway. Секреты доступа и обновления должны различаться и содержать минимум 32 символа каждый.
- `RABBITMQ_URL` и `RABBITMQ_QUEUE` в Account, Publication и Notification. Логин и пароль внутри URL должны совпадать с `RABBITMQ_USER` и `RABBITMQ_PASSWORD` в Notification.
- Реквизиты в `DATABASE_URL` и переменные `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` в Publication.

Для приложений, запущенных на компьютере, адрес инфраструктуры — `localhost`. Пароли MongoDB должны содержать минимум 8 символов. Специальные символы в логинах и паролях внутри URL кодируйте, либо используйте случайные значения из URL-безопасных символов. Файлы `.env` и `.env.stage` исключены из Git.

## Запуск разработки

Сначала поднимите MongoDB, PostgreSQL 14, RabbitMQ, Mailpit и административные интерфейсы:

```bash
npm run infra:up
```

После готовности контейнеров с БД и RabbitMQ сгенерируйте Prisma Client, примените миграции и запустите приложения:

```bash
npx nx run @project/publication:db-generate
npx nx run @project/publication:db-migrate
npm start
```

`npm start` собирает и запускает все пять сервисов. Приложения останавливаются через `Ctrl+C`; инфраструктурные контейнеры продолжают работать.

| Ресурс                      | Адрес по умолчанию               |
| --------------------------- | -------------------------------- |
| Swagger API Gateway         | http://localhost:3004/swagger    |
| Проверка Gateway            | http://localhost:3004/api/health |
| Swagger Account             | http://localhost:3000/swagger    |
| Swagger Publication         | http://localhost:3001/swagger    |
| Swagger File                | http://localhost:3002/swagger    |
| Swagger Notification        | http://localhost:3003/swagger    |
| Mailpit — полученные письма | http://localhost:8025            |
| Mongo Express Account       | http://localhost:8081            |
| Mongo Express Notification  | http://localhost:8083            |
| PgAdmin                     | http://localhost:8082            |
| RabbitMQ Management         | http://localhost:15672           |

Порты инфраструктуры: MongoDB Account — `27017`, MongoDB Notification — `27018`, PostgreSQL — `5432`, RabbitMQ — `5672`, тестовый SMTP — `1025`. Порты изменяются через `.env`; зависимые URL необходимо обновлять вместе с ними.

Для первоначального заполнения небольшим набором демонстрационных данных выполните:

```bash
npm run db:fill
```

Перед этим задайте `SEED_USER_PASSWORD` длиной 6–12 символов в `apps/publication/.env`. Сценарий также создаёт авторов в MongoDB Account и отправляет события через RabbitMQ, поэтому эти сервисы должны работать.

Для проверки схемы доступна команда `npx nx run @project/publication:db-validate`. Команда `npx nx run @project/publication:db-reset` удаляет данные БД; для обычного запуска используйте `db-migrate`.

Для остановки инфраструктуры без удаления томов:

```bash
docker compose --env-file apps/account/.env -f apps/account/docker-compose.dev.yml down
docker compose --env-file apps/publication/.env -f apps/publication/docker-compose.dev.yml down
docker compose --env-file apps/notification/.env -f apps/notification/docker-compose.dev.yml down
```

Изменение пароля в `.env` не меняет пароль пользователя в уже созданном томе БД. Том с существующими данными сохраняйте; реквизиты обновляются отдельно средствами СУБД.

## Проверка API

В Swagger Gateway зарегистрируйте пользователя через `POST /api/users/register`, войдите через `POST /api/users/login` и вставьте `accessToken` в окно **Authorize**. Токен обновления не применяется вместо токена доступа. Смена пароля: `PATCH /api/users/password` с текущим и новым паролями.

Аватар загружается через `POST /api/files/avatar`, фотография публикации — через `POST /api/files`. Используется multipart-поле `file`. Допускаются JPEG и PNG, размер аватара — до 500 КиБ, фото — до 1 МиБ. Передавайте полученный идентификатор в `avatarId` или `photoId`; изображение доступно по возвращаемому `path`.

Ресурс `/api/publications` поддерживает пять форматов публикаций, фильтрацию, сортировку, пагинацию, черновики, поиск, комментарии, лайки и репосты. Подписки доступны через `/api/subscriptions`, персональная лента — через `/api/publications/feed`. Тела запросов, параметры и схемы ответов описаны в Swagger. Примеры прямых запросов к сервису публикаций: `apps/publication/publication.http`.

Рассылка запускается авторизованным запросом `POST /api/notifications/send`. Уведомления получают зарегистрированные пользователи, письмо содержит новые публикации с предыдущей рассылки. В разработке письма принимает Mailpit. События пользователей и публикаций передаются асинхронно через RabbitMQ и сохраняются для повторной доставки при сбое. Внешнее расписание при необходимости вызывает этот HTTP-обработчик; сервис Notification сам не планирует рассылку.

## Запуск приложения целиком в Docker

При первом запуске скопируйте `.env.stage.example` в `.env.stage` в директории `project`:

```bash
cp .env.stage.example .env.stage
```

Существующий файл не перезаписывайте. Замените все образцы паролей и секретов собственными значениями, учитывая требования к JWT и URL выше.

```bash
npm run stage:build
npm run stage:up
```

Корневой `project/docker-compose.stage.yml` объединяет конфигурации всех сервисов. Перед запуском Publication автоматически применяются миграции PostgreSQL. Проверка состояния контейнеров:

```bash
docker compose --env-file .env.stage -f docker-compose.stage.yml ps
```

Swagger доступен по адресу http://localhost:4000/swagger, проверка Gateway — http://localhost:4000/api/health, Mailpit — http://localhost:8026. Порты настраиваются через `GATEWAY_PORT` и `MAILPIT_UI_PORT`. Внутренние API и БД из stage-конфигурации не публикуются наружу; Mailpit привязан к локальному компьютеру.

Остановка с сохранением данных:

```bash
npm run stage:down
```

БД и изображения хранятся в именованных томах. Не добавляйте `-v` к `down`, если данные нужно сохранить.

## Проверки проекта

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e:all
```

Для сквозной проверки должны работать инфраструктура разработки и все пять приложений. Используются настройки `.env` и локальный Mailpit. Сценарий создаёт собственные записи с уникальными адресами, проверяет обязательные функции, подписки и ленту, затем удаляет свои данные, изображения и тестовые письма. Запускайте его только на окружении разработки, а не на рабочей БД или реальном SMTP-сервере.
