import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseEnv } from 'node:util';
import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';

const nonce = Date.now().toString();
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=',
  'base64',
);
const getEnvironment = (name: string): Record<string, string | undefined> =>
  existsSync(`apps/${name}/.env`)
    ? parseEnv(readFileSync(`apps/${name}/.env`, 'utf8'))
    : {};
const gatewayEnvironment = getEnvironment('gateway');
const baseUrl = `http://localhost:${gatewayEnvironment.PORT ?? 3004}/api`;
const state = {
  users: [] as string[],
  emails: [] as string[],
  files: [] as string[],
  publications: [] as string[],
  mailIds: [] as string[],
  mailbox: '',
};
const prisma = new PrismaClient({
  datasources: { db: { url: getEnvironment('publication').DATABASE_URL } },
});

interface User {
  id: string;
  email: string;
  name: string;
  publicationCount: number;
  subscriberCount: number;
}
interface Tokens {
  accessToken: string;
  refreshToken: string;
}
interface Post {
  id: string;
  authorId: string;
  author: User;
  originalAuthorId?: string;
  originalPublicationId?: string;
  title?: string;
  createdAt: string;
  publishedAt: string;
  likeCount: number;
  commentCount: number;
}
interface Image {
  id: string;
  path: string;
}
interface MailList {
  messages: { ID: string; To: { Address: string }[] }[];
}
interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
}

