const { pgClient, stripe } = require('../client.js');

let id;

beforeAll(async () => {
  ({ id } = await stripe.customers.create({
    email: 'test-user@email.com',
    name: 'Test User',
    metadata: { username: 'testUser' },
  }));

  const query = `
    INSERT INTO users
      (username, first_name, last_name, password, email, s_cus_id, verified)
    VALUES ('testUser', 'Test', 'User', 'secure', 'test-user@email.com', $1, True)`;
  await pgClient.connect();
  await pgClient.query(query, [id]);
});

afterAll(async () => {
  const query = `DELETE FROM users WHERE username = 'testUser'`;

  await Promise.all([
    stripe.customers.del(id),
    pgClient.query(query),
  ]);

  await pgClient.end();
})

test('This should run', () => {
  expect(1+1).toBe(2);
});