async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
  expected = 200,
): Promise<T> {
  const response = await fetch(baseUrl + path, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body:
      options.body instanceof FormData
        ? options.body
        : options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : undefined;
  assert.equal(
    response.status,
    expected,
    `${options.method ?? 'GET'} ${path}: ${text}`,
  );
  return body as T;
}

async function upload(
  path: string,
  size: number,
  token?: string,
  expected = 201,
): Promise<Image> {
  const bytes = Buffer.concat([PNG, Buffer.alloc(size - PNG.length)]);
  const form = new FormData();
  form.append('file', new Blob([bytes]), `verification-${nonce}.png`);
  const image = await request<Image>(
    path,
    { method: 'POST', body: form, token },
    expected,
  );
  if (expected === 201) {
    state.files.push(image.id);
    const response = await fetch(baseUrl.replace(/\/api$/, '') + image.path);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
  }
  return image;
}

async function register(
  label: string,
  avatarId?: string,
): Promise<{ user: User; tokens: Tokens }> {
  const email = `verify-${nonce}-${label}@example.com`;
  state.emails.push(email);
  const user = await request<User>(
    '/users/register',
    {
      method: 'POST',
      body: {
        email,
        name: `Verification ${label}`,
        password: 'secret12',
        ...(avatarId ? { avatarId } : {}),
      },
    },
    201,
  );
  state.users.push(user.id);
  assert.equal('passwordHash' in user, false);
  const tokens = await request<Tokens>('/users/login', {
    method: 'POST',
    body: { email, password: 'secret12' },
  });
  return { user, tokens };
}

async function create(body: object, token: string): Promise<Post> {
  const post = await request<Post>(
    '/publications',
    {
      method: 'POST',
      body,
      token,
      headers: { 'x-user-id': '00000000-0000-4000-8000-000000000099' },
    },
    201,
  );
  state.publications.push(post.id);
  assert.equal(post.createdAt, post.publishedAt);
  return post;
}

async function connect(name: string) {
  const serviceEnvironment = getEnvironment(name);
  const get = (key: string): string => {
    const value = serviceEnvironment[key];
    assert.ok(value, `${name}: missing ${key}`);
    return value;
  };
  const uri = `mongodb://${encodeURIComponent(get('MONGO_USER'))}:${encodeURIComponent(get('MONGO_PASSWORD'))}@${get('MONGO_HOST')}:${get('MONGO_PORT')}/${get('MONGO_DB')}?authSource=${get('MONGO_AUTH_SOURCE')}`;
  return mongoose.createConnection(uri).asPromise();
}

async function waitForNotificationChanges(
  updated: Post,
  withdrawn: Post,
  removed: Post,
) {
  const connection = await connect('notification');
  try {
    const publications = connection.db!.collection('notification_publications');
    const deadline = Date.now() + 5000;
    while (true) {
      const pending = await publications
        .find({
          publicationId: { $in: [updated.id, withdrawn.id, removed.id] },
        })
        .toArray();
      if (
        pending.some(
          (post) =>
            post.publicationId === updated.id && post.title === updated.title,
        ) &&
        !pending.some(
          (post) =>
            post.publicationId === withdrawn.id ||
            post.publicationId === removed.id,
        )
      ) {
        break;
      }
      assert.ok(
        Date.now() < deadline,
        'RabbitMQ updates were not applied before sending the digest',
      );
      await new Promise((done) => setTimeout(done, 100));
    }
  } finally {
    await connection.close();
  }
}

async function verifyMail(
  token: string,
  updated: Post,
  withdrawn: Post,
  removed: Post,
): Promise<void> {
  const serviceEnvironment = getEnvironment('notification');
  assert.ok(
    ['localhost', '127.0.0.1'].includes(serviceEnvironment.SMTP_HOST ?? '') &&
      serviceEnvironment.SMTP_PORT === '1025',
    'Email verification requires the local Fake SMTP server',
  );
  await waitForNotificationChanges(updated, withdrawn, removed);
  await request('/notifications/send', { method: 'POST' }, 401);
  const port = Number(serviceEnvironment.MAILPIT_UI_PORT ?? 8025);
  assert.ok(Number.isInteger(port) && port > 0 && port <= 65535);
  const mailbox = `http://localhost:${port}`;
  state.mailbox = mailbox;
  const before = (await (
    await fetch(mailbox + '/api/v1/messages')
  ).json()) as MailList;
  const existingIds = new Set(before.messages.map((message) => message.ID));
  const result = await request<{
    recipientCount: number;
    publicationCount: number;
  }>('/notifications/send', { method: 'POST', token });
  assert.ok(
    result.recipientCount >= state.users.length && result.publicationCount > 0,
  );
  const inbox = (await (
    await fetch(mailbox + '/api/v1/messages')
  ).json()) as MailList;
  for (const summary of inbox.messages.filter(
    (message) => !existingIds.has(message.ID),
  )) {
    const captured = (await (
      await fetch(mailbox + '/api/v1/message/' + summary.ID)
    ).json()) as { Text: string };
    if (state.publications.some((id) => captured.Text.includes(id))) {
      state.mailIds.push(summary.ID);
    }
  }
  const message = inbox.messages.find((mail) =>
    mail.To.some((recipient) => recipient.Address === state.emails[0]),
  );
  assert.ok(message, 'No digest was delivered to the registered user');
  const mail = (await (
    await fetch(mailbox + '/api/v1/message/' + message.ID)
  ).json()) as { Text: string };
  assert.ok(
    mail.Text.includes(updated.title!) &&
      !mail.Text.includes(withdrawn.id) &&
      !mail.Text.includes(removed.id),
  );
  assert.deepEqual(
    await request('/notifications/send', { method: 'POST', token }),
    { recipientCount: 0, publicationCount: 0 },
  );
}

type CoreActors = Awaited<ReturnType<typeof verifyAuthentication>>;
type CoreContext = CoreActors & { posts: Post[]; title: string };

async function verifyAuthentication() {
  await request('/health');
  await request('/publications');
  const invalid = await request<{ message: string[] }>(
    '/users/register',
    { method: 'POST', body: { email: 'bad', name: 'a', password: 'x' } },
    400,
  );
  assert.ok(invalid.message.length >= 3);
  await request('/publications', { method: 'POST', body: {} }, 401);
  await upload('/files/avatar', 500 * 1024 + 1, undefined, 413);
  const avatar = await upload('/files/avatar', 500 * 1024);
  const first = await register('first', avatar.id);
  const second = await register('second');
  const token = first.tokens.accessToken;
  const other = second.tokens.accessToken;
  await request('/users/me', { token: first.tokens.refreshToken }, 401);
  await request(
    '/users/register',
    {
      method: 'POST',
      token,
      body: {
        email: 'blocked@example.com',
        name: 'Blocked Reader',
        password: 'secret12',
      },
    },
    403,
  );
  const photo = await upload('/files', 1024 * 1024, token);
  await upload('/files', 1024 * 1024 + 1, token, 413);
  await request(
    '/users/register',
    {
      method: 'POST',
      body: {
        email: 'oversized@example.com',
        name: 'Oversized Reader',
        password: 'secret12',
        avatarId: photo.id,
      },
    },
    400,
  );
  return { first, second, token, other, photo };
}

async function createPublicationFormats({ first, token, photo }: CoreActors) {
  const title = `Verification video ${nonce}`;
  const posts: Post[] = [];
  for (const data of [
    { type: 'video', title, videoUrl: 'https://youtu.be/dQw4w9WgXcQ' },
    {
      type: 'text',
      title: `Verification text ${nonce}`,
      announcement: 'a'.repeat(50),
      text: 't'.repeat(100),
    },
    {
      type: 'quote',
      text: 'A quotation which is sufficiently long',
      quoteAuthor: 'Author',
    },
    { type: 'photo', photoId: photo.id },
    { type: 'link', linkUrl: 'https://example.com' },
  ]) {
    posts.push(await create({ ...data, tags: ['Testing', 'testing'] }, token));
  }
  assert.ok(
    posts.every(
      (post) =>
        post.authorId === first.user.id && post.author.id === first.user.id,
    ),
  );
  return { posts, title };
}

async function verifyInvalidPublications({ token, title }: CoreContext) {
  for (const tags of [
    ['tag', null],
    ['tag', 42],
    Array(9).fill('same'),
    null,
  ]) {
    await request(
      '/publications',
      {
        method: 'POST',
        token,
        body: { type: 'link', linkUrl: 'https://example.com', tags },
      },
      400,
    );
  }
  await request(
    '/publications',
    {
      method: 'POST',
      token,
      body: { type: 'link', linkUrl: 'https://example.com', title },
    },
    400,
  );
  await request(
    '/publications',
    {
      method: 'POST',
      token,
      body: {
        type: 'link',
        linkUrl: 'https://example.com',
        publishedAt: new Date().toISOString(),
      },
    },
    400,
  );
}

async function verifyInvalidPublicationEdits({
  first,
  posts,
  token,
  other,
}: CoreContext) {
  for (const publishedAt of [
    '20261030',
    '2026-W44-5',
    '2026-303',
    '2026-02-30',
  ]) {
    await request(
      '/publications/' + posts[0].id,
      { method: 'PATCH', token, body: { publishedAt } },
      400,
    );
  }
  await request(
    '/publications/' + posts[0].id,
    { method: 'PATCH', token, body: { title: 'short' } },
    400,
  );
  await request(
    '/publications/' + posts[2].id,
    { method: 'PATCH', token, body: { text: 'q'.repeat(301) } },
    400,
  );
  await request(
    '/publications/' + posts[0].id,
    { method: 'PATCH', token, body: { title: null } },
    400,
  );
  await request(
    '/publications/' + posts[0].id,
    {
      method: 'PATCH',
      token: other,
      headers: { 'x-user-id': first.user.id },
      body: { tags: ['edited'] },
    },
    403,
  );
}

async function verifyPublicationEditsAndLists({
  first,
  posts,
  token,
  other,
}: CoreContext) {
  const changedTitle = `Updated video title ${nonce}`;
  const updated = await request<Post>('/publications/' + posts[0].id, {
    method: 'PATCH',
    token,
    body: { title: changedTitle, publishedAt: '2025-01-01T00:00:00.000Z' },
  });
  assert.equal(updated.publishedAt, '2025-01-01T00:00:00.000Z');
  const withdrawn = posts[4];
  await request('/publications/' + withdrawn.id, {
    method: 'PATCH',
    token,
    body: { status: 'draft' },
  });
  await request('/publications/' + withdrawn.id, {}, 404);
  await request('/publications/' + withdrawn.id, { token });
  await request('/publications/' + withdrawn.id, { token: other }, 404);
  await request(
    '/publications/' + withdrawn.id + '/likes',
    { method: 'POST', token: other },
    404,
  );
  await request(
    '/publications/' + withdrawn.id + '/comments',
    {
      method: 'POST',
      token: other,
      body: { text: 'A comment on a hidden draft' },
    },
    404,
  );
  assert.ok(
    (await request<Post[]>('/publications/drafts', { token })).some(
      (post) => post.id === withdrawn.id,
    ),
  );
  const query = `?authorId=${first.user.id}`;
  assert.equal((await request<Post[]>('/publications' + query)).length, 4);
  assert.equal(
    (await request<Post[]>('/publications' + query + '&type=quote&tag=testing'))
      .length,
    1,
  );
  const page1 = await request<Post[]>(
    '/publications' + query + '&limit=1&page=1',
  );
  const page2 = await request<Post[]>(
    '/publications' + query + '&limit=1&page=2',
  );
  assert.notEqual(page1[0].id, page2[0].id);
  await request('/publications?limit=26', {}, 400);
  assert.ok(
    (
      await request<Post[]>(
        '/publications/search?title=' + encodeURIComponent(changedTitle),
      )
    ).some((post) => post.id === updated.id),
  );
  return { updated, withdrawn, query };
}

async function verifyCommentPagination(
  post: Post,
  token: string,
  other: string,
) {
  await Promise.all([
    ...Array.from({ length: 49 }, (_value, index) =>
      request(
        '/publications/' + post.id + '/comments',
        {
          method: 'POST',
          token: other,
          body: { text: 'Pagination comment ' + index },
        },
        201,
      ),
    ),
    request('/publications/' + post.id, {
      method: 'PATCH',
      token,
      body: { tags: ['edited'] },
    }),
  ]);
  assert.equal(
    (await request<Post>('/publications/' + post.id)).commentCount,
    51,
  );
  assert.equal(
    (await request<unknown[]>('/publications/' + post.id + '/comments')).length,
    50,
  );
  assert.equal(
    (await request<unknown[]>('/publications/' + post.id + '/comments?page=2'))
      .length,
    1,
  );
}

async function verifyInteractions({
  posts,
  token,
  other,
  query,
}: CoreContext & { query: string }) {
  const likeResults = await Promise.all(
    Array.from({ length: 4 }, async () => {
      const response = await fetch(
        baseUrl + '/publications/' + posts[1].id + '/likes',
        { method: 'POST', headers: { Authorization: 'Bearer ' + other } },
      );
      return response.status;
    }),
  );
  assert.ok(likeResults.every((status) => status === 201 || status === 409));
  assert.equal(likeResults.filter((status) => status === 201).length, 1);
  const comments = await Promise.all(
    [0, 1].map(async (index) =>
      request<{ id: string }>(
        '/publications/' + posts[1].id + '/comments',
        {
          method: 'POST',
          token: other,
          body: { text: `Concurrent comment ${index}` },
        },
        201,
      ),
    ),
  );
  await request('/publications/' + posts[1].id, {
    method: 'PATCH',
    token,
    body: { tags: ['edited'] },
  });
  const counted = await request<Post>('/publications/' + posts[1].id);
  assert.equal(counted.likeCount, 1);
  assert.equal(counted.commentCount, 2);
  await verifyCommentPagination(posts[1], token, other);
  const sorted = await request<Post[]>('/publications' + query + '&sort=likes');
  assert.equal(sorted[0].id, posts[1].id);
  await request(
    '/publications/' + posts[1].id + '/comments/' + comments[0].id,
    { method: 'DELETE', token },
    403,
  );
}

async function verifyRepostsAndCascade({
  first,
  posts,
  token,
  other,
}: CoreContext) {
  const repostResponses = await Promise.all(
    Array.from({ length: 4 }, () =>
      fetch(baseUrl + '/publications/' + posts[3].id + '/repost', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + other },
      }),
    ),
  );
  assert.equal(
    repostResponses.filter((response) => response.status === 201).length,
    1,
  );
  assert.ok(
    repostResponses.every(
      (response) => response.status === 201 || response.status === 409,
    ),
  );
  const repost = (await repostResponses
    .find((response) => response.status === 201)!
    .json()) as Post;
  state.publications.push(repost.id);
  assert.equal(repost.originalAuthorId, first.user.id);
  await request(
    '/publications/' + posts[3].id + '/repost',
    { method: 'POST', token: other },
    409,
  );
  await request(
    '/publications/' + repost.id + '/repost',
    { method: 'POST', token },
    400,
  );
  await request(
    '/publications/' + posts[3].id,
    { method: 'DELETE', token },
    204,
  );
  const retained = await request<Post>('/publications/' + repost.id);
  assert.equal(retained.originalPublicationId, posts[3].id);
  await request(
    '/publications/' + posts[1].id,
    { method: 'DELETE', token },
    204,
  );
  assert.equal(
    await prisma.comment.count({ where: { publicationId: posts[1].id } }),
    0,
  );
  assert.equal(
    await prisma.like.count({ where: { publicationId: posts[1].id } }),
    0,
  );
}

async function verifyPasswordChange({ first, token }: CoreActors) {
  await request(
    '/users/password',
    {
      method: 'PATCH',
      token,
      body: { currentPassword: 'wrong123', newPassword: 'changed12' },
    },
    401,
  );
  await request(
    '/users/password',
    {
      method: 'PATCH',
      token,
      body: { currentPassword: 'secret12', newPassword: 'changed12' },
    },
    204,
  );
  await request(
    '/users/login',
    { method: 'POST', body: { email: first.user.email, password: 'secret12' } },
    401,
  );
  await request('/users/login', {
    method: 'POST',
    body: { email: first.user.email, password: 'changed12' },
  });
}

async function verifyPagination({
  token,
  query,
}: CoreContext & { query: string }) {
  const paging: Post[] = [];
  for (let index = 0; index < 26; index++) {
    paging.push(
      await create(
        { type: 'link', linkUrl: 'https://example.com/page/' + index },
        token,
      ),
    );
  }
  const defaultPage = await request<Post[]>('/publications' + query);
  const remainder = await request<Post[]>('/publications' + query + '&page=2');
  assert.equal(defaultPage.length, 25);
  assert.equal(remainder.length, 3);
  assert.equal(
    new Set([...defaultPage, ...remainder].map((post) => post.id)).size,
    28,
  );
  const notification = await connect('notification');
  try {
    const deadline = Date.now() + 5000;
    while (
      (await notification
        .db!.collection('notification_publications')
        .countDocuments({
          publicationId: { $in: paging.map((post) => post.id) },
        })) !== paging.length
    ) {
      assert.ok(
        Date.now() < deadline,
        'Publication events did not reach notification',
      );
      await new Promise((done) => setTimeout(done, 100));
    }
  } finally {
    await notification.close();
  }
}

async function verifySwagger() {
  const swagger = (await (
    await fetch(baseUrl.replace(/\/api$/, '') + '/swagger-json')
  ).json()) as {
    components: {
      securitySchemes: { bearer: object };
      schemas: Record<string, object>;
    };
  };
  assert.ok(
    swagger.components.securitySchemes.bearer &&
      swagger.components.schemas.PublicationResponseDto,
  );
}

async function verifyCore() {
  const actors = await verifyAuthentication();
  const context = { ...actors, ...(await createPublicationFormats(actors)) };
  await verifyInvalidPublications(context);
  await verifyInvalidPublicationEdits(context);
  const { updated, withdrawn, query } =
    await verifyPublicationEditsAndLists(context);
  await verifyInteractions({ ...context, query });
  await verifyRepostsAndCascade(context);
  await verifyPasswordChange(actors);
  await verifyMail(actors.token, updated, withdrawn, context.posts[3]);
  await verifyPagination({ ...context, query });
  await verifySwagger();
  console.log('Core HTTP scenarios: passed');
  return actors;
}

async function createFeedFixtures({ first, token, other }: CoreActors) {
  const third = await register('third');
  const followed = await create(
    {
      type: 'quote',
      text: 'A followed author quote for the feed',
      quoteAuthor: 'Following Author',
      tags: ['tagged'],
    },
    other,
  );
  await create(
    {
      type: 'quote',
      text: 'An unrelated author quote for the feed',
      quoteAuthor: 'Unrelated Author',
      tags: ['tagged'],
    },
    third.tokens.accessToken,
  );
  const own = await request<Post[]>('/publications/feed', { token });
  assert.ok(
    own.length > 0 && own.every((post) => post.authorId === first.user.id),
  );
  return { third, followed };
}

type FeedContext = CoreActors & Awaited<ReturnType<typeof createFeedFixtures>>;

async function verifySubscriptions({ first, second, token }: CoreActors) {
  await request('/publications/feed', {}, 401);
  await request('/subscriptions/' + second.user.id, { method: 'POST' }, 401);
  await request(
    '/subscriptions/' + first.user.id,
    { method: 'POST', token },
    400,
  );
  await request(
    '/subscriptions/00000000-0000-4000-8000-000000000099',
    { method: 'POST', token },
    404,
  );
  const subscriptions = await Promise.all(
    Array.from({ length: 6 }, () =>
      request<{ id: string }>(
        '/subscriptions/' + second.user.id,
        { method: 'POST', token },
        201,
      ),
    ),
  );
  assert.equal(
    new Set(subscriptions.map((subscription) => subscription.id)).size,
    1,
  );
  assert.equal(
    (await request<User>('/users/' + second.user.id)).subscriberCount,
    1,
  );
  assert.equal(
    (
      await request<unknown[]>('/subscriptions', {
        token,
        headers: { 'x-user-id': second.user.id },
      })
    ).length,
    1,
  );
}

async function verifyFeedSelection({
  first,
  second,
  token,
  third,
  followed,
}: FeedContext) {
  const feed = await request<Post[]>('/publications/feed', { token });
  assert.ok(feed.some((post) => post.id === followed.id));
  assert.ok(
    feed.every((post) =>
      [first.user.id, second.user.id].includes(post.authorId),
    ),
  );
  assert.deepEqual(
    await request('/publications/feed?authorId=' + third.user.id, { token }),
    [],
  );
  const tagged = await request<Post[]>(
    '/publications/feed?type=quote&tag=TAGGED',
    { token },
  );
  assert.deepEqual(
    tagged.map((post) => post.id),
    [followed.id],
  );
  const firstPage = await request<Post[]>('/publications/feed?limit=1&page=1', {
    token,
  });
  const secondPage = await request<Post[]>(
    '/publications/feed?limit=1&page=2',
    { token },
  );
  assert.notEqual(firstPage[0].id, secondPage[0].id);
}

async function verifyUnsubscription({ first, second, token }: CoreActors) {
  await request(
    '/subscriptions/' + second.user.id,
    { method: 'DELETE', token },
    204,
  );
  await request(
    '/subscriptions/' + second.user.id,
    { method: 'DELETE', token },
    204,
  );
  assert.equal(
    (await request<User>('/users/' + second.user.id)).subscriberCount,
    0,
  );
  assert.deepEqual(await request('/subscriptions', { token }), []);
  assert.ok(
    (await request<Post[]>('/publications/feed', { token })).every(
      (post) => post.authorId === first.user.id,
    ),
  );
}

async function verifyOptional(actors: CoreActors): Promise<void> {
  const fixtures = await createFeedFixtures(actors);
  await verifySubscriptions(actors);
  await verifyFeedSelection({ ...actors, ...fixtures });
  await verifyUnsubscription(actors);
  console.log('Subscriptions and personal feed HTTP scenarios: passed');
}

async function cleanup(): Promise<void> {
  const account = await connect('account');
  try {
    const users = await account
      .db!.collection('users')
      .find({ email: { $in: state.emails } })
      .project({ _id: 1 })
      .toArray();
    const ids = users.map((user) => user._id as unknown as string);
    await prisma.publication.deleteMany({ where: { authorId: { in: ids } } });
    await account
      .db!.collection('subscriptions')
      .deleteMany({ subscriberId: { $in: ids } });
    await account
      .db!.collection('users')
      .deleteMany({ email: { $in: state.emails } });
  } finally {
    await account.close();
  }
  const notification = await connect('notification');
  try {
    await notification
      .db!.collection('notification_subscribers')
      .deleteMany({ userId: { $in: state.users } });
    await notification
      .db!.collection('notification_publications')
      .deleteMany({ publicationId: { $in: state.publications } });
  } finally {
    await notification.close();
  }
  const directory = resolve(
    getEnvironment('file').UPLOAD_DIRECTORY ?? 'apps/file/uploads',
  );
  for (const id of state.files) {
    assert.match(id, /^[a-f0-9-]{36}$/i);
    for (const extension of ['bin', 'json']) {
      const target = resolve(join(directory, `${id}.${extension}`));
      assert.equal(dirname(target), directory);
      try {
        await unlink(target);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    }
  }
  await prisma.$disconnect();
  if (state.mailIds.length > 0) {
    assert.ok(state.mailbox.startsWith('http://localhost:'));
    assert.ok(state.mailIds.every((id) => /^[a-zA-Z0-9_-]+$/.test(id)));
    const response = await fetch(state.mailbox + '/api/v1/messages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IDs: state.mailIds }),
    });
    assert.equal(
      response.status,
      200,
      'Failed to remove own Fake SMTP messages',
    );
  }
  console.log('Own verification records and images removed');
}

function reportFailure(error: unknown): void {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function main(): Promise<void> {
  try {
    const actors = await verifyCore();
    if (process.argv.includes('--optional')) {
      await verifyOptional(actors);
    }
  } catch (error) {
    reportFailure(error);
  } finally {
    try {
      await cleanup();
    } catch (error) {
      reportFailure(error);
    }
  }
}

void main();